-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Comptes joueurs (étape 1) : profils, nom du vaisseau, création de partie
-- Plan : docs/architecture/PLAN_COMPTES_JOUEURS.md
--
-- Non destructif : ajoute la table profiles, une contrainte sur ships.name,
-- la fonction start_new_game, et détache les signaux modèles du vaisseau prototype.
-- Les politiques « prototype » restent en place jusqu'à l'étape 5.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Profils joueurs ─────────────────────────────────────────────────────────────
-- Pseudo privé et non unique ; rôle 'player' par défaut, 'admin' attribué à la main :
--   UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid du compte>';
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo text NOT NULL
    CONSTRAINT profiles_pseudo_length CHECK (char_length(pseudo) BETWEEN 2 AND 24),
  role text NOT NULL DEFAULT 'player'
    CONSTRAINT profiles_role_check CHECK (role IN ('player', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Profil privé du joueur (un par compte). Jamais exposé aux autres joueurs.';
COMMENT ON COLUMN public.profiles.pseudo IS 'Pseudo privé, non unique (2–24 caractères, espaces en bord retirés).';
COMMENT ON COLUMN public.profiles.role IS 'player | admin — admin donne accès à la Vue 3D étoiles (conception). Non modifiable par le joueur.';

-- Pseudo normalisé (espaces en bord) et updated_at tenu à jour
CREATE OR REPLACE FUNCTION public.profiles_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.pseudo := btrim(NEW.pseudo);
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_before_write ON public.profiles;
CREATE TRIGGER profiles_before_write
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_before_write();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players read own profile" ON public.profiles;
CREATE POLICY "Players read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Players update own profile" ON public.profiles;
CREATE POLICY "Players update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Droits par colonne : le joueur ne modifie que son pseudo (pas son rôle).
-- Pas d'INSERT côté client : le profil est créé par start_new_game.
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (pseudo) ON public.profiles TO authenticated;

-- 2. Nom du vaisseau ─────────────────────────────────────────────────────────────
ALTER TABLE public.ships DROP CONSTRAINT IF EXISTS ships_name_length;
ALTER TABLE public.ships
  ADD CONSTRAINT ships_name_length CHECK (char_length(btrim(name)) BETWEEN 2 AND 32);

-- 3. Signaux modèles ─────────────────────────────────────────────────────────────
-- Les signaux de démo (session 'seed-demo') sont rattachés au vaisseau prototype :
-- sans ce détachement, ils seraient supprimés en cascade avec lui (étape 5).
UPDATE public.signals SET ship_id = NULL WHERE session_id = 'seed-demo';

COMMENT ON COLUMN public.signals.session_id IS
  'Session navigateur (prototype, supprimée à l''étape 4). ''seed-demo'' + ship_id nul = signal modèle copié par start_new_game.';

-- 4. Création de partie ──────────────────────────────────────────────────────────
-- Crée en une transaction : profil, vaisseau à Sol, systèmes, population, nœud Sol
-- de la carte, et copie des signaux modèles. Refuse si le joueur a déjà un vaisseau.
-- Les valeurs initiales de ship_systems et populations sont les DEFAULT des tables.
CREATE OR REPLACE FUNCTION public.start_new_game(p_pseudo text, p_ship_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_pseudo text := btrim(coalesce(p_pseudo, ''));
  v_ship_name text := btrim(coalesce(p_ship_name, ''));
  v_ship uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  IF char_length(v_pseudo) NOT BETWEEN 2 AND 24 THEN
    RAISE EXCEPTION 'Le pseudo doit faire entre 2 et 24 caractères' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_ship_name) NOT BETWEEN 2 AND 32 THEN
    RAISE EXCEPTION 'Le nom du vaisseau doit faire entre 2 et 32 caractères' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM ships WHERE user_id = v_user) THEN
    RAISE EXCEPTION 'Une partie existe déjà pour ce compte' USING ERRCODE = '23505';
  END IF;

  -- Profil (mis à jour si un essai précédent l'a créé sans aller au bout)
  INSERT INTO profiles (id, pseudo)
  VALUES (v_user, v_pseudo)
  ON CONFLICT (id) DO UPDATE SET pseudo = EXCLUDED.pseudo;

  -- Vaisseau (UNIQUE(user_id) protège contre deux appels simultanés)
  INSERT INTO ships (user_id, name, current_system_id, travel_state)
  VALUES (v_user, v_ship_name, 'SOL', 'IDLE')
  RETURNING id INTO v_ship;

  INSERT INTO ship_systems (ship_id) VALUES (v_ship);
  INSERT INTO populations (ship_id) VALUES (v_ship);

  INSERT INTO map_nodes (ship_id, system_id, name, visited_at, generation)
  VALUES (v_ship, 'SOL', 'Sol', current_date, 1);

  -- Signaux de démo copiés dans le vaisseau du joueur
  INSERT INTO signals (
    source_type, source_object_id, source_event_id, source_system_id,
    session_id, ship_id, frequency_hz, support, duration_sec, attributes
  )
  SELECT
    source_type, source_object_id, source_event_id, source_system_id,
    'ship:' || v_ship, v_ship, frequency_hz, support, duration_sec, attributes
  FROM signals
  WHERE session_id = 'seed-demo' AND ship_id IS NULL
  ORDER BY support DESC
  LIMIT 10;

  RETURN v_ship;
END;
$$;

COMMENT ON FUNCTION public.start_new_game(text, text) IS
  'Crée la partie du joueur connecté (profil, vaisseau à Sol, systèmes, population, carte, signaux de démo). Renvoie l''id du vaisseau.';

REVOKE ALL ON FUNCTION public.start_new_game(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_new_game(text, text) TO authenticated;
