-- Supprimer les versions obsolètes de get_visible_systems (surcharge)
-- Ne garder que la version avec p_magnitude_min, p_limit, p_offset (00019)
--
-- Pour lister les versions avant migration :
-- SELECT p.proname, pg_get_function_arguments(p.oid) AS args
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname = 'get_visible_systems';

-- Version 2 params (00009, 00017) — obsolète
DROP FUNCTION IF EXISTS get_visible_systems(TEXT, NUMERIC);

-- Vérification : une seule signature doit rester
-- SELECT p.proname, pg_get_function_arguments(p.oid) AS args
-- FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public' AND p.proname = 'get_visible_systems';
