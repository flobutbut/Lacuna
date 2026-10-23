-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Le signal de 22 minutes (LPT-001, LACUNA_TRACES_IMMUABLES.md §5)
--
--   • Source : GPM J1839−10, transitoire radio à longue période, hors des systèmes du jeu
--     (AD 279,758°, Déc −10,530° ; ~18 600 al). Signal de type UNKNOWN, sans événement en base.
--   • Phase commune à tous les joueurs : l'impulsion n° k commence à
--     scenario_signal_epoch + k × 1 318,1957 s.
--   • capture_lpt_signal() : la première impulsion qui commence après création de la partie + 20 min
--     est captée une fois par partie (ships.lpt_captured_at). Le signal garde la phase (époque, période,
--     numéro de la première impulsion) ; les impulsions suivantes, leur durée, leur intensité et leur
--     polarisation se calculent côté client (src/lib/lpt.js), à partir du seul numéro d'impulsion.
--
-- Ancrage : Hurley-Walker et al., Nature 2023 (période, durées, polarisation, mesure de dispersion,
-- position MeerKAT). La première capture à création + 20 min est une valeur de jeu.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ships
  ADD COLUMN IF NOT EXISTS lpt_captured_at timestamptz;

COMMENT ON COLUMN public.ships.lpt_captured_at IS
  'Capture de la première impulsion de LPT-001 (GPM J1839−10) par ce vaisseau : une seule fois par partie.';

CREATE OR REPLACE FUNCTION public.capture_lpt_signal()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_period constant double precision := 1318.1957;
  c_delay constant interval := interval '20 minutes';
  v_ship ships;
  v_epoch text;
  v_epoch_ts timestamptz;
  v_first_k bigint;
  v_first_at timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ship FROM ships WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun vaisseau pour ce compte' USING ERRCODE = 'P0002';
  END IF;
  IF v_ship.lpt_captured_at IS NOT NULL OR v_ship.created_at IS NULL THEN
    RETURN json_build_object('inserted', 0);
  END IF;

  SELECT value #>> '{}' INTO v_epoch FROM game_settings WHERE key = 'scenario_signal_epoch';
  IF v_epoch IS NULL THEN
    RETURN json_build_object('inserted', 0);
  END IF;
  v_epoch_ts := v_epoch::timestamptz;

  -- Première impulsion qui commence au plus tôt à création + 20 min
  v_first_k := ceil(extract(epoch FROM (v_ship.created_at + c_delay - v_epoch_ts)) / c_period)::bigint;
  v_first_at := v_epoch_ts + make_interval(secs => v_first_k * c_period);
  IF now() < v_first_at THEN
    RETURN json_build_object('inserted', 0, 'first_at', v_first_at);
  END IF;

  INSERT INTO signals (source_type, ship_id, frequency_hz, support, duration_sec, captured_at, attributes)
  VALUES ('UNKNOWN', v_ship.id, NULL, 'EM_RADIO', 300, v_first_at,
          jsonb_build_object(
            'key', 'LPT-001',
            'frequency', 'Large bande',
            'azimuth', 279.758,
            'elevation', -10.530,
            'distanceEst', '~18 600 al',
            'structure', 'pulsé, intensité variable',
            'polarization', 'linéaire',
            'anomalous', false,
            'lpt', jsonb_build_object('epoch', v_epoch, 'period_s', c_period, 'first_k', v_first_k)));
  UPDATE ships SET lpt_captured_at = now() WHERE id = v_ship.id;

  RETURN json_build_object('inserted', 1, 'first_at', v_first_at);
END;
$$;

COMMENT ON FUNCTION public.capture_lpt_signal() IS
  'Capte la première impulsion de LPT-001 après création de la partie + 20 min (une fois par partie). Renvoie {inserted, first_at}.';

REVOKE ALL ON FUNCTION public.capture_lpt_signal() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.capture_lpt_signal() TO authenticated;
