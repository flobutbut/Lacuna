-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Équation de Drake : valeurs de référence (LACUNA_GDD.md §7)
--
-- fl vaut 0,30 dans le GDD (0,31 en base) et N = R* × fp × ne × fl × fi × fc × L,
-- soit 3 × 1 × 0,4 × 0,3 × 0,1 × 0,2 × 10 000 = 72. La base portait n = 12,4.
-- Donnée globale visible de tous les joueurs : non appliquée en production sans accord.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.drake_equation ALTER COLUMN fl SET DEFAULT 0.30;
ALTER TABLE public.drake_equation ALTER COLUMN n SET DEFAULT 72;

UPDATE public.drake_equation
SET fl = 0.30,
    n = r_star * fp * ne * 0.30 * fi * fc * l_val
WHERE fl = 0.31 AND n = 12.4;
