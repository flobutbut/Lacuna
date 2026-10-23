-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Type de trace BIOLOGICAL (LACUNA_TRACES.md v0.5, LACUNA_SCENARIOS.md §5.3)
--
-- Utilisé par la lecture « contact » de ROSS128-SCN02-001 (tapis organique, acides aminés).
-- Seule la valeur est ajoutée ici : PostgreSQL interdit de l'utiliser dans la même transaction (voir 00060).
-- Non appliquée en production sans accord.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TYPE public.trace_type ADD VALUE IF NOT EXISTS 'BIOLOGICAL';
