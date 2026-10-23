-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Données astronomiques des systèmes du Fil des 75
-- (LACUNA_SCENARIOS.md §5.3, LACUNA_TRACES_IMMUABLES.md)
--
-- Règle absolue du modèle de données (§1) : une donnée sourcée n'est jamais remplacée.
-- Chaque UPDATE ne touche donc que les champs vides ou sans source, et inscrit sa source.
-- Vérifiés contre la doc, sans changement nécessaire : distances (4,24 / 11,0 / 22 al),
-- périodes (Proxima b 11,2 j · Ross 128 b ~9,9 j · GJ 667Cc 28 j), masse de GJ 667Cc (3,8 M⊕).
-- Non appliquée en production sans accord.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.system_objects
  ADD COLUMN IF NOT EXISTS tidally_locked boolean,
  ADD COLUMN IF NOT EXISTS rotation_period_h numeric;

COMMENT ON COLUMN public.system_objects.tidally_locked IS 'Rotation verrouillée par la marée sur son étoile (valeur de jeu pour Ross 128 b).';
COMMENT ON COLUMN public.system_objects.rotation_period_h IS 'Période de rotation propre (heures), si la planète n''est pas verrouillée.';

-- Proxima b : verrouillée (terminateur permanent) ; masse minimale 1,07 M⊕ (Faria et al., 2022)
UPDATE public.system_objects
SET tidally_locked = true,
    field_sources = coalesce(field_sources, '{}'::jsonb) || '{"tidally_locked": "MANUAL"}'::jsonb
WHERE system_id = 'PROXIMA' AND type = 'PLANET' AND designation = 'b'
  AND tidally_locked IS NULL;

UPDATE public.system_objects
SET mass_earth = 1.07,
    field_sources = coalesce(field_sources, '{}'::jsonb) || '{"mass_earth": "MANUAL"}'::jsonb
WHERE system_id = 'PROXIMA' AND type = 'PLANET' AND designation = 'b'
  AND field_sources->>'mass_earth' IS NULL
  AND mass_earth IS DISTINCT FROM 1.07;

-- Ross 128 b : valeur de jeu — non verrouillée, cycle jour-nuit de 61 h (réalité : rotation non mesurée)
UPDATE public.system_objects
SET tidally_locked = false,
    rotation_period_h = 61,
    field_sources = coalesce(field_sources, '{}'::jsonb) || '{"tidally_locked": "MANUAL", "rotation_period_h": "MANUAL"}'::jsonb
WHERE system_id = 'ROSS128' AND type = 'PLANET' AND designation = 'b'
  AND tidally_locked IS NULL AND rotation_period_h IS NULL;
