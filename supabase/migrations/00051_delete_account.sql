-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — RGPD : suppression du compte par le joueur
-- Plan : docs/architecture/PLAN_COMPTES_JOUEURS.md (§9)
--
-- Non destructif à l'application. delete_account() supprime le compte connecté
-- (auth.users) ; suivent en cascade le profil, le vaisseau et toutes ses données
-- (systèmes, population, carte, voyages, signaux, observations, rapports, journal).
-- Les interprétations, lisibles par tous sans leur auteur, passeraient à ship_id nul
-- (ON DELETE SET NULL) : elles sont supprimées explicitement, comme tout texte du joueur.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;

  DELETE FROM interpretations
   WHERE ship_id IN (SELECT id FROM ships WHERE user_id = v_user);
  UPDATE traces SET discovered_by = NULL
   WHERE discovered_by IN (SELECT id FROM ships WHERE user_id = v_user);

  DELETE FROM auth.users WHERE id = v_user;
END;
$$;

COMMENT ON FUNCTION public.delete_account() IS
  'Supprime définitivement le compte du joueur connecté, sa partie et ses interprétations (RGPD).';

REVOKE ALL ON FUNCTION public.delete_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_account() TO authenticated;
