-- LACUNA — Colonne structure sur observations (signal ponctuel vs périodique)
-- Mars 2026

ALTER TABLE observations ADD COLUMN IF NOT EXISTS structure TEXT;

COMMENT ON COLUMN observations.structure IS 'Structure du signal : non uniforme (ponctuel), pulsé, pulsé régulier (périodique)';
