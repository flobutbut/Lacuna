-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Modération : réinitialiser la partie d'un joueur
--
--   • admin_reset_player(uuid) : remet le compte dans l'état qui suit le clic sur le lien de
--     confirmation — compte, email confirmé et mot de passe conservés ; vaisseau et toutes ses
--     données effacés (même effacement que reset_my_game), profil supprimé (pseudo à rechoisir).
--     Le joueur revoit l'écran « Bienvenue à bord » et tout l'onboarding au prochain chargement.
--   • admin_actions : nouvelle action 'reset_game' (pseudo et nom du vaisseau conservés au journal).
--   • Comme les autres actions de modération : réservé aux admins, jamais sur un compte admin.
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.admin_actions DROP CONSTRAINT IF EXISTS admin_actions_action_check;
ALTER TABLE public.admin_actions
  ADD CONSTRAINT admin_actions_action_check CHECK (action IN
    ('suspend', 'unsuspend', 'rename', 'reset_game', 'delete_player', 'delete_interpretation'));

CREATE OR REPLACE FUNCTION public.admin_reset_player(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pseudo text;
  v_ship_name text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;
  IF p_user IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user) THEN
    RAISE EXCEPTION 'Compte introuvable' USING ERRCODE = 'P0002';
  END IF;
  IF p_user = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = p_user AND role = 'admin') THEN
    RAISE EXCEPTION 'Un compte admin ne peut pas être modéré' USING ERRCODE = '42501';
  END IF;

  SELECT pseudo INTO v_pseudo FROM profiles WHERE id = p_user;
  SELECT name INTO v_ship_name FROM ships WHERE user_id = p_user;
  IF v_pseudo IS NULL AND v_ship_name IS NULL THEN
    RAISE EXCEPTION 'Ce compte n''a pas encore de partie' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM interpretations
   WHERE ship_id IN (SELECT id FROM ships WHERE user_id = p_user);
  UPDATE traces SET discovered_by = NULL
   WHERE discovered_by IN (SELECT id FROM ships WHERE user_id = p_user);
  -- Le reste suit en cascade : systèmes, population, carte, voyages, signaux,
  -- observations et rapports, journal, traces embarquées et découvertes
  DELETE FROM ships WHERE user_id = p_user;
  DELETE FROM profiles WHERE id = p_user;

  INSERT INTO admin_actions (admin_id, action, target_user_id, target_pseudo, details)
  VALUES (
    auth.uid(), 'reset_game', p_user, v_pseudo,
    CASE WHEN v_ship_name IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('ship', v_ship_name) END
  );
END;
$$;

COMMENT ON FUNCTION public.admin_reset_player(uuid) IS
  'Admin : efface la partie et le profil d''un joueur (compte, email confirmé et mot de passe conservés) ; il refait l''onboarding.';

REVOKE ALL ON FUNCTION public.admin_reset_player(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_reset_player(uuid) TO authenticated;
