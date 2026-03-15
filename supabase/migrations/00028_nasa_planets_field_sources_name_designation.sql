-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — field_sources NASA : name, designation, confirmation_status, mass_earth, radius_earth
-- Champs issus de NASA Exoplanet Archive (pl_name, pl_letter, pl_controv_flag, pl_masse, pl_rade)
-- ═══════════════════════════════════════════════════════════════════════════════

UPDATE public.system_objects o
SET field_sources = COALESCE(o.field_sources, '{}'::jsonb) || jsonb_strip_nulls(
  jsonb_build_object(
    'name',                 CASE WHEN o.name IS NOT NULL AND trim(o.name::text) <> '' THEN 'NASA' END,
    'designation',          CASE WHEN o.designation IS NOT NULL AND trim(o.designation::text) <> '' THEN 'NASA' END,
    'confirmation_status',  CASE WHEN o.confirmation_status IS NOT NULL THEN 'NASA' END,
    'mass_earth',           CASE WHEN o.mass_earth IS NOT NULL THEN 'NASA' END,
    'radius_earth',         CASE WHEN o.radius_earth IS NOT NULL THEN 'NASA' END
  )
)
WHERE o.data_source = 'NASA';
