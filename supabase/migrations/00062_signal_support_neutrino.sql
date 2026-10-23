-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Support de signal NEUTRINO (LACUNA_LABORATOIRE_INSTRUMENTS.md §3.4, §4.14)
--
-- Détecteur de neutrinos à bord, analysé par l'Analyseur de neutrinos. Les mesures d'une
-- bouffée (event_count, duration_s, mean_energy_mev, direction, uncertainty_deg) vivent dans
-- signals.attributes.neutrino, puis dans observations.attributes.
-- Non destructif : ajoute une valeur à l'enum signal_support (signals et observations).
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TYPE public.signal_support ADD VALUE IF NOT EXISTS 'NEUTRINO';
