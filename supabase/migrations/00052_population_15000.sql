-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Population de départ : 15 000 (LACUNA_GDD.md §3, LACUNA_ARCS.md §1.10)
--
-- Le défaut de populations.total était 10 247 (migration 00001). Aucune dynamique de
-- population n'existe encore : toutes les lignes existantes sont au défaut, on les aligne.
-- Non appliquée en production sans accord.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.populations ALTER COLUMN total SET DEFAULT 15000;

UPDATE public.populations SET total = 15000 WHERE total = 10247;
