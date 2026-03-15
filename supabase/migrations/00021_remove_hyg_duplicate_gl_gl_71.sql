-- Suppression doublon HYG : gl-gl-71 = Tau Ceti = TAU_CETI
-- L'import HYG avait créé gl-gl-71 avant le LACUNA_ID_MAP ; TAU_CETI (seed) existe déjà.
-- Deux étoiles à la même position → tooltip affichait "Gliese Gl 71" au lieu de "Tau Ceti".
DELETE FROM stellar_systems WHERE id = 'gl-gl-71';

COMMENT ON TABLE stellar_systems IS 'Systèmes stellaires. Éviter doublons HYG/LACUNA (gl-gl-71→TAU_CETI, etc.) via LACUNA_ID_MAP à l''import.';
