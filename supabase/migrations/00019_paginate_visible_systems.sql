-- Pagination get_visible_systems : deux passes (mag ≤ 8 puis mag 8–18)
-- Paramètres p_magnitude_min, p_limit, p_offset pour charger par pages de 5000
-- Champs luminosity, color_index ajoutés au retour

CREATE OR REPLACE FUNCTION get_visible_systems(
  p_viewer_system_id TEXT,
  p_magnitude_limit  NUMERIC DEFAULT 18,
  p_magnitude_min    NUMERIC DEFAULT NULL,
  p_limit            INT     DEFAULT 5000,
  p_offset           INT     DEFAULT 0
)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  spectral_type TEXT,
  distance NUMERIC,
  age NUMERIC,
  planets INT,
  habitable_zone BOOLEAN,
  anomaly_level INT,
  coordinates JSONB,
  apparent_magnitude NUMERIC,
  luminosity NUMERIC,
  color_index NUMERIC
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_x NUMERIC; v_y NUMERIC; v_z NUMERIC;
  coord JSONB;
BEGIN
  SELECT COALESCE(ss.coordinates, '{}'::jsonb)
  INTO coord FROM stellar_systems ss WHERE ss.id = p_viewer_system_id;

  IF coord ? 'x' AND coord ? 'y' AND coord ? 'z' THEN
    v_x := COALESCE((coord->>'x')::numeric, 0);
    v_y := COALESCE((coord->>'y')::numeric, 0);
    v_z := COALESCE((coord->>'z')::numeric, 0);
  ELSE
    SELECT x, y, z INTO v_x, v_y, v_z
    FROM ra_dec_distance_to_xyz(
      COALESCE((coord->>'ra')::numeric, 0),
      COALESCE((coord->>'dec')::numeric, 0),
      COALESCE((SELECT s2.distance::numeric FROM stellar_systems s2 WHERE s2.id = p_viewer_system_id), 0)
    ) LIMIT 1;
    v_x := COALESCE(v_x, 0); v_y := COALESCE(v_y, 0); v_z := COALESCE(v_z, 0);
  END IF;

  RETURN QUERY
  WITH targets AS (
    SELECT
      ss.id, ss.name, ss.spectral_type, ss.distance, ss.age, ss.planets,
      ss.habitable_zone, ss.anomaly_level, ss.coordinates, ss.apparent_magnitude,
      ss.luminosity, ss.color_index,
      CASE WHEN ss.coordinates ? 'x' AND ss.coordinates ? 'y' AND ss.coordinates ? 'z'
        THEN COALESCE((ss.coordinates->>'x')::numeric, 0)
        ELSE (SELECT r.x FROM ra_dec_distance_to_xyz(COALESCE((ss.coordinates->>'ra')::numeric, 0), COALESCE((ss.coordinates->>'dec')::numeric, 0), COALESCE(ss.distance::numeric, 0)) r LIMIT 1)
      END AS tx,
      CASE WHEN ss.coordinates ? 'x' AND ss.coordinates ? 'y' AND ss.coordinates ? 'z'
        THEN COALESCE((ss.coordinates->>'y')::numeric, 0)
        ELSE (SELECT r.y FROM ra_dec_distance_to_xyz(COALESCE((ss.coordinates->>'ra')::numeric, 0), COALESCE((ss.coordinates->>'dec')::numeric, 0), COALESCE(ss.distance::numeric, 0)) r LIMIT 1)
      END AS ty,
      CASE WHEN ss.coordinates ? 'x' AND ss.coordinates ? 'y' AND ss.coordinates ? 'z'
        THEN COALESCE((ss.coordinates->>'z')::numeric, 0)
        ELSE (SELECT r.z FROM ra_dec_distance_to_xyz(COALESCE((ss.coordinates->>'ra')::numeric, 0), COALESCE((ss.coordinates->>'dec')::numeric, 0), COALESCE(ss.distance::numeric, 0)) r LIMIT 1)
      END AS tz
    FROM stellar_systems ss
    WHERE ss.id != p_viewer_system_id
  ),
  with_dmag AS (
    SELECT t.id, t.name, t.spectral_type, t.distance, t.age, t.planets,
           t.habitable_zone, t.anomaly_level, t.coordinates, t.luminosity, t.color_index,
           SQRT(POWER(t.tx - v_x, 2) + POWER(t.ty - v_y, 2) + POWER(t.tz - v_z, 2)) AS d3d,
           COALESCE(t.apparent_magnitude,
             spectral_type_to_absolute_magnitude(t.spectral_type) +
             5 * LOG(10, GREATEST(SQRT(POWER(t.tx - v_x, 2) + POWER(t.ty - v_y, 2) + POWER(t.tz - v_z, 2)) / 3.26156 / 10, 0.001))
           ) AS mapp
    FROM targets t
  )
  SELECT w.id, w.name, w.spectral_type, w.distance, w.age, w.planets,
         w.habitable_zone, w.anomaly_level, w.coordinates,
         ROUND(w.mapp::numeric, 2), w.luminosity, w.color_index
  FROM with_dmag w
  WHERE w.d3d >= 0.01
    AND w.mapp <= p_magnitude_limit
    AND (p_magnitude_min IS NULL OR w.mapp > p_magnitude_min)
  ORDER BY w.mapp
  LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION get_visible_systems IS 'Systèmes stellaires visibles depuis p_viewer_system_id. Pagination : p_magnitude_min (exclu), p_limit, p_offset. Passe 1 : mag≤8. Passe 2 : mag 8–18 par pages.';
