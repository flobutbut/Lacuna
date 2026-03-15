-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Modèle de données procédural
-- field_sources, chemical_region_id, colonnes extrapolées, data_source
-- Réf. docs/LACUNA_PROCEDURAL_DATA_MODEL.md §8
-- ═══════════════════════════════════════════════════════════════════════════════

-- stellar_systems
ALTER TABLE public.stellar_systems
  ADD COLUMN IF NOT EXISTS field_sources jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS chemical_region_id text;

COMMENT ON COLUMN public.stellar_systems.field_sources IS 'Traçabilité des sources par champ (HYG, NASA, EXTRAPOLATED, PROCEDURAL...). Réf. LACUNA_PROCEDURAL_DATA_MODEL.';
COMMENT ON COLUMN public.stellar_systems.chemical_region_id IS 'Région chimique galactique (extrapolation).';

-- system_objects
ALTER TABLE public.system_objects
  ADD COLUMN IF NOT EXISTS field_sources jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data_source text DEFAULT 'PROCEDURAL'
    CHECK (data_source IN ('NASA', 'PROCEDURAL', 'LACUNA', 'PLAYER', 'EXTRAPOLATED')),
  ADD COLUMN IF NOT EXISTS density_profile jsonb,
  ADD COLUMN IF NOT EXISTS thermal_map jsonb,
  ADD COLUMN IF NOT EXISTS magnetic_field jsonb,
  ADD COLUMN IF NOT EXISTS surface_composition jsonb,
  ADD COLUMN IF NOT EXISTS sample_analysis jsonb;

COMMENT ON COLUMN public.system_objects.field_sources IS 'Traçabilité des sources par champ. Réf. LACUNA_PROCEDURAL_DATA_MODEL.';
COMMENT ON COLUMN public.system_objects.data_source IS 'Source principale de l''objet : NASA, PROCEDURAL, LACUNA, PLAYER, EXTRAPOLATED.';
COMMENT ON COLUMN public.system_objects.density_profile IS 'Profil de densité extrapolé (couches internes).';
COMMENT ON COLUMN public.system_objects.thermal_map IS 'Carte thermique extrapolée.';
COMMENT ON COLUMN public.system_objects.magnetic_field IS 'Champ magnétique extrapolé.';
COMMENT ON COLUMN public.system_objects.surface_composition IS 'Composition de surface extrapolée.';
COMMENT ON COLUMN public.system_objects.sample_analysis IS 'Analyse d''échantillon extrapolée.';
