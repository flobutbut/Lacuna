-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Champs HYG + NASA pour import données scientifiques
-- Mars 2026 — stellar_systems (lum, ci, mag, has_magnetic_field)
--           system_objects (pl_eqt, atmosphere_composition, magnetic_field_detected)
-- ═══════════════════════════════════════════════════════════════════════════════

-- stellar_systems
ALTER TABLE public.stellar_systems
  ADD COLUMN IF NOT EXISTS luminosity numeric,
  ADD COLUMN IF NOT EXISTS color_index numeric,
  ADD COLUMN IF NOT EXISTS apparent_magnitude numeric,
  ADD COLUMN IF NOT EXISTS has_magnetic_field boolean DEFAULT false;

COMMENT ON COLUMN public.stellar_systems.luminosity IS 'Luminosité relative au Soleil (Soleil = 1.0) — source HYG colonne "lum"';
COMMENT ON COLUMN public.stellar_systems.color_index IS 'Indice couleur B-V (-0.3 bleu → +2.0 rouge) — source HYG colonne "ci"';
COMMENT ON COLUMN public.stellar_systems.apparent_magnitude IS 'Magnitude apparente vue depuis Sol — source HYG colonne "mag"';
COMMENT ON COLUMN public.stellar_systems.has_magnetic_field IS 'Présence de champ magnétique détecté';

-- system_objects
ALTER TABLE public.system_objects
  ADD COLUMN IF NOT EXISTS surface_temperature_k numeric,
  ADD COLUMN IF NOT EXISTS atmosphere_composition jsonb,
  ADD COLUMN IF NOT EXISTS magnetic_field_detected boolean DEFAULT false;

COMMENT ON COLUMN public.system_objects.surface_temperature_k IS 'Température d''équilibre en Kelvin — source NASA colonne "pl_eqt"';
COMMENT ON COLUMN public.system_objects.atmosphere_composition IS 'Composition atmosphérique structurée ex: {"H2O": 0.4, "CO2": 0.3, "CH4": 0.1, "O2": 0.05}';
COMMENT ON COLUMN public.system_objects.magnetic_field_detected IS 'Champ magnétique détecté — source Magnétomètre';
