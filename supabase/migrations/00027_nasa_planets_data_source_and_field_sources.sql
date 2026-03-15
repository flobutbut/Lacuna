-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — data_source = 'NASA' et field_sources pour planètes des systèmes NASA
-- Un système est NASA si :
--   stellar_systems.field_sources contient au moins un champ sourcé 'NASA'
--   OU une planète du système a des champs orbitaux renseignés (import NASA)
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  cnt_data_source int;
  cnt_field_sources int;
BEGIN
  -- 1) Planètes dont le système parent a des données NASA → data_source = 'NASA'
  WITH nasa_systems AS (
    SELECT DISTINCT s.id
    FROM public.stellar_systems s
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_each_text(s.field_sources) AS t(key, value)
      WHERE t.value = 'NASA'
    )
    OR EXISTS (
      SELECT 1
      FROM public.system_objects o
      WHERE o.system_id = s.id
        AND o.type = 'PLANET'
        AND o.orbital_semi_major_axis_au IS NOT NULL
    )
  )
  UPDATE public.system_objects o
  SET data_source = 'NASA'
  FROM nasa_systems ns
  WHERE o.type = 'PLANET'
    AND o.system_id = ns.id;

  GET DIAGNOSTICS cnt_data_source = ROW_COUNT;
  RAISE NOTICE '00027: planètes avec data_source = ''NASA'' mises à jour : %', cnt_data_source;

  -- 2) field_sources : sourcer champs orbitaux/physiques non NULL comme 'NASA' pour ces planètes
  WITH nasa_systems AS (
    SELECT DISTINCT s.id
    FROM public.stellar_systems s
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_each_text(s.field_sources) AS t(key, value)
      WHERE t.value = 'NASA'
    )
    OR EXISTS (
      SELECT 1
      FROM public.system_objects o
      WHERE o.system_id = s.id
        AND o.type = 'PLANET'
        AND o.orbital_semi_major_axis_au IS NOT NULL
    )
  )
  UPDATE public.system_objects o
  SET field_sources = COALESCE(o.field_sources, '{}'::jsonb) || jsonb_strip_nulls(
    jsonb_build_object(
      'orbital_semi_major_axis_au', CASE WHEN o.orbital_semi_major_axis_au IS NOT NULL THEN 'NASA' END,
      'orbital_period_days',        CASE WHEN o.orbital_period_days IS NOT NULL THEN 'NASA' END,
      'orbital_eccentricity',       CASE WHEN o.orbital_eccentricity IS NOT NULL THEN 'NASA' END,
      'mass_earth',                 CASE WHEN o.mass_earth IS NOT NULL THEN 'NASA' END,
      'radius_earth',               CASE WHEN o.radius_earth IS NOT NULL THEN 'NASA' END,
      'surface_temperature_k',      CASE WHEN o.surface_temperature_k IS NOT NULL THEN 'NASA' END,
      'in_habitable_zone',          CASE WHEN o.in_habitable_zone IS NOT NULL THEN 'NASA' END
    )
  )
  FROM nasa_systems ns
  WHERE o.type = 'PLANET'
    AND o.data_source = 'NASA'
    AND o.system_id = ns.id;

  GET DIAGNOSTICS cnt_field_sources = ROW_COUNT;
  RAISE NOTICE '00027: planètes avec field_sources (NASA) mises à jour : %', cnt_field_sources;
END;
$$;

COMMENT ON COLUMN public.system_objects.data_source IS 'Source principale de l''objet. NASA si le système parent a des champs sourcés NASA (age, spectral_type, etc.).';
