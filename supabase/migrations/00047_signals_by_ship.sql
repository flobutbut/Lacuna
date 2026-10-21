-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Comptes joueurs (étape 4) : signaux et observations rattachés au vaisseau
-- Plan : docs/architecture/PLAN_COMPTES_JOUEURS.md
--
-- • session_id (identifiant navigateur du prototype) devient facultatif : l'app ne
--   le renseigne plus, la propriété passe par ship_id. Colonne conservée pour les
--   données du prototype et les signaux modèles ('seed-demo').
-- • compute_pulsar_signals : déduplication par vaisseau, plus de paramètre session,
--   réservée au propriétaire du vaisseau.
--   Corps repris de la fonction EN BASE au 21/10/2026 (flux depuis s1400_mjy quand
--   disponible), plus récent que la migration 00045 du dépôt.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. session_id facultatif ───────────────────────────────────────────────────────
ALTER TABLE public.signals ALTER COLUMN session_id DROP NOT NULL;
ALTER TABLE public.observations ALTER COLUMN session_id DROP NOT NULL;

COMMENT ON COLUMN public.signals.session_id IS
  'Obsolète (prototype). ''seed-demo'' + ship_id nul = signal modèle copié par start_new_game. Propriété : ship_id.';
COMMENT ON COLUMN public.observations.session_id IS
  'Obsolète (prototype). Propriété : ship_id.';

CREATE INDEX IF NOT EXISTS idx_signals_ship_id ON public.signals(ship_id);
CREATE INDEX IF NOT EXISTS idx_observations_ship_id ON public.observations(ship_id);

-- 2. compute_pulsar_signals par vaisseau ─────────────────────────────────────────
DROP FUNCTION IF EXISTS public.compute_pulsar_signals(uuid, text, text);

CREATE OR REPLACE FUNCTION public.compute_pulsar_signals(p_ship_id uuid, p_band text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ship_pos      JSONB;
  v_ship_x        NUMERIC;
  v_ship_y        NUMERIC;
  v_ship_z        NUMERIC;
  v_max_range     NUMERIC;
  v_supports      TEXT[];
  v_freq_hz       NUMERIC;
  v_inserted      INT := 0;
  v_evaluated     INT := 0;
  r               RECORD;
  v_pulsar_x      NUMERIC;
  v_pulsar_y      NUMERIC;
  v_pulsar_z      NUMERIC;
  v_distance      NUMERIC;
  v_axis_earth_x  NUMERIC;
  v_axis_earth_y  NUMERIC;
  v_axis_earth_z  NUMERIC;
  v_axis_ship_x   NUMERIC;
  v_axis_ship_y   NUMERIC;
  v_axis_ship_z   NUMERIC;
  v_dot           NUMERIC;
  v_norm_earth    NUMERIC;
  v_norm_ship     NUMERIC;
  v_angle_deg     NUMERIC;
  v_half_angle    NUMERIC;
  v_p0_ms         NUMERIC;
  v_w50_ms        NUMERIC;
  v_flux          NUMERIC;
  v_azimuth       INT;
  v_elevation     INT;
BEGIN

  -- Seul le propriétaire du vaisseau peut calculer ses signaux
  IF NOT EXISTS (SELECT 1 FROM ships WHERE id = p_ship_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Vaisseau introuvable pour ce compte' USING ERRCODE = '42501';
  END IF;

  -- Configuration par bande
  CASE p_band
    WHEN 'P' THEN
      v_max_range := 200;
      v_supports  := ARRAY['EM_RADIO'];
      v_freq_hz   := 300000000;
    WHEN 'L' THEN
      v_max_range := 500;
      v_supports  := ARRAY['EM_RADIO'];
      v_freq_hz   := 1420000000;
    WHEN 'X' THEN
      v_max_range := 300;
      v_supports  := ARRAY['EM_RADIO', 'GAMMA_X'];
      v_freq_hz   := 5000000000;
    WHEN 'G' THEN
      v_max_range := 800;
      v_supports  := ARRAY['GAMMA_X'];
      v_freq_hz   := 1420000000;
    ELSE
      RETURN json_build_object('error', 'Bande inconnue : ' || p_band);
  END CASE;

  -- Position du vaisseau
  SELECT position INTO v_ship_pos
  FROM ships WHERE id = p_ship_id;

  IF v_ship_pos IS NULL THEN
    RETURN json_build_object('error', 'Vaisseau introuvable');
  END IF;

  v_ship_x := (v_ship_pos->>'x')::NUMERIC;
  v_ship_y := (v_ship_pos->>'y')::NUMERIC;
  v_ship_z := (v_ship_pos->>'z')::NUMERIC;

  -- Boucle sur tous les pulsars avec paramètres ATNF
  FOR r IN
    SELECT
      ss.id,
      ss.coordinates,
      ss.attributes
    FROM stellar_systems ss
    WHERE ss.object_type = 'PULSAR'
      AND ss.attributes->>'pulse_period_s' IS NOT NULL
      AND ss.coordinates IS NOT NULL
  LOOP
    v_evaluated := v_evaluated + 1;

    -- Coordonnées du pulsar
    IF r.coordinates->>'x' IS NOT NULL THEN
      v_pulsar_x := (r.coordinates->>'x')::NUMERIC;
      v_pulsar_y := (r.coordinates->>'y')::NUMERIC;
      v_pulsar_z := (r.coordinates->>'z')::NUMERIC;
    ELSE
      -- Conversion ra/dec/distance → xyz
      DECLARE
        v_ra   NUMERIC := (r.coordinates->>'ra')::NUMERIC;
        v_dec  NUMERIC := (r.coordinates->>'dec')::NUMERIC;
        v_dist NUMERIC := (r.coordinates->>'distance')::NUMERIC;
      BEGIN
        IF v_ra IS NULL OR v_dec IS NULL OR v_dist IS NULL THEN
          CONTINUE;
        END IF;
        v_pulsar_x := v_dist * COS(RADIANS(v_dec)) * COS(RADIANS(v_ra));
        v_pulsar_y := v_dist * COS(RADIANS(v_dec)) * SIN(RADIANS(v_ra));
        v_pulsar_z := v_dist * SIN(RADIANS(v_dec));
      END;
    END IF;

    -- Distance vaisseau → pulsar
    v_distance := SQRT(
      POWER(v_pulsar_x - v_ship_x, 2) +
      POWER(v_pulsar_y - v_ship_y, 2) +
      POWER(v_pulsar_z - v_ship_z, 2)
    );

    -- Filtrage portée max
    IF v_distance > v_max_range OR v_distance < 0.01 THEN
      CONTINUE;
    END IF;

    -- Déduplication
    IF EXISTS (
      SELECT 1 FROM signals
      WHERE ship_id = p_ship_id
        AND source_system_id = r.id
    ) THEN
      CONTINUE;
    END IF;

    -- Géométrie du cône d'émission
    v_p0_ms  := (r.attributes->>'pulse_period_s')::NUMERIC * 1000;
    v_w50_ms := (r.attributes->>'emission_width_w50_ms')::NUMERIC;

    IF v_p0_ms > 0 AND v_w50_ms IS NOT NULL THEN
      v_half_angle := (v_w50_ms / v_p0_ms) * 180.0;
    ELSE
      v_half_angle := 5.0;
    END IF;

    -- Axe d'émission : pulsar → Terre (0,0,0)
    v_axis_earth_x := -v_pulsar_x;
    v_axis_earth_y := -v_pulsar_y;
    v_axis_earth_z := -v_pulsar_z;

    -- Vecteur pulsar → vaisseau
    v_axis_ship_x := v_ship_x - v_pulsar_x;
    v_axis_ship_y := v_ship_y - v_pulsar_y;
    v_axis_ship_z := v_ship_z - v_pulsar_z;

    v_norm_earth := SQRT(
      POWER(v_axis_earth_x, 2) +
      POWER(v_axis_earth_y, 2) +
      POWER(v_axis_earth_z, 2)
    );

    v_norm_ship := SQRT(
      POWER(v_axis_ship_x, 2) +
      POWER(v_axis_ship_y, 2) +
      POWER(v_axis_ship_z, 2)
    );

    IF v_norm_earth < 0.01 OR v_norm_ship < 0.01 THEN
      CONTINUE;
    END IF;

    v_dot := (v_axis_earth_x * v_axis_ship_x +
              v_axis_earth_y * v_axis_ship_y +
              v_axis_earth_z * v_axis_ship_z)
             / (v_norm_earth * v_norm_ship);

    v_dot := GREATEST(-1.0, LEAST(1.0, v_dot));
    v_angle_deg := DEGREES(ACOS(v_dot));

    IF v_angle_deg > v_half_angle THEN
      CONTINUE;
    END IF;

    -- Flux dépend du S1400 lorsque disponible
    DECLARE
      v_s1400 NUMERIC;
    BEGIN
      v_s1400 := (r.attributes->>'s1400_mjy')::NUMERIC;

      IF v_s1400 IS NOT NULL AND v_s1400 > 0 THEN
        -- Flux réel normalisé sur 100 mJy (max typique)
        v_flux := LEAST(1.0, v_s1400 / 100.0);
      ELSE
        -- Fallback : formule distance
        v_flux := LEAST(1.0, POWER(3.0 / v_distance, 0.5));
      END IF;
    END;

    -- Azimut et élévation depuis le vaisseau
    v_azimuth := MOD(
      ROUND(DEGREES(ATAN2(
        v_pulsar_y - v_ship_y,
        v_pulsar_x - v_ship_x
      )) + 360)::INT,
      360
    );

    v_elevation := ROUND(DEGREES(ASIN(
      (v_pulsar_z - v_ship_z) / v_distance
    )))::INT;

    -- Insertion dans signals
    INSERT INTO signals (
      ship_id,
      source_type,
      source_system_id,
      source_object_id,
      source_event_id,
      frequency_hz,
      support,
      duration_sec,
      attributes
    ) VALUES (
      p_ship_id,
      'PULSAR',
      r.id,
      NULL,
      NULL,
      v_freq_hz,
      'EM_RADIO',
      NULL,
      jsonb_build_object(
        'band',           p_band,
        'azimuth',        v_azimuth,
        'elevation',      v_elevation,
        'distance_al',    ROUND(v_distance),
        'flux_relative',  ROUND(v_flux::NUMERIC, 2),
        'pulse_period_s', (r.attributes->>'pulse_period_s')::NUMERIC,
        'rotation_frequency_hz', (r.attributes->>'rotation_frequency_hz')::NUMERIC,
        'is_periodic',    true,
        'source_system_id', r.id
      )
    );

    v_inserted := v_inserted + 1;

  END LOOP;

  RETURN json_build_object(
    'inserted',  v_inserted,
    'evaluated', v_evaluated,
    'band',      p_band,
    'ship_id',   p_ship_id::TEXT
  );

END;
$function$;

COMMENT ON FUNCTION public.compute_pulsar_signals(uuid, text) IS
  'Insère les signaux des pulsars visibles depuis le vaisseau du joueur connecté dans la bande donnée (un signal par pulsar et par vaisseau).';

REVOKE ALL ON FUNCTION public.compute_pulsar_signals(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compute_pulsar_signals(uuid, text) TO authenticated;
