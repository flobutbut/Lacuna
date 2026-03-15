-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Carte : policies anon pour prototype (user_id NULL)
-- Permet au vaisseau prototype de gérer sa carte sans authentification
-- ═══════════════════════════════════════════════════════════════════════════════

-- map_nodes : anon peut gérer la carte du vaisseau prototype
CREATE POLICY "Anon can manage map for prototype ship" ON map_nodes
  FOR ALL
  USING (
    ship_id IN (SELECT id FROM ships WHERE user_id IS NULL)
  )
  WITH CHECK (
    ship_id IN (SELECT id FROM ships WHERE user_id IS NULL)
  );

-- map_edges : idem
CREATE POLICY "Anon can manage map edges for prototype ship" ON map_edges
  FOR ALL
  USING (
    ship_id IN (SELECT id FROM ships WHERE user_id IS NULL)
  )
  WITH CHECK (
    ship_id IN (SELECT id FROM ships WHERE user_id IS NULL)
  );
