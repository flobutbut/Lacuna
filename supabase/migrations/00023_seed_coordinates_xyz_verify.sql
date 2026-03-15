-- Conversion ra/dec → x/y/z pour systèmes seed (sans x/y/z)
-- Log du nombre de systèmes mis à jour + vérification PROXIMA, BARNARD, etc.

DO $$
DECLARE
  updated_count INT;
  missing TEXT;
BEGIN
  UPDATE stellar_systems
  SET coordinates = jsonb_build_object(
    'x', ROUND((distance * COS(RADIANS((coordinates->>'dec')::numeric))
                * COS(RADIANS((coordinates->>'ra')::numeric)))::numeric, 6),
    'y', ROUND((distance * COS(RADIANS((coordinates->>'dec')::numeric))
                * SIN(RADIANS((coordinates->>'ra')::numeric)))::numeric, 6),
    'z', ROUND((distance * SIN(RADIANS((coordinates->>'dec')::numeric)))::numeric, 6)
  )
  WHERE coordinates ? 'ra'
    AND coordinates ? 'dec'
    AND NOT (coordinates ? 'x')
    AND distance IS NOT NULL
    AND distance > 0;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Migration 00023: % systèmes stellaires convertis ra/dec → x/y/z', updated_count;

  -- Vérification : systèmes seed doivent avoir x/y/z
  SELECT string_agg(ss.id, ', ') INTO missing
  FROM stellar_systems ss
  WHERE ss.id IN ('PROXIMA', 'BARNARD', 'ROSS128', 'TAU_CETI', 'GLIESE667', 'HD44594', 'EPSILON_ERIDANI')
    AND (NOT (ss.coordinates ? 'x') OR NOT (ss.coordinates ? 'y') OR NOT (ss.coordinates ? 'z'));

  IF missing IS NOT NULL THEN
    RAISE WARNING 'Migration 00023: systèmes sans x/y/z après conversion: %', missing;
  ELSE
    RAISE NOTICE 'Migration 00023: vérification OK — PROXIMA, BARNARD, ROSS128, TAU_CETI, GLIESE667, HD44594, EPSILON_ERIDANI ont x/y/z';
  END IF;
END;
$$;
