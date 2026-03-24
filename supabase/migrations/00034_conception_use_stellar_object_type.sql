-- Utiliser stellar_systems.object_type pour le filtre pulsar (source canonique, 3918 pulsars)
-- Fallback sur system_objects.type uniquement si stellar_systems.object_type manquant.

DROP FUNCTION IF EXISTS get_systems_for_conception(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_systems_for_conception(
  p_limit  INT DEFAULT 10000,
  p_offset INT DEFAULT 0
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
  color_index NUMERIC,
  object_type TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ss.id,
    ss.name,
    ss.spectral_type,
    ss.distance,
    ss.age,
    ss.planets,
    ss.habitable_zone,
    ss.anomaly_level,
    ss.coordinates,
    ss.apparent_magnitude,
    ss.luminosity,
    ss.color_index,
    COALESCE(
      ss.object_type,
      (
        SELECT so.type::text
        FROM system_objects so
        WHERE so.system_id = ss.id
          AND so.type IN ('STAR'::system_object_type, 'PULSAR'::system_object_type, 'NEUTRON_STAR'::system_object_type, 'MAGNETAR'::system_object_type)
        ORDER BY so.sort_order ASC NULLS LAST
        LIMIT 1
      ),
      'STAR'
    ) AS object_type
  FROM stellar_systems ss
  WHERE ss.coordinates IS NOT NULL
    AND (ss.coordinates ? 'x' AND ss.coordinates ? 'y' AND ss.coordinates ? 'z'
         OR ss.coordinates ? 'ra' AND ss.coordinates ? 'dec')
  ORDER BY ss.distance ASC NULLS LAST, ss.id
  LIMIT p_limit OFFSET p_offset;
$$;

COMMENT ON FUNCTION get_systems_for_conception IS 'Systèmes pour Vue 3D conception. object_type = stellar_systems.object_type (priorité), sinon system_objects.type, défaut STAR.';
