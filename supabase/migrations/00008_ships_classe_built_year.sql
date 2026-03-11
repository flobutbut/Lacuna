-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Identité vaisseau : classe + built_year
-- built_year = année(created_at) + 212 (trigger, EXTRACT non immutable pour GENERATED)
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE ships
  ADD COLUMN IF NOT EXISTS classe TEXT DEFAULT 'Vaisseau générationnel de classe I';

ALTER TABLE ships
  ADD COLUMN IF NOT EXISTS built_year INT;

COMMENT ON COLUMN ships.classe IS 'Classe du vaisseau (ex. Vaisseau générationnel de classe I)';
COMMENT ON COLUMN ships.built_year IS 'Année construction fiction = année(created_at) + 212';

CREATE OR REPLACE FUNCTION ships_set_built_year()
RETURNS TRIGGER AS $$
BEGIN
  NEW.built_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, NOW()))::int + 212;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ships_built_year ON ships;
CREATE TRIGGER tr_ships_built_year
  BEFORE INSERT OR UPDATE OF created_at
  ON ships
  FOR EACH ROW
  EXECUTE FUNCTION ships_set_built_year();

-- Remplir built_year pour les lignes existantes
UPDATE ships SET built_year = EXTRACT(YEAR FROM created_at)::int + 212 WHERE built_year IS NULL;
