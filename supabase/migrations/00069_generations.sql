-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Générations (LACUNA_GDD.md §4, Les Générations ; LACUNA_NOTIFICATIONS.md POP-001)
--
--   • génération = 1 + années du calendrier du vaisseau ÷ 25 (entier inférieur), recalculée à l'arrivée
--     de chaque voyage (ships.generation, populations.generation) ; inchangée pendant le transit.
--   • Premier passage seulement (1 → 2) : entrée GENERATIONNEL au journal, datée de l'instant où le vaisseau
--     franchit 25 ans, en transit. Les passages suivants ne changent que le compteur.
--   • POP-001 sans la ligne d'effectif : aucune règle démographique n'existe.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Génération selon le calendrier du vaisseau ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.ship_generation(p_ship public.ships, p_at timestamptz DEFAULT now())
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 1 + floor(ship_galactic_years(p_ship, p_at) / 25)::int;
$$;

-- 2. Arrivée : compteur recalculé (avant écriture de la ligne) ───────────────────
-- complete_transit insère le voyage dans ship_travels avant de repasser le vaisseau en IDLE :
-- le calendrier compte donc déjà ce voyage.
CREATE OR REPLACE FUNCTION public.ships_set_generation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.travel_state = 'IN_TRANSIT' AND NEW.travel_state IS DISTINCT FROM 'IN_TRANSIT' THEN
    NEW.generation := greatest(coalesce(OLD.generation, 1), ship_generation(NEW));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_ships_set_generation ON public.ships;
CREATE TRIGGER tr_ships_set_generation
  BEFORE UPDATE OF travel_state ON public.ships
  FOR EACH ROW EXECUTE FUNCTION public.ships_set_generation();

-- 3. Journal : départ, arrivée, premier passage de génération ────────────────────
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
  v_years_before double precision;
  v_progress double precision;
  v_crossing timestamptz;
  v_in_transit ships;
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

    -- Premier passage de génération, franchi pendant ce voyage : daté de l'instant où le vaisseau atteint 25 ans
    IF coalesce(OLD.generation, 1) < 2 AND NEW.generation >= 2 AND v_travel.id IS NOT NULL THEN
      v_years_before := ship_galactic_years(OLD, OLD.travel_departure_at);
      v_progress := least(1, greatest(0, (25 - v_years_before) / nullif(transit_physical_years(v_travel.distance_al), 0)));
      v_crossing := OLD.travel_departure_at + (OLD.travel_arrival_at - OLD.travel_departure_at) * coalesce(v_progress, 1);
      v_in_transit := OLD;
      v_in_transit.generation := 2;
      PERFORM logbook_add(v_in_transit, 'GENERATIONNEL', 'MÉMOIRE', 'Passage de génération — Génération 2',
        E'La génération qui a regardé la Terre disparaître n''est plus.\nLeurs journaux sont préservés.',
        'pop-001', v_crossing);
    END IF;

    SELECT coalesce(sum(distance_al), 0) INTO v_total FROM ship_travels WHERE ship_id = NEW.id;
    SELECT name INTO v_name FROM stellar_systems WHERE id = NEW.current_system_id;
    PERFORM logbook_add(NEW, 'AUTO', 'ARRIVÉE',
      coalesce(v_name, NEW.current_system_id) || ' — ' || fr_distance(v_travel.distance_al) || ' al',
      'Durée du voyage : ' || fr_duration(extract(epoch FROM v_travel.arrival_at - v_travel.departure_at))
        || '. Distance totale cumulée : ' || fr_distance(v_total) || ' al.',
      'voy-007-' || coalesce(NEW.voyage, 0), coalesce(v_travel.arrival_at, now()), ARRAY[NEW.current_system_id]);

    UPDATE populations SET generation = NEW.generation WHERE ship_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.ship_generation(public.ships, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ships_set_generation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.logbook_on_travel() FROM PUBLIC, anon, authenticated;

-- 4. Parties en cours : compteur aligné (vaisseaux à quai) ───────────────────────
UPDATE public.ships s
SET generation = greatest(coalesce(s.generation, 1), public.ship_generation(s))
WHERE s.travel_state IS DISTINCT FROM 'IN_TRANSIT';

UPDATE public.populations p
SET generation = s.generation
FROM public.ships s
WHERE p.ship_id = s.id;
