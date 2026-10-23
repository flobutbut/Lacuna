-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Traces : appartenance à un scénario et champs des traces précurseur
-- (LACUNA_SCENARIOS.md §1, LACUNA_TRACES_IMMUABLES.md §4)
--
--   scenario_arc          arc d'une trace de scénario (ex. 'scn-02-fil-des-75'), ou de la trace
--                         effleurée par une entrée de Yael. Jamais exposé au joueur.
--   linked_trace_id       « Trace liée » d'une entrée de Yael (optionnelle)
--   precursor_generation  génération de voyage de Yael au moment de l'entrée
--
-- Les droits de lecture des joueurs sur `traces` sont accordés colonne par colonne (00048) :
-- ces colonnes n'y figurent pas, elles ne sont donc pas lisibles côté client.
-- Non appliquée en production sans accord.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.traces
  ADD COLUMN IF NOT EXISTS scenario_arc text,
  ADD COLUMN IF NOT EXISTS linked_trace_id uuid REFERENCES public.traces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS precursor_generation int;

ALTER TABLE public.traces
  ADD CONSTRAINT traces_precursor_generation_check
  CHECK (precursor_generation IS NULL OR origin = 'PRÉCURSEUR');

CREATE INDEX IF NOT EXISTS idx_traces_scenario_arc ON public.traces(scenario_arc) WHERE scenario_arc IS NOT NULL;

COMMENT ON COLUMN public.traces.scenario_arc IS 'Arc de scénario (jamais exposé au joueur). Réf. LACUNA_SCENARIOS.md.';
COMMENT ON COLUMN public.traces.linked_trace_id IS 'Trace immuable commentée par une entrée précurseur (optionnelle).';
COMMENT ON COLUMN public.traces.precursor_generation IS 'Génération de voyage de Yael à la date de l''entrée (origine PRÉCURSEUR uniquement).';

-- Rappel explicite : aucune lecture de ces colonnes par les joueurs
REVOKE SELECT (scenario_arc, linked_trace_id, precursor_generation) ON public.traces FROM anon, authenticated;
