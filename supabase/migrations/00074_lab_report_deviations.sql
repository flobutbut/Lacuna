-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Écarts des rapports du Laboratoire (LACUNA_VERDICT.md §4, §9.1) — migration 00074
--
--   Chaque rapport fige les écarts relevés au moment de l'analyse (attendu / mesuré, ou ombre
--   d'un écart hors de portée). NULL = rapport antérieur : le client recalcule ses écarts depuis
--   l'objet, puisqu'ils sont déterminés par l'objet et non tirés à chaque analyse.
--   lab_reports.anomalous reste, dérivé des écarts mesurés, pour les graphes.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.lab_reports ADD COLUMN IF NOT EXISTS deviations JSONB;

COMMENT ON COLUMN public.lab_reports.deviations IS
  'Écarts relevés : [{ id, family, label, expected, measured, requiresNiveau }] ; NULL pour les rapports antérieurs à 00074';
