-- 00039_signals_source_type_pulsar.sql
-- Ajouter PULSAR aux valeurs autorisées pour source_type

ALTER TABLE signals DROP CONSTRAINT IF EXISTS signals_source_type_check;

ALTER TABLE signals ADD CONSTRAINT signals_source_type_check CHECK (
  source_type = ANY (ARRAY['OBJECT'::text, 'EVENT'::text, 'PULSAR'::text, 'UNKNOWN'::text])
);
