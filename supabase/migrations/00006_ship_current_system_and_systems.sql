-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Position actuelle du vaisseau + systèmes étendus
-- Plan d'action : point de vue depuis current_system_id, systèmes du vaisseau
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Position actuelle = système où se trouve le vaisseau (IDLE/ARRIVED)
ALTER TABLE ships
  ADD COLUMN IF NOT EXISTS current_system_id TEXT REFERENCES stellar_systems(id) DEFAULT 'SOL';

COMMENT ON COLUMN ships.current_system_id IS 'Système où se trouve le vaisseau (IDLE/ARRIVED). Référence pour le point de vue Observatoire.';

-- 2. Systèmes du vaisseau (alignés PageSystemes.vue)
-- propulsion, hull, plasmaShield, observatory + habitat (reservoir, alimentation, atmosphere, medical)
ALTER TABLE ships
  ALTER COLUMN systems SET DEFAULT '{"propulsion": 0.88, "hull": 0.97, "plasmaShield": 1, "observatory": 1, "reservoir": 0.84, "alimentation": 0.71, "atmosphere": 0.96, "medical": 0.95}'::jsonb;

-- 3. Carburant (ratios 0–1, valeurs initiales ARCA)
ALTER TABLE ships
  ALTER COLUMN fuel SET DEFAULT '{"he3": 0.742, "deuterium": 0.81}'::jsonb;

-- 4. Policy : lecture vaisseau prototype (user_id NULL) pour anon sans auth
CREATE POLICY "Anon can read prototype ship" ON ships
  FOR SELECT
  USING (user_id IS NULL);
