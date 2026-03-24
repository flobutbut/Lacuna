-- 00040_get_pulsars_with_period_rpc.sql
-- RPC pour récupérer tous les pulsars avec pulse_period_s
-- (contourne la limite max_rows de PostgREST sur les tables)

CREATE OR REPLACE FUNCTION get_pulsars_with_period()
RETURNS TABLE (
  id TEXT,
  name TEXT,
  coordinates JSONB,
  attributes JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, name, coordinates, attributes
  FROM stellar_systems
  WHERE object_type = 'PULSAR'
  AND attributes->>'pulse_period_s' IS NOT NULL;
$$;
