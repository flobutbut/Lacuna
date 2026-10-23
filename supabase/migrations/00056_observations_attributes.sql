-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Observations : mesures du signal d'origine
--
-- Une observation de signal perdait la polarisation et la période mesurées en passant
-- au Laboratoire. `attributes` les conserve (polarization, pulse_period_s) pour que les
-- instruments les reprennent au lieu de les tirer au hasard.
-- Non appliquée en production sans accord.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.observations
  ADD COLUMN IF NOT EXISTS attributes jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.observations.attributes IS 'Mesures du signal d''origine reprises par le Laboratoire : polarization, pulse_period_s.';
