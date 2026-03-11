-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Table ship_systems (aspect technique du vaisseau)
-- Systèmes, carburant, capacités — 1:1 avec ships
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE ship_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Systèmes (état 0–1, alignés PageSystemes.vue)
  propulsion DECIMAL(4, 3) DEFAULT 0.88 CHECK (propulsion >= 0 AND propulsion <= 1),
  hull DECIMAL(4, 3) DEFAULT 0.97 CHECK (hull >= 0 AND hull <= 1),
  plasma_shield DECIMAL(4, 3) DEFAULT 1 CHECK (plasma_shield >= 0 AND plasma_shield <= 1),
  observatory DECIMAL(4, 3) DEFAULT 1 CHECK (observatory >= 0 AND observatory <= 1),
  reservoir DECIMAL(4, 3) DEFAULT 0.84 CHECK (reservoir >= 0 AND reservoir <= 1),
  alimentation DECIMAL(4, 3) DEFAULT 0.71 CHECK (alimentation >= 0 AND alimentation <= 1),
  atmosphere DECIMAL(4, 3) DEFAULT 0.96 CHECK (atmosphere >= 0 AND atmosphere <= 1),
  medical DECIMAL(4, 3) DEFAULT 0.95 CHECK (medical >= 0 AND medical <= 1),

  -- Carburant (tonnes)
  he3_current DECIMAL(14, 2) DEFAULT 1484000,
  he3_max DECIMAL(14, 2) DEFAULT 2000000,
  deuterium_current DECIMAL(14, 2) DEFAULT 972000,
  deuterium_max DECIMAL(14, 2) DEFAULT 1200000,

  -- Capacités
  dry_mass INT DEFAULT 800000,
  capacity INT DEFAULT 12000,

  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ship_systems_ship ON ship_systems(ship_id);

COMMENT ON TABLE ship_systems IS 'Aspect technique du vaisseau : systèmes, carburant, capacités. 1:1 avec ships.';

-- Migration des données existantes (ships.systems, ships.fuel)
INSERT INTO ship_systems (ship_id, propulsion, hull, plasma_shield, observatory, reservoir, alimentation, atmosphere, medical, he3_current, he3_max, deuterium_current, deuterium_max)
SELECT
  id,
  COALESCE((systems->>'propulsion')::decimal, 0.88),
  COALESCE((systems->>'hull')::decimal, 0.97),
  COALESCE((systems->>'plasmaShield')::decimal, 1),
  COALESCE((systems->>'observatory')::decimal, 1),
  COALESCE((systems->>'reservoir')::decimal, 0.84),
  COALESCE((systems->>'alimentation')::decimal, 0.71),
  COALESCE((systems->>'atmosphere')::decimal, 0.96),
  COALESCE((systems->>'medical')::decimal, 0.95),
  ROUND(2000000 * COALESCE((fuel->>'he3')::decimal, 0.742)),
  2000000,
  ROUND(1200000 * COALESCE((fuel->>'deuterium')::decimal, 0.81)),
  1200000
FROM ships
WHERE (systems IS NOT NULL OR fuel IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM ship_systems ss WHERE ss.ship_id = ships.id);

-- Retirer systems et fuel de ships
ALTER TABLE ships DROP COLUMN IF EXISTS systems;
ALTER TABLE ships DROP COLUMN IF EXISTS fuel;

-- RLS
ALTER TABLE ship_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ship_systems" ON ship_systems
  FOR SELECT
  USING (
    ship_id IN (SELECT id FROM ships WHERE user_id = auth.uid())
    OR ship_id IN (SELECT id FROM ships WHERE user_id IS NULL)
  );
