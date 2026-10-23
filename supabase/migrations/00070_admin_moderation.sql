-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Modération : liste des joueurs, suspension, renommage, suppression
--
--   • Un admin (profiles.role = 'admin') voit tous les comptes et agit dessus par des RPC
--     SECURITY DEFINER : la RLS reste inchangée (un joueur ne lit toujours que son profil).
--   • Suspension : auth.users.banned_until (GoTrue refuse alors la connexion et le renouvellement
--     du jeton) + fermeture des sessions. Le jeton d'accès déjà émis reste valable jusqu'à son
--     expiration (1 h par défaut) ; la suspension est levée en vidant banned_until.
--   • Interprétations : seul texte d'un joueur visible par les autres (anonyme). L'admin voit
--     l'auteur et peut supprimer. Le journal de bord reste privé : il n'est pas exposé ici.
--   • admin_actions : journal des actions de modération, lisible par les admins via RPC seulement.
--     target_user_id n'a pas de clé étrangère : l'entrée survit à la suppression du compte.
--   • Un compte admin ne peut pas être modéré ici (ni soi-même) ; les rôles restent attribués à la main.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Journal des actions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL
    CONSTRAINT admin_actions_action_check CHECK (action IN
      ('suspend', 'unsuspend', 'rename', 'delete_player', 'delete_interpretation')),
  target_user_id uuid,
  target_pseudo text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON public.admin_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON public.admin_actions (target_user_id);

COMMENT ON TABLE public.admin_actions IS
  'Journal des actions de modération. Aucun accès direct : lecture par admin_list_actions (admins).';

ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_actions FROM anon, authenticated;

-- 2. Rôle admin ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

COMMENT ON FUNCTION public.is_admin() IS 'Le compte connecté est-il admin ?';

-- 3. Liste des joueurs ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_players()
RETURNS TABLE (
  user_id uuid,
  email text,
  email_confirmed boolean,
  pseudo text,
  role text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  banned_until timestamptz,
  suspension_reason text,
  ship_id uuid,
  ship_name text,
  current_system_id text,
  travel_state text,
  signals_count bigint,
  observations_count bigint,
  interpretations_count bigint,
  logbook_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.email_confirmed_at IS NOT NULL,
    p.pseudo,
    p.role,
    u.created_at,
    u.last_sign_in_at,
    u.banned_until,
    CASE WHEN u.banned_until > now() THEN
      (SELECT a.details ->> 'reason' FROM admin_actions a
        WHERE a.target_user_id = u.id AND a.action = 'suspend'
        ORDER BY a.created_at DESC LIMIT 1)
    END,
    s.id,
    s.name,
    s.current_system_id,
    s.travel_state::text,
    (SELECT count(*) FROM signals x WHERE x.ship_id = s.id),
    (SELECT count(*) FROM observations x WHERE x.ship_id = s.id),
    (SELECT count(*) FROM interpretations x WHERE x.ship_id = s.id),
    (SELECT count(*) FROM logbook_entries x WHERE x.ship_id = s.id)
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  LEFT JOIN ships s ON s.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.admin_list_players() IS
  'Admin : tous les comptes avec profil, vaisseau, état de suspension et volumes de données.';

-- 4. Suspension ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_set_suspension(p_user uuid, p_suspended boolean, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pseudo text;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
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
  IF coalesce(p_suspended, false) AND v_reason IS NULL THEN
    RAISE EXCEPTION 'Indiquez le motif de la suspension' USING ERRCODE = '22023';
  END IF;
  IF char_length(coalesce(v_reason, '')) > 300 THEN
    RAISE EXCEPTION 'Le motif doit faire 300 caractères au plus' USING ERRCODE = '22023';
  END IF;

  SELECT pseudo INTO v_pseudo FROM profiles WHERE id = p_user;

  IF coalesce(p_suspended, false) THEN
    UPDATE auth.users SET banned_until = now() + interval '100 years' WHERE id = p_user;
    -- Plus de renouvellement possible : les sessions ouvertes expirent avec leur jeton d'accès
    DELETE FROM auth.sessions WHERE user_id = p_user;
  ELSE
    UPDATE auth.users SET banned_until = NULL WHERE id = p_user;
  END IF;

  INSERT INTO admin_actions (admin_id, action, target_user_id, target_pseudo, details)
  VALUES (
    auth.uid(),
    CASE WHEN coalesce(p_suspended, false) THEN 'suspend' ELSE 'unsuspend' END,
    p_user,
    v_pseudo,
    CASE WHEN v_reason IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('reason', v_reason) END
  );
END;
$$;

COMMENT ON FUNCTION public.admin_set_suspension(uuid, boolean, text) IS
  'Admin : suspend (motif obligatoire) ou réactive un compte joueur ; les sessions sont fermées à la suspension.';

-- 5. Renommage (pseudo, nom du vaisseau) ─────────────────────────────────────────
-- Un paramètre nul ou vide laisse la valeur actuelle.
CREATE OR REPLACE FUNCTION public.admin_rename_player(p_user uuid, p_pseudo text DEFAULT NULL, p_ship_name text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pseudo text := nullif(btrim(coalesce(p_pseudo, '')), '');
  v_ship_name text := nullif(btrim(coalesce(p_ship_name, '')), '');
  v_old_pseudo text;
  v_old_ship_name text;
  v_details jsonb := '{}'::jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;
  IF p_user = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = p_user AND role = 'admin') THEN
    RAISE EXCEPTION 'Un compte admin ne peut pas être modéré' USING ERRCODE = '42501';
  END IF;
  SELECT pseudo INTO v_old_pseudo FROM profiles WHERE id = p_user;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ce compte n''a pas encore de partie' USING ERRCODE = 'P0002';
  END IF;
  IF v_pseudo IS NULL AND v_ship_name IS NULL THEN
    RAISE EXCEPTION 'Rien à modifier' USING ERRCODE = '22023';
  END IF;
  IF v_pseudo IS NOT NULL AND char_length(v_pseudo) NOT BETWEEN 2 AND 24 THEN
    RAISE EXCEPTION 'Le pseudo doit faire entre 2 et 24 caractères' USING ERRCODE = '22023';
  END IF;
  IF v_ship_name IS NOT NULL AND char_length(v_ship_name) NOT BETWEEN 2 AND 32 THEN
    RAISE EXCEPTION 'Le nom du vaisseau doit faire entre 2 et 32 caractères' USING ERRCODE = '22023';
  END IF;

  IF v_pseudo IS NOT NULL THEN
    UPDATE profiles SET pseudo = v_pseudo WHERE id = p_user;
    v_details := v_details || jsonb_build_object('pseudo', jsonb_build_object('before', v_old_pseudo, 'after', v_pseudo));
  END IF;
  IF v_ship_name IS NOT NULL THEN
    SELECT name INTO v_old_ship_name FROM ships WHERE user_id = p_user;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ce compte n''a pas de vaisseau' USING ERRCODE = 'P0002';
    END IF;
    UPDATE ships SET name = v_ship_name, updated_at = now() WHERE user_id = p_user;
    v_details := v_details || jsonb_build_object('ship_name', jsonb_build_object('before', v_old_ship_name, 'after', v_ship_name));
  END IF;

  INSERT INTO admin_actions (admin_id, action, target_user_id, target_pseudo, details)
  VALUES (auth.uid(), 'rename', p_user, coalesce(v_pseudo, v_old_pseudo), v_details);
END;
$$;

COMMENT ON FUNCTION public.admin_rename_player(uuid, text, text) IS
  'Admin : remplace le pseudo et/ou le nom du vaisseau d''un joueur (contenu inapproprié). Valeurs avant/après conservées au journal.';

-- 6. Interprétations ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_interpretations(p_limit int DEFAULT 100, p_offset int DEFAULT 0)
RETURNS TABLE (
  id uuid,
  text text,
  confidence text,
  generation int,
  created_at timestamptz,
  trace_designation text,
  author_user_id uuid,
  author_pseudo text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT i.id, i.text, i.confidence::text, i.generation, i.created_at, t.designation, s.user_id, p.pseudo
  FROM interpretations i
  LEFT JOIN traces t ON t.id = i.trace_id
  LEFT JOIN ships s ON s.id = i.ship_id
  LEFT JOIN profiles p ON p.id = s.user_id
  ORDER BY i.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 100), 200))
  OFFSET greatest(0, coalesce(p_offset, 0));
END;
$$;

COMMENT ON FUNCTION public.admin_list_interpretations(int, int) IS
  'Admin : interprétations des traces, de la plus récente à la plus ancienne, avec leur auteur.';

CREATE OR REPLACE FUNCTION public.admin_delete_interpretation(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text text;
  v_user uuid;
  v_pseudo text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;

  SELECT i.text, s.user_id, p.pseudo INTO v_text, v_user, v_pseudo
    FROM interpretations i
    LEFT JOIN ships s ON s.id = i.ship_id
    LEFT JOIN profiles p ON p.id = s.user_id
   WHERE i.id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Interprétation introuvable' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM interpretations WHERE id = p_id;

  INSERT INTO admin_actions (admin_id, action, target_user_id, target_pseudo, details)
  VALUES (auth.uid(), 'delete_interpretation', v_user, v_pseudo, jsonb_build_object('text', left(v_text, 300)));
END;
$$;

COMMENT ON FUNCTION public.admin_delete_interpretation(uuid) IS
  'Admin : supprime une interprétation (début du texte conservé au journal).';

-- 7. Suppression d'un compte ─────────────────────────────────────────────────────
-- Même effacement que delete_account(), pour le compte d'un autre joueur.
CREATE OR REPLACE FUNCTION public.admin_delete_player(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pseudo text;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;
  IF p_user IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user) THEN
    RAISE EXCEPTION 'Compte introuvable' USING ERRCODE = 'P0002';
  END IF;
  IF p_user = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = p_user AND role = 'admin') THEN
    RAISE EXCEPTION 'Un compte admin ne peut pas être supprimé ici' USING ERRCODE = '42501';
  END IF;

  SELECT pseudo INTO v_pseudo FROM profiles WHERE id = p_user;

  INSERT INTO admin_actions (admin_id, action, target_user_id, target_pseudo)
  VALUES (auth.uid(), 'delete_player', p_user, v_pseudo);

  DELETE FROM interpretations
   WHERE ship_id IN (SELECT id FROM ships WHERE user_id = p_user);
  UPDATE traces SET discovered_by = NULL
   WHERE discovered_by IN (SELECT id FROM ships WHERE user_id = p_user);

  DELETE FROM auth.users WHERE id = p_user;
END;
$$;

COMMENT ON FUNCTION public.admin_delete_player(uuid) IS
  'Admin : supprime définitivement le compte d''un joueur, sa partie et ses interprétations.';

-- 8. Journal des actions ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_list_actions(p_limit int DEFAULT 50)
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  action text,
  admin_pseudo text,
  target_user_id uuid,
  target_pseudo text,
  details jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Réservé à l''administration' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT a.id, a.created_at, a.action, p.pseudo, a.target_user_id, a.target_pseudo, a.details
  FROM admin_actions a
  LEFT JOIN profiles p ON p.id = a.admin_id
  ORDER BY a.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 200));
END;
$$;

COMMENT ON FUNCTION public.admin_list_actions(int) IS 'Admin : dernières actions de modération.';

-- 9. Droits ──────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_players() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_suspension(uuid, boolean, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_rename_player(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_interpretations(int, int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_interpretation(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_delete_player(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_actions(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_players() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_suspension(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rename_player(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_interpretations(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_interpretation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_player(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_actions(int) TO authenticated;
