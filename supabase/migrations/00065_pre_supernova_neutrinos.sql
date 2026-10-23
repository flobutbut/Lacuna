-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Neutrinos de pré-supernova avant la bouffée de Bételgeuse (SN-001)
--
--   • La montée commence 3 minutes après la création de la partie et dure 5 minutes ;
--     la bouffée (supernova_t0) arrive donc à création + 8 minutes.
--   • capture_supernova_neutrinos() capte d'abord la montée (dès T0 − 5 min), puis la bouffée
--     (dès T0). Chacune une seule fois par partie (supernova_pre_captured_at, supernova_captured_at).
--
-- Ancrage : pour Bételgeuse, des neutrinos de pré-supernova (combustion du silicium) seraient
-- détectables des heures avant l'effondrement (jusqu'à ~9 h, Super-Kamiokande avec gadolinium).
-- VALEURS PROVISOIRES de la montée : 200 événements, 5 minutes, énergie moyenne 3 MeV,
-- direction non reconstruite.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ships
  ADD COLUMN IF NOT EXISTS supernova_pre_captured_at timestamptz;

ALTER TABLE public.ships ALTER COLUMN supernova_t0 SET DEFAULT (now() + interval '8 minutes');

COMMENT ON COLUMN public.ships.supernova_t0 IS
  'Bouffée de neutrinos de la supernova de Bételgeuse pour cette partie (création + 8 min) ; la montée de pré-supernova commence 5 min avant.';
COMMENT ON COLUMN public.ships.supernova_pre_captured_at IS
  'Capture de la montée des neutrinos de pré-supernova par ce vaisseau (une seule fois).';

-- Parties dont la montée n'a pas encore commencé : alignées sur le nouveau calendrier
UPDATE public.ships
SET supernova_t0 = created_at + interval '8 minutes'
WHERE supernova_captured_at IS NULL
  AND supernova_t0 - interval '5 minutes' > now()
  AND created_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.capture_supernova_neutrinos()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
  v_event uuid;
  v_pre_start timestamptz;
  v_inserted int := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ship FROM ships WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun vaisseau pour ce compte' USING ERRCODE = 'P0002';
  END IF;
  IF v_ship.supernova_t0 IS NULL THEN
    RETURN json_build_object('inserted', 0);
  END IF;
  SELECT id INTO v_event FROM signal_events WHERE attributes->>'key' = 'SN-001' LIMIT 1;
  IF v_event IS NULL THEN
    RETURN json_build_object('inserted', 0);
  END IF;
  v_pre_start := v_ship.supernova_t0 - interval '5 minutes';

  -- Montée de pré-supernova : taux de basse énergie qui croît, sans direction (disponible 24 h)
  IF v_ship.supernova_pre_captured_at IS NULL
     AND now() >= v_pre_start AND now() <= v_pre_start + interval '24 hours' THEN
    INSERT INTO signals (source_type, source_event_id, ship_id, frequency_hz, support, duration_sec, captured_at, attributes)
    VALUES ('EVENT', v_event, v_ship.id, NULL, 'NEUTRINO', 300, v_pre_start,
            jsonb_build_object(
              'structure', 'montée lente',
              'lifetime_ms', 86400000,
              'neutrino', jsonb_build_object(
                'event_count', 200,
                'duration_s', 300,
                'mean_energy_mev', 3,
                'profile', 'rising')));
    UPDATE ships SET supernova_pre_captured_at = now() WHERE id = v_ship.id;
    v_inserted := v_inserted + 1;
  END IF;

  -- Bouffée : à partir de T0 (disponible 24 h), une seule fois par partie
  IF v_ship.supernova_captured_at IS NULL
     AND now() >= v_ship.supernova_t0 AND now() <= v_ship.supernova_t0 + interval '24 hours' THEN
    INSERT INTO signals (source_type, source_event_id, ship_id, frequency_hz, support, duration_sec, captured_at, attributes)
    VALUES ('EVENT', v_event, v_ship.id, NULL, 'NEUTRINO', 10, v_ship.supernova_t0,
            jsonb_build_object(
              'structure', 'sursaut',
              'lifetime_ms', 86400000,
              'neutrino', jsonb_build_object(
                'event_count', 5000000,
                'duration_s', 10,
                'mean_energy_mev', 15,
                'direction', jsonb_build_object('ra', 88.793, 'dec', 7.407),
                'uncertainty_deg', 3)));
    UPDATE ships SET supernova_captured_at = now() WHERE id = v_ship.id;
    v_inserted := v_inserted + 1;
  END IF;

  RETURN json_build_object('inserted', v_inserted);
END;
$$;

COMMENT ON FUNCTION public.capture_supernova_neutrinos() IS
  'Capte la montée de pré-supernova (dès T0 − 5 min) puis la bouffée de Bételgeuse (dès T0), une fois chacune par partie.';

REVOKE ALL ON FUNCTION public.capture_supernova_neutrinos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.capture_supernova_neutrinos() TO authenticated;
