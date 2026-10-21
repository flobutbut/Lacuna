-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Comptes joueurs (étape 5) : règles d'accès par joueur, fin du prototype
-- Plan : docs/architecture/PLAN_COMPTES_JOUEURS.md
--
-- DESTRUCTIF : supprime le vaisseau prototype (user_id nul) et ses données, ainsi que
-- les signaux / observations du prototype sans vaisseau. Sauvegarde obligatoire avant.
--
-- Principe : chaque joueur ne lit et n'écrit que ce qui appartient à son vaisseau ;
-- les données du monde restent en lecture seule ; les interprétations sont lisibles
-- par tous sans leur auteur (ship_id) ; aucun accès sans compte aux données de jeu.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Données du prototype ────────────────────────────────────────────────────────
-- Signaux et observations rattachés à une session navigateur, sans vaisseau
-- (les signaux modèles 'seed-demo' sont conservés : start_new_game les copie)
DELETE FROM public.signals WHERE ship_id IS NULL AND coalesce(session_id, '') <> 'seed-demo';
DELETE FROM public.observations WHERE ship_id IS NULL;  -- lab_reports suivent (CASCADE)
-- Vaisseau prototype : systèmes, population, carte, voyages, signaux, observations suivent (CASCADE)
DELETE FROM public.ships WHERE user_id IS NULL;

-- 2. Vaisseau ────────────────────────────────────────────────────────────────────
-- Création par start_new_game uniquement ; pas de suppression côté client
DROP POLICY IF EXISTS "Anon can read prototype ship" ON public.ships;
DROP POLICY IF EXISTS "Anon can update prototype ship" ON public.ships;
DROP POLICY IF EXISTS "Users can manage own ship" ON public.ships;
DROP POLICY IF EXISTS "Players read own ship" ON public.ships;
DROP POLICY IF EXISTS "Players update own ship" ON public.ships;
CREATE POLICY "Players read own ship" ON public.ships
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Players update own ship" ON public.ships
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 3. Systèmes et population : lecture seule ──────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own ship_systems" ON public.ship_systems;
DROP POLICY IF EXISTS "Players read own ship_systems" ON public.ship_systems;
CREATE POLICY "Players read own ship_systems" ON public.ship_systems
  FOR SELECT TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can manage own population" ON public.populations;
DROP POLICY IF EXISTS "Players read own population" ON public.populations;
CREATE POLICY "Players read own population" ON public.populations
  FOR SELECT TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));

-- 4. Carte et voyages : suppression des accès prototype ──────────────────────────
-- Les politiques « Users can manage own … » (00001, 00031) restent en place.
DROP POLICY IF EXISTS "Anon can manage map for prototype ship" ON public.map_nodes;
DROP POLICY IF EXISTS "Anon can manage map edges for prototype ship" ON public.map_edges;
DROP POLICY IF EXISTS "Anon can insert prototype ship travels" ON public.ship_travels;
DROP POLICY IF EXISTS "Anon can read prototype ship travels" ON public.ship_travels;

-- 5. Signaux, observations, rapports de laboratoire ──────────────────────────────
DROP POLICY IF EXISTS "Allow all signals for prototype" ON public.signals;
DROP POLICY IF EXISTS "Players manage own signals" ON public.signals;
CREATE POLICY "Players manage own signals" ON public.signals
  FOR ALL TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Allow all observations for prototype" ON public.observations;
DROP POLICY IF EXISTS "Players manage own observations" ON public.observations;
CREATE POLICY "Players manage own observations" ON public.observations
  FOR ALL TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())))
  WITH CHECK (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS "Allow all lab_reports for prototype" ON public.lab_reports;
DROP POLICY IF EXISTS "Players manage own lab_reports" ON public.lab_reports;
CREATE POLICY "Players manage own lab_reports" ON public.lab_reports
  FOR ALL TO authenticated
  USING (observation_id IN (
    SELECT o.id FROM public.observations o
    JOIN public.ships s ON s.id = o.ship_id
    WHERE s.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (observation_id IN (
    SELECT o.id FROM public.observations o
    JOIN public.ships s ON s.id = o.ship_id
    WHERE s.user_id = (SELECT auth.uid())
  ));

-- 6. Interprétations : lisibles par tous, sans leur auteur ───────────────────────
DROP POLICY IF EXISTS "Anyone can read interpretations" ON public.interpretations;
DROP POLICY IF EXISTS "Users can insert interpretations" ON public.interpretations;
DROP POLICY IF EXISTS "Allow delete interpretations" ON public.interpretations;
DROP POLICY IF EXISTS "Players read interpretations" ON public.interpretations;
DROP POLICY IF EXISTS "Players add own interpretations" ON public.interpretations;
DROP POLICY IF EXISTS "Players delete own interpretations" ON public.interpretations;
CREATE POLICY "Players read interpretations" ON public.interpretations
  FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Players add own interpretations" ON public.interpretations
  FOR INSERT TO authenticated
  WITH CHECK (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "Players delete own interpretations" ON public.interpretations
  FOR DELETE TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));

-- ship_id (auteur) jamais exposé en lecture
REVOKE ALL ON public.interpretations FROM anon, authenticated;
GRANT SELECT (id, trace_id, generation, ship_age, galactic_date, text, direction, confidence, created_at)
  ON public.interpretations TO authenticated;
GRANT INSERT (trace_id, ship_id, generation, ship_age, galactic_date, text, direction, confidence)
  ON public.interpretations TO authenticated;
GRANT DELETE ON public.interpretations TO authenticated;

-- 7. Traces : lecture sans discovered_by (vaisseau découvreur) ───────────────────
REVOKE ALL ON public.traces FROM anon, authenticated;
GRANT SELECT (id, designation, type, origin, system_id, coordinates, age, difficulty, real_reference,
              description, visual, points_to, discovered, created_at, updated_at)
  ON public.traces TO authenticated;

-- 8. Constellations : RLS absente jusqu'ici (écriture possible avec la clé publique) ─
ALTER TABLE public.constellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constellation_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read constellations" ON public.constellations;
CREATE POLICY "Public read constellations" ON public.constellations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public read constellation_lines" ON public.constellation_lines;
CREATE POLICY "Public read constellation_lines" ON public.constellation_lines FOR SELECT USING (true);

-- 9. TRUNCATE n'est pas soumis à la RLS : retiré aux rôles de l'API ──────────────
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
