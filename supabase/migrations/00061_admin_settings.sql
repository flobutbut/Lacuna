-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Réglages d'administration : accélération des voyages, réinitialisation de la partie
--
--   • L'accélération des voyages (game_settings.transit_time_scale, mode test) ne s'applique
--     plus qu'aux comptes admin qui l'ont activée (profiles.fast_transit). Les joueurs voyagent
--     à la durée du GDD (Proxima ≈ 1 h).
--   • set_fast_transit(boolean) : l'admin active ou coupe l'accélération pour son compte.
--   • reset_my_game() : l'admin efface sa partie (vaisseau, systèmes, population, carte, voyages,
--     signaux, observations, rapports, découvertes, interprétations). Le compte et le pseudo restent ;
--     la partie se recrée à l'écran « Bienvenue à bord ».
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Préférence d'accélération (lisible par son propriétaire, modifiable par RPC seulement) ──
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fast_transit boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.fast_transit IS
  'Admin uniquement : voyages accélérés (game_settings.transit_time_scale). Sans effet pour un joueur.';

-- 2. Départ : l'échelle de test ne vaut que pour un admin qui l'a activée ────────
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
  v_scale double precision := 1;
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

  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND fast_transit) THEN
    SELECT (value #>> '{}')::double precision INTO v_scale FROM game_settings WHERE key = 'transit_time_scale';
    IF v_scale IS NULL OR v_scale <= 0 THEN
      v_scale := 1;
    END IF;
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
  'Lance le transit du vaisseau du joueur : distance et durée calculées ici. Accélération de test réservée aux admins qui l''ont activée.';

-- 3. Activer / couper l'accélération (admin) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_fast_transit(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;
  UPDATE profiles SET fast_transit = coalesce(p_enabled, false) WHERE id = auth.uid();
  RETURN coalesce(p_enabled, false);
END;
$$;

COMMENT ON FUNCTION public.set_fast_transit(boolean) IS 'Admin : active ou coupe l''accélération des voyages pour son compte.';

-- 4. Réinitialiser sa partie (admin) ─────────────────────────────────────────────
-- Même effacement que delete_account, sans supprimer le compte ni le profil.
CREATE OR REPLACE FUNCTION public.reset_my_game()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user AND role = 'admin') THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;

  DELETE FROM interpretations
   WHERE ship_id IN (SELECT id FROM ships WHERE user_id = v_user);
  UPDATE traces SET discovered_by = NULL
   WHERE discovered_by IN (SELECT id FROM ships WHERE user_id = v_user);

  -- Le reste suit en cascade : systèmes, population, carte, voyages, signaux,
  -- observations et rapports, journal, découvertes et lectures de traces
  DELETE FROM ships WHERE user_id = v_user;
END;
$$;

COMMENT ON FUNCTION public.reset_my_game() IS
  'Admin : efface sa partie (vaisseau et toutes ses données) ; le compte et le pseudo restent.';

REVOKE ALL ON FUNCTION public.set_fast_transit(boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reset_my_game() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_fast_transit(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_my_game() TO authenticated;
