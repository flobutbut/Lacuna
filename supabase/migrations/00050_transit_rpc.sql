-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Intégrité du jeu : transit décidé par le serveur
-- Plan : docs/architecture/PLAN_COMPTES_JOUEURS.md (§9)
--
-- Non destructif. Jusqu'ici le client écrivait lui-même la position, l'état de
-- transit, l'heure d'arrivée et le numéro de voyage de son vaisseau, ainsi que
-- l'historique des voyages. Désormais :
--   - start_transit(destination) calcule la distance et la durée, et fixe l'arrivée ;
--   - complete_transit() n'accepte l'arrivée qu'à l'heure prévue et écrit l'historique ;
--   - le joueur ne modifie plus que le nom de son vaisseau ;
--   - ship_travels est en lecture seule pour le joueur.
-- À appliquer avant de déployer le client qui appelle ces fonctions.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Réglages du jeu ─────────────────────────────────────────────────────────────
-- Propres à chaque base (développement, production) ; modifiés depuis le dashboard.
-- Aucun accès depuis l'API : seules les fonctions SECURITY DEFINER les lisent.
CREATE TABLE IF NOT EXISTS public.game_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.game_settings IS 'Réglages du jeu propres à la base (ex. échelle de temps du transit). Lus par les fonctions serveur, jamais par le client.';

ALTER TABLE public.game_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.game_settings FROM anon, authenticated;

-- 1 → Proxima ≈ 1 h de jeu (valeurs du GDD) ; 5/3600 → Proxima ≈ 5 s (mode test, valeur actuelle)
INSERT INTO public.game_settings (key, value, description)
VALUES ('transit_time_scale', to_jsonb(5.0 / 3600),
        'Facteur appliqué à la durée joueur du transit. 1 = durées du GDD (Proxima ≈ 1 h) ; 0.00138889 = mode test (Proxima ≈ 5 s).')
ON CONFLICT (key) DO NOTHING;

-- 2. Distance entre deux systèmes (années-lumière) ───────────────────────────────
-- Coordonnées cartésiennes centrées sur Sol ; à défaut ra/dec + distance (comme getSystemXyz).
CREATE OR REPLACE FUNCTION public.system_xyz(p_system public.stellar_systems)
RETURNS double precision[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_system.coordinates ? 'x' OR p_system.coordinates ? 'y' OR p_system.coordinates ? 'z' THEN ARRAY[
      coalesce((p_system.coordinates->>'x')::double precision, 0),
      coalesce((p_system.coordinates->>'y')::double precision, 0),
      coalesce((p_system.coordinates->>'z')::double precision, 0)]
    ELSE ARRAY[
      coalesce(p_system.distance, 1) * cos(radians(coalesce((p_system.coordinates->>'dec')::double precision, 0)))
                                     * cos(radians(coalesce((p_system.coordinates->>'ra')::double precision, 0))),
      coalesce(p_system.distance, 1) * cos(radians(coalesce((p_system.coordinates->>'dec')::double precision, 0)))
                                     * sin(radians(coalesce((p_system.coordinates->>'ra')::double precision, 0))),
      coalesce(p_system.distance, 1) * sin(radians(coalesce((p_system.coordinates->>'dec')::double precision, 0)))]
  END;
$$;

-- 3. Durée joueur du transit (secondes, avant échelle) ───────────────────────────
-- Même table de référence et même interpolation que interpJoueurH (src/lib/transit.js).
CREATE OR REPLACE FUNCTION public.transit_player_seconds(p_distance_ly double precision)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  d double precision[] := ARRAY[4.24, 11.9, 22, 1280, 26000, 100000];
  h double precision[] := ARRAY[1, 2.4, 3.9, 40.8, 336, 2160];
  v_d double precision := CASE WHEN coalesce(p_distance_ly, 0) > 0 THEN p_distance_ly ELSE 1 END;
  v_h double precision;
BEGIN
  IF v_d <= d[1] THEN
    v_h := v_d / d[1] * h[1];
  ELSIF v_d > d[6] THEN
    v_h := h[6] * power(v_d / d[6], 0.8);
  ELSE
    FOR i IN 1..5 LOOP
      IF v_d <= d[i + 1] THEN
        v_h := h[i] + (v_d - d[i]) / (d[i + 1] - d[i]) * (h[i + 1] - h[i]);
        EXIT;
      END IF;
    END LOOP;
  END IF;
  RETURN round(v_h * 3600);
END;
$$;

-- 4. Départ ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_transit(p_destination text)
RETURNS public.ships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
  v_origin stellar_systems;
  v_dest stellar_systems;
  v_scale double precision;
  v_distance double precision;
  v_duration interval;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ship FROM ships WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun vaisseau pour ce compte' USING ERRCODE = 'P0002';
  END IF;
  IF v_ship.travel_state = 'IN_TRANSIT' THEN
    RAISE EXCEPTION 'Transit déjà en cours' USING ERRCODE = '55000';
  END IF;
  SELECT * INTO v_dest FROM stellar_systems WHERE id = p_destination;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination inconnue' USING ERRCODE = '22023';
  END IF;
  IF v_dest.id = v_ship.current_system_id THEN
    RAISE EXCEPTION 'Le vaisseau est déjà dans ce système' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO v_origin FROM stellar_systems WHERE id = v_ship.current_system_id;

  SELECT sqrt(power(o[1] - t[1], 2) + power(o[2] - t[2], 2) + power(o[3] - t[3], 2))
    INTO v_distance
    FROM (SELECT system_xyz(v_origin) AS o, system_xyz(v_dest) AS t) AS xyz;

  SELECT (value #>> '{}')::double precision INTO v_scale FROM game_settings WHERE key = 'transit_time_scale';
  IF v_scale IS NULL OR v_scale <= 0 THEN
    v_scale := 1;
  END IF;
  v_duration := make_interval(secs => greatest(1, transit_player_seconds(v_distance) * v_scale));

  UPDATE ships SET
    travel_state = 'IN_TRANSIT',
    travel_destination = v_dest.id,
    travel_departure_at = now(),
    travel_arrival_at = now() + v_duration,
    updated_at = now()
  WHERE id = v_ship.id
  RETURNING * INTO v_ship;
  RETURN v_ship;
END;
$$;

COMMENT ON FUNCTION public.start_transit(text) IS
  'Lance le transit du vaisseau du joueur vers un système : distance et durée calculées ici (réglage transit_time_scale). Renvoie le vaisseau.';

-- 5. Arrivée ─────────────────────────────────────────────────────────────────────
-- Avant l'heure d'arrivée (horloge du serveur), renvoie le vaisseau inchangé :
-- le client réessaie un peu plus tard.
CREATE OR REPLACE FUNCTION public.complete_transit()
RETURNS public.ships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
  v_distance double precision;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ship FROM ships WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun vaisseau pour ce compte' USING ERRCODE = 'P0002';
  END IF;
  IF v_ship.travel_state <> 'IN_TRANSIT' OR now() < v_ship.travel_arrival_at THEN
    RETURN v_ship;
  END IF;

  SELECT sqrt(power(o[1] - t[1], 2) + power(o[2] - t[2], 2) + power(o[3] - t[3], 2))
    INTO v_distance
    FROM (SELECT system_xyz(a) AS o, system_xyz(b) AS t
            FROM stellar_systems a, stellar_systems b
           WHERE a.id = v_ship.current_system_id AND b.id = v_ship.travel_destination) AS xyz;

  INSERT INTO ship_travels (ship_id, voyage_number, origin_system_id, destination_system_id,
                            departure_at, arrival_at, distance_al)
  VALUES (v_ship.id, coalesce(v_ship.voyage, 0) + 1, v_ship.current_system_id, v_ship.travel_destination,
          v_ship.travel_departure_at, v_ship.travel_arrival_at, v_distance);

  UPDATE ships SET
    current_system_id = travel_destination,
    travel_state = 'IDLE',
    travel_destination = NULL,
    travel_departure_at = NULL,
    travel_arrival_at = NULL,
    voyage = coalesce(voyage, 0) + 1,
    updated_at = now()
  WHERE id = v_ship.id
  RETURNING * INTO v_ship;
  RETURN v_ship;
END;
$$;

COMMENT ON FUNCTION public.complete_transit() IS
  'Termine le transit du vaisseau du joueur si l''heure d''arrivée est passée (sinon renvoie le vaisseau inchangé) et ajoute le voyage à ship_travels.';

REVOKE ALL ON FUNCTION public.system_xyz(public.stellar_systems) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.transit_player_seconds(double precision) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.start_transit(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.complete_transit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_transit(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_transit() TO authenticated;

-- 6. Vaisseau : le joueur ne modifie que le nom ──────────────────────────────────
REVOKE ALL ON public.ships FROM anon, authenticated;
GRANT SELECT ON public.ships TO authenticated;
GRANT UPDATE (name) ON public.ships TO authenticated;

-- 7. Historique des voyages : lecture seule ──────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own ship travels" ON public.ship_travels;
DROP POLICY IF EXISTS "Players read own ship travels" ON public.ship_travels;
CREATE POLICY "Players read own ship travels" ON public.ship_travels
  FOR SELECT TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));
REVOKE ALL ON public.ship_travels FROM anon, authenticated;
GRANT SELECT ON public.ship_travels TO authenticated;
