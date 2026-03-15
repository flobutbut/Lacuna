-- Unification des coordonnées en x/y/z (référentiel galactique, Sol à l'origine)
-- Conversion ra/dec → x/y/z pour étoiles procédurales et nébuleuses

-- stellar_systems : 97 lignes mises à jour (celles avec ra/dec sans x/y/z)
UPDATE stellar_systems
SET coordinates = jsonb_build_object(
  'x', ROUND((distance * COS(RADIANS((coordinates->>'dec')::numeric)) * COS(RADIANS((coordinates->>'ra')::numeric)))::numeric, 6),
  'y', ROUND((distance * COS(RADIANS((coordinates->>'dec')::numeric)) * SIN(RADIANS((coordinates->>'ra')::numeric)))::numeric, 6),
  'z', ROUND((distance * SIN(RADIANS((coordinates->>'dec')::numeric)))::numeric, 6)
)
WHERE coordinates ? 'ra'
  AND coordinates ? 'dec'
  AND NOT (coordinates ? 'x')
  AND distance IS NOT NULL
  AND distance > 0;

-- nebulas : 4 lignes mises à jour
UPDATE nebulas
SET coordinates = jsonb_build_object(
  'x', ROUND((distance * COS(RADIANS((coordinates->>'dec')::numeric)) * COS(RADIANS((coordinates->>'ra')::numeric)))::numeric, 6),
  'y', ROUND((distance * COS(RADIANS((coordinates->>'dec')::numeric)) * SIN(RADIANS((coordinates->>'ra')::numeric)))::numeric, 6),
  'z', ROUND((distance * SIN(RADIANS((coordinates->>'dec')::numeric)))::numeric, 6)
)
WHERE coordinates ? 'ra'
  AND coordinates ? 'dec'
  AND NOT (coordinates ? 'x')
  AND distance IS NOT NULL
  AND distance > 0;
