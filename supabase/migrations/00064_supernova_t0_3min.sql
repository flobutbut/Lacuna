-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Supernova de Bételgeuse : T0 = création de la partie + 3 minutes (au lieu de 10)
-- Dix minutes laissaient le nouveau joueur sans rien à voir trop longtemps.
-- Les parties dont la bouffée n'est pas encore arrivée sont alignées sur le nouveau délai.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.ships ALTER COLUMN supernova_t0 SET DEFAULT (now() + interval '3 minutes');

COMMENT ON COLUMN public.ships.supernova_t0 IS
  'Bouffée de neutrinos de la supernova de Bételgeuse pour cette partie (création + 3 min). Les phases suivantes en découlent.';

UPDATE public.ships
SET supernova_t0 = created_at + interval '3 minutes'
WHERE supernova_captured_at IS NULL
  AND supernova_t0 > now()
  AND created_at IS NOT NULL;
