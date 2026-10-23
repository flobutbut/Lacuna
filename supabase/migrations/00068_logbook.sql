-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Journal de bord (LACUNA_UI.md, module Journal ; LACUNA_NOTIFICATIONS.md VOY-001, VOY-007, CIE-001 à 004)
--
--   • Calendrier du vaisseau (LACUNA_GDD.md §2) : départ le 1er janvier 2187, plus la durée physique des voyages
--     (table de référence de src/lib/transit.js) et le temps réel passé en orbite. Format AAAA-MM-JJ (année de 365 jours).
--   • logbook_entries : famille, contexte (« En orbite — Sol »), clé d'unicité par vaisseau.
--   • Le serveur écrit seul les entrées AUTO et GENERATIONNEL :
--       – fondatrice à la création du vaisseau ;
--       – départ et arrivée (changement de travel_state) ;
--       – montée et bouffée de neutrinos (insertion des signaux de SN-001) ;
--       – sortie du choc et première impulsion de LPT-001 : RPC log_sky_event, appelée par le client
--         au bon moment et vérifiée côté serveur.
--   • Le joueur n'écrit que des entrées MANUEL (titre, texte) ; date, contexte et génération sont fixés par le serveur.
--   • Signaux : la date de réception (attributes.receivedAt) suit le calendrier du vaisseau.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Colonnes ────────────────────────────────────────────────────────────────────
ALTER TABLE public.logbook_entries
  ADD COLUMN IF NOT EXISTS family text,
  ADD COLUMN IF NOT EXISTS context text,
  ADD COLUMN IF NOT EXISTS key text;

CREATE UNIQUE INDEX IF NOT EXISTS logbook_entries_ship_key ON public.logbook_entries (ship_id, key);
CREATE INDEX IF NOT EXISTS idx_logbook_ship_created ON public.logbook_entries (ship_id, created_at DESC);

ALTER TABLE public.logbook_entries
  DROP CONSTRAINT IF EXISTS logbook_entries_lengths,
  ADD CONSTRAINT logbook_entries_lengths CHECK (
    char_length(btrim(title)) BETWEEN 1 AND 120 AND char_length(btrim(text)) BETWEEN 1 AND 4000);

COMMENT ON COLUMN public.logbook_entries.family IS 'Famille affichée (VOYAGE, ARRIVÉE, DÉTECTEUR, OBSERVATOIRE, RADAR, MÉMOIRE) ; nulle pour une entrée du joueur';
COMMENT ON COLUMN public.logbook_entries.context IS 'Contexte de voyage au moment de l''entrée : « En orbite — [système] » ou « En transit vers [système] »';
COMMENT ON COLUMN public.logbook_entries.key IS 'Clé d''unicité d''une entrée écrite par le serveur (une seule fois par vaisseau) ; nulle pour une entrée du joueur';

-- 2. Durée physique d'un voyage (années) ─────────────────────────────────────────
-- Même table de référence et même interpolation que interpPhysique (src/lib/transit.js).
CREATE OR REPLACE FUNCTION public.transit_physical_years(p_distance_ly double precision)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d double precision[] := ARRAY[4.24, 11.9, 22, 1280, 26000, 100000];
  t double precision[] := ARRAY[88, 248, 458, 26600, 541000, 2083333];
  v_d double precision := CASE WHEN coalesce(p_distance_ly, 0) > 0 THEN p_distance_ly ELSE 1 END;
BEGIN
  IF v_d <= d[1] THEN
    RETURN v_d / d[1] * t[1];
  ELSIF v_d > d[6] THEN
    RETURN t[6] * power(v_d / d[6], 0.95);
  END IF;
  FOR i IN 1..5 LOOP
    IF v_d <= d[i + 1] THEN
      RETURN t[i] + (v_d - d[i]) / (d[i + 1] - d[i]) * (t[i + 1] - t[i]);
    END IF;
  END LOOP;
  RETURN t[6];
END;
$$;

-- 3. Calendrier du vaisseau ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ship_galactic_years(p_ship public.ships, p_at timestamptz DEFAULT now())
RETURNS double precision
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_phys double precision := 0;
  v_travel_s double precision := 0;
  v_distance double precision;
  v_progress double precision;
BEGIN
  -- Voyages terminés à cette date
  SELECT coalesce(sum(transit_physical_years(distance_al)), 0),
         coalesce(sum(extract(epoch FROM arrival_at - departure_at)), 0)
    INTO v_phys, v_travel_s
    FROM ship_travels
   WHERE ship_id = p_ship.id AND arrival_at <= p_at;

  -- Voyage en cours : au prorata de sa progression
  IF p_ship.travel_state = 'IN_TRANSIT' AND p_ship.travel_departure_at IS NOT NULL
     AND p_ship.travel_departure_at <= p_at AND p_ship.travel_arrival_at > p_ship.travel_departure_at THEN
    SELECT sqrt(power(o[1] - t[1], 2) + power(o[2] - t[2], 2) + power(o[3] - t[3], 2))
      INTO v_distance
      FROM (SELECT system_xyz(a) AS o, system_xyz(b) AS t
              FROM stellar_systems a, stellar_systems b
             WHERE a.id = p_ship.current_system_id AND b.id = p_ship.travel_destination) AS xyz;
    v_progress := least(1, extract(epoch FROM p_at - p_ship.travel_departure_at)
                           / extract(epoch FROM p_ship.travel_arrival_at - p_ship.travel_departure_at));
    v_phys := v_phys + v_progress * transit_physical_years(v_distance);
    v_travel_s := v_travel_s + extract(epoch FROM least(p_at, p_ship.travel_arrival_at) - p_ship.travel_departure_at);
  END IF;

  -- Temps réel en orbite
  RETURN v_phys + greatest(0, extract(epoch FROM p_at - coalesce(p_ship.created_at, p_at)) - v_travel_s) / (365 * 86400.0);
END;
$$;

CREATE OR REPLACE FUNCTION public.ship_galactic_date(p_ship public.ships, p_at timestamptz DEFAULT now())
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_years double precision := ship_galactic_years(p_ship, p_at);
  v_day int;
BEGIN
  v_day := least(364, floor((v_years - floor(v_years)) * 365)::int);
  RETURN lpad((2187 + floor(v_years))::bigint::text, 4, '0') || '-' || to_char(date '2001-01-01' + v_day, 'MM-DD');
END;
$$;

CREATE OR REPLACE FUNCTION public.ship_context(p_ship public.ships)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE WHEN p_ship.travel_state = 'IN_TRANSIT'
              THEN 'En transit vers ' || coalesce((SELECT name FROM stellar_systems WHERE id = p_ship.travel_destination), p_ship.travel_destination)
              ELSE 'En orbite — ' || coalesce((SELECT name FROM stellar_systems WHERE id = p_ship.current_system_id), p_ship.current_system_id, 'Sol')
         END;
$$;

-- 4. Mise en forme française ─────────────────────────────────────────────────────
-- Nombre à une décimale (virgule, espace fine insécable entre milliers) : 11,9 — 26 000,0 → « 26 000 »
CREATE OR REPLACE FUNCTION public.fr_distance(p_value double precision)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_round numeric := round(coalesce(p_value, 0)::numeric, 1);
  v_int text := trunc(v_round)::bigint::text;
  v_dec int := (abs(v_round - trunc(v_round)) * 10)::int;
BEGIN
  v_int := regexp_replace(v_int, '(\d)(?=(\d{3})+$)', '\1 ', 'g');
  RETURN CASE WHEN v_dec = 0 AND v_round >= 1000 THEN v_int ELSE v_int || ',' || v_dec END;
END;
$$;

-- Durée joueur : « 2h24 », « 12 min », « < 1 min »
CREATE OR REPLACE FUNCTION public.fr_duration(p_seconds double precision)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN coalesce(p_seconds, 0) < 60 THEN '< 1 min'
    WHEN p_seconds < 3600 THEN floor(p_seconds / 60)::int || ' min'
    ELSE floor(p_seconds / 3600)::bigint || 'h' || lpad((floor(p_seconds / 60)::bigint % 60)::text, 2, '0')
  END;
$$;

-- 5. Écriture d'une entrée par le serveur ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.logbook_add(
  p_ship public.ships, p_type log_entry_type, p_family text, p_title text, p_text text, p_key text,
  p_at timestamptz DEFAULT now(), p_systems text[] DEFAULT '{}')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO logbook_entries (ship_id, type, generation, date, title, text, linked_systems, family, context, key, created_at)
  VALUES (p_ship.id, p_type, coalesce(p_ship.generation, 1), ship_galactic_date(p_ship, p_at), p_title, p_text,
          coalesce(p_systems, '{}'), p_family, ship_context(p_ship), p_key, p_at)
  ON CONFLICT (ship_id, key) DO NOTHING;
END;
$$;

-- 6. Entrée du joueur : date, contexte et génération fixés par le serveur ────────
CREATE OR REPLACE FUNCTION public.logbook_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
BEGIN
  IF NEW.type <> 'MANUEL' THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_ship FROM ships WHERE id = NEW.ship_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vaisseau inconnu' USING ERRCODE = 'P0002';
  END IF;
  NEW.title := btrim(NEW.title);
  NEW.text := btrim(NEW.text);
  NEW.generation := coalesce(v_ship.generation, 1);
  NEW.date := ship_galactic_date(v_ship);
  NEW.context := ship_context(v_ship);
  NEW.family := NULL;
  NEW.key := NULL;
  NEW.linked_traces := '{}';
  NEW.created_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_logbook_before_insert ON public.logbook_entries;
CREATE TRIGGER tr_logbook_before_insert
  BEFORE INSERT ON public.logbook_entries
  FOR EACH ROW EXECUTE FUNCTION public.logbook_before_insert();

-- 7. Droits : lecture de son journal, écriture d'entrées MANUEL seulement ────────
DROP POLICY IF EXISTS "Users can manage own logbook" ON public.logbook_entries;
DROP POLICY IF EXISTS "Players read own logbook" ON public.logbook_entries;
DROP POLICY IF EXISTS "Players write own manual entries" ON public.logbook_entries;
CREATE POLICY "Players read own logbook" ON public.logbook_entries
  FOR SELECT TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Players write own manual entries" ON public.logbook_entries
  FOR INSERT TO authenticated
  WITH CHECK (type = 'MANUEL' AND ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));
REVOKE ALL ON public.logbook_entries FROM anon, authenticated;
GRANT SELECT ON public.logbook_entries TO authenticated;
GRANT INSERT (ship_id, type, title, text) ON public.logbook_entries TO authenticated;

-- 8. Entrée fondatrice (LACUNA_ARCS.md) ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.logbook_on_ship_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM logbook_add(NEW, 'GENERATIONNEL', 'MÉMOIRE', 'Départ confirmé',
    'Départ confirmé. 15 000 âmes embarquées. Les réservoirs sont pleins. Le bouclier plasma est actif. '
    'On a regardé la Terre disparaître dans l''observatoire pendant 4 heures. Personne n''a dit grand chose.',
    'fondation', coalesce(NEW.created_at, now()), ARRAY['SOL']);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_logbook_ship_insert ON public.ships;
CREATE TRIGGER tr_logbook_ship_insert
  AFTER INSERT ON public.ships
  FOR EACH ROW EXECUTE FUNCTION public.logbook_on_ship_insert();

-- 9. Départ (VOY-001) et arrivée (VOY-007) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.logbook_on_travel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_distance double precision;
  v_total double precision;
  v_travel ship_travels;
BEGIN
  IF NEW.travel_state = 'IN_TRANSIT' AND OLD.travel_state IS DISTINCT FROM 'IN_TRANSIT' THEN
    SELECT name INTO v_name FROM stellar_systems WHERE id = NEW.travel_destination;
    SELECT sqrt(power(o[1] - t[1], 2) + power(o[2] - t[2], 2) + power(o[3] - t[3], 2))
      INTO v_distance
      FROM (SELECT system_xyz(a) AS o, system_xyz(b) AS t
              FROM stellar_systems a, stellar_systems b
             WHERE a.id = NEW.current_system_id AND b.id = NEW.travel_destination) AS xyz;
    PERFORM logbook_add(NEW, 'AUTO', 'VOYAGE',
      'Cap fixé — ' || coalesce(v_name, NEW.travel_destination) || ' — ' || fr_distance(v_distance) || ' al',
      'Durée estimée : ' || fr_duration(extract(epoch FROM NEW.travel_arrival_at - NEW.travel_departure_at))
        || E'. Phase d''accélération en cours.\nMoteurs allumés.',
      'voy-001-' || (coalesce(NEW.voyage, 0) + 1), NEW.travel_departure_at, ARRAY[NEW.travel_destination]);

  ELSIF OLD.travel_state = 'IN_TRANSIT' AND NEW.travel_state IS DISTINCT FROM 'IN_TRANSIT' THEN
    SELECT * INTO v_travel FROM ship_travels WHERE ship_id = NEW.id ORDER BY arrival_at DESC LIMIT 1;
    SELECT coalesce(sum(distance_al), 0) INTO v_total FROM ship_travels WHERE ship_id = NEW.id;
    SELECT name INTO v_name FROM stellar_systems WHERE id = NEW.current_system_id;
    PERFORM logbook_add(NEW, 'AUTO', 'ARRIVÉE',
      coalesce(v_name, NEW.current_system_id) || ' — ' || fr_distance(v_travel.distance_al) || ' al',
      'Durée du voyage : ' || fr_duration(extract(epoch FROM v_travel.arrival_at - v_travel.departure_at))
        || '. Distance totale cumulée : ' || fr_distance(v_total) || ' al.',
      'voy-007-' || coalesce(NEW.voyage, 0), coalesce(v_travel.arrival_at, now()), ARRAY[NEW.current_system_id]);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_logbook_travel ON public.ships;
CREATE TRIGGER tr_logbook_travel
  AFTER UPDATE OF travel_state ON public.ships
  FOR EACH ROW EXECUTE FUNCTION public.logbook_on_travel();

-- 10. Signaux : date de réception au calendrier du vaisseau ──────────────────────
CREATE OR REPLACE FUNCTION public.signals_set_received_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
BEGIN
  IF NEW.ship_id IS NULL OR coalesce(NEW.attributes, '{}'::jsonb) ? 'receivedAt' THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_ship FROM ships WHERE id = NEW.ship_id;
  IF FOUND THEN
    NEW.attributes := coalesce(NEW.attributes, '{}'::jsonb)
      || jsonb_build_object('receivedAt', ship_galactic_date(v_ship, coalesce(NEW.captured_at, now())));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_signals_received_at ON public.signals;
CREATE TRIGGER tr_signals_received_at
  BEFORE INSERT ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.signals_set_received_at();

-- 11. Neutrinos de SN-001 (CIE-001, CIE-002) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.logbook_on_signal_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
BEGIN
  IF NEW.ship_id IS NULL OR NEW.support <> 'NEUTRINO' OR NEW.source_event_id IS NULL
     OR NOT EXISTS (SELECT 1 FROM signal_events WHERE id = NEW.source_event_id AND attributes->>'key' = 'SN-001') THEN
    RETURN NEW;
  END IF;
  SELECT * INTO v_ship FROM ships WHERE id = NEW.ship_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  IF NEW.attributes #>> '{neutrino,profile}' = 'rising' THEN
    PERFORM logbook_add(v_ship, 'AUTO', 'DÉTECTEUR', 'Montée du taux de neutrinos',
      '~200 événements en 5 min. Énergie moyenne ~3 MeV. Direction non reconstruite.',
      'cie-001', coalesce(NEW.captured_at, now()));
  ELSE
    PERFORM logbook_add(v_ship, 'AUTO', 'DÉTECTEUR', 'Bouffée de neutrinos',
      '~5 000 000 événements en 10 s. Énergie moyenne ~15 MeV. Direction reconstruite à ±3°.',
      'cie-002', coalesce(NEW.captured_at, now()));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_logbook_signal_insert ON public.signals;
CREATE TRIGGER tr_logbook_signal_insert
  AFTER INSERT ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.logbook_on_signal_insert();

-- 12. Sortie du choc (CIE-003) et première impulsion de LPT-001 (CIE-004) ────────
-- La durée de l'impulsion est tirée côté client (src/lib/lpt.js) : le serveur ne garde qu'une valeur de 30 à 300 s.
CREATE OR REPLACE FUNCTION public.log_sky_event(p_key text, p_duration_s integer DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
  v_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ship FROM ships WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun vaisseau pour ce compte' USING ERRCODE = 'P0002';
  END IF;

  IF p_key = 'cie-003' THEN
    v_at := v_ship.supernova_t0 + interval '6 minutes';
    IF v_at IS NULL OR now() < v_at THEN
      RETURN json_build_object('logged', 0);
    END IF;
    PERFORM logbook_add(v_ship, 'AUTO', 'OBSERVATOIRE', 'Nouvelle source lumineuse',
      'Direction : Orion (5h55m, +7,4°). Éclat en hausse.', 'cie-003', v_at);

  ELSIF p_key = 'cie-004' THEN
    SELECT captured_at INTO v_at FROM signals WHERE ship_id = v_ship.id AND attributes->>'key' = 'LPT-001' LIMIT 1;
    IF v_at IS NULL OR v_ship.lpt_captured_at IS NULL OR p_duration_s IS NULL OR p_duration_s NOT BETWEEN 30 AND 300 THEN
      RETURN json_build_object('logged', 0);
    END IF;
    PERFORM logbook_add(v_ship, 'AUTO', 'RADAR', 'Impulsion radio large bande',
      'Direction : Écu (18h39m, −10,5°). Durée : ' || p_duration_s || ' s.', 'cie-004', v_at);

  ELSE
    RAISE EXCEPTION 'Événement inconnu' USING ERRCODE = '22023';
  END IF;
  RETURN json_build_object('logged', 1);
END;
$$;

COMMENT ON FUNCTION public.log_sky_event(text, integer) IS
  'Écrit au journal la sortie du choc de SN-001 (cie-003) ou la première impulsion de LPT-001 (cie-004), une fois, quand elles ont eu lieu.';

REVOKE ALL ON FUNCTION public.transit_physical_years(double precision) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ship_galactic_years(public.ships, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ship_galactic_date(public.ships, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ship_context(public.ships) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fr_distance(double precision) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fr_duration(double precision) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.logbook_add(public.ships, log_entry_type, text, text, text, text, timestamptz, text[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.logbook_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.logbook_on_ship_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.logbook_on_travel() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.signals_set_received_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.logbook_on_signal_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_sky_event(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_sky_event(text, integer) TO authenticated;

-- 13. Données existantes ─────────────────────────────────────────────────────────
-- Signaux modèles : la date de réception sera celle de la création de la partie
UPDATE public.signals SET attributes = attributes - 'receivedAt'
WHERE session_id = 'seed-demo' AND ship_id IS NULL;

-- Signaux des parties en cours : date de réception au calendrier du vaisseau
UPDATE public.signals g
SET attributes = coalesce(g.attributes, '{}'::jsonb)
  || jsonb_build_object('receivedAt', public.ship_galactic_date(s, coalesce(g.captured_at, now())))
FROM public.ships s
WHERE g.ship_id = s.id;

-- Parties en cours : entrée fondatrice et neutrinos déjà captés
DO $$
DECLARE
  v_ship public.ships;
  v_signal public.signals;
BEGIN
  FOR v_ship IN SELECT * FROM public.ships LOOP
    PERFORM public.logbook_add(v_ship, 'GENERATIONNEL', 'MÉMOIRE', 'Départ confirmé',
      'Départ confirmé. 15 000 âmes embarquées. Les réservoirs sont pleins. Le bouclier plasma est actif. '
      'On a regardé la Terre disparaître dans l''observatoire pendant 4 heures. Personne n''a dit grand chose.',
      'fondation', coalesce(v_ship.created_at, now()), ARRAY['SOL']);
    FOR v_signal IN
      SELECT g.* FROM public.signals g JOIN public.signal_events e ON e.id = g.source_event_id
       WHERE g.ship_id = v_ship.id AND g.support = 'NEUTRINO' AND e.attributes->>'key' = 'SN-001'
    LOOP
      IF v_signal.attributes #>> '{neutrino,profile}' = 'rising' THEN
        PERFORM public.logbook_add(v_ship, 'AUTO', 'DÉTECTEUR', 'Montée du taux de neutrinos',
          '~200 événements en 5 min. Énergie moyenne ~3 MeV. Direction non reconstruite.',
          'cie-001', coalesce(v_signal.captured_at, now()));
      ELSE
        PERFORM public.logbook_add(v_ship, 'AUTO', 'DÉTECTEUR', 'Bouffée de neutrinos',
          '~5 000 000 événements en 10 s. Énergie moyenne ~15 MeV. Direction reconstruite à ±3°.',
          'cie-002', coalesce(v_signal.captured_at, now()));
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
