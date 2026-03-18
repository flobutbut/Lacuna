-- RPC dédiée Vue 3D conception : tous les systèmes avec coordonnées, paginé (pas de filtre magnitude ni viewer)
-- Utilisée pour vue d'ensemble du catalogue et sélection par paramètres (filtres côté client)

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
  color_index NUMERIC
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
    ss.color_index
  FROM stellar_systems ss
  WHERE ss.coordinates IS NOT NULL
    AND (ss.coordinates ? 'x' AND ss.coordinates ? 'y' AND ss.coordinates ? 'z'
         OR ss.coordinates ? 'ra' AND ss.coordinates ? 'dec')
  ORDER BY ss.distance ASC NULLS LAST, ss.id
  LIMIT p_limit OFFSET p_offset;
$$;

COMMENT ON FUNCTION get_systems_for_conception IS 'Systèmes pour Vue 3D conception : tous avec coordonnées, paginé. Pas de filtre magnitude ni viewer.';
