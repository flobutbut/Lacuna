-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Quatrième origine de trace : PRÉCURSEUR (LACUNA_GDD.md §3, LACUNA_TRACES.md §5)
--
-- Traces de Yael, vaisseau humain parti avant le joueur. Seule la valeur est ajoutée ici :
-- PostgreSQL interdit de l'utiliser dans la transaction qui l'ajoute (voir 00055).
-- Non appliquée en production sans accord.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TYPE public.trace_origin ADD VALUE IF NOT EXISTS 'PRÉCURSEUR';
