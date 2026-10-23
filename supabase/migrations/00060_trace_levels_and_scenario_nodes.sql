-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Gradient d'approfondissement des traces, nœuds du Fil des 75, structure de Yael
-- (LACUNA_TRACES.md §4, LACUNA_SCENARIOS.md §5.3, LACUNA_TRACES_IMMUABLES.md §4)
--
--   • trace_levels : lectures d'une trace par niveau d'observation (PASSIF, SYSTEME, ORBITE,
--     CONTACT). Illisible côté client : on ne la lit que par get_trace_levels.
--   • ship_trace_levels / ship_traces : ce qu'un vaisseau a débloqué. Écrits par le serveur seul.
--   • unlock_trace_levels() : débloque, pour le vaisseau du joueur, les lectures auxquelles ses
--     observations du système courant donnent accès. Déterministe, sans paramètre.
--   • Une trace de scénario ou précurseur n'est lisible qu'une fois découverte (ship_traces) ;
--     les traces immuables sans scénario restent lisibles par tous, comme avant.
--   • Les quatre nœuds du Fil des 75, avec les textes de LACUNA_SCENARIOS.md §5.3 repris tels quels
--     (« Ce que le joueur trouve » et faits de « Ce que les données disent »). Jamais « ne disent pas »,
--     « lien avec la grammaire » ni « pointe vers ».
--   • Yael : aucune entrée (aucun texte n'est écrit) ; la structure est prête (origine PRÉCURSEUR,
--     precursor_generation, linked_trace_id). Une entrée est découverte à l'arrivée dans son système.
--
-- RÈGLE DE DÉBLOCAGE PROVISOIRE (aucune mécanique de descente, de sonde ni de fouille n'existe) :
-- une lecture est débloquée si une observation du vaisseau, dans le système où il se trouve, a le bon
-- type, le bon corps (anchor_body) et un niveau d'observation au moins égal. Sans coût ni instrument.
-- Le niveau d'une observation étant écrit par le client, cette règle ne protège pas d'un joueur qui
-- falsifie ses observations : elle devra être resserrée quand le coût d'un niveau sera défini.
--
-- Contrôle de la règle « 2 fragments au plus en zone d'onboarding » (LACUNA_SCENARIOS.md §4.6) :
--   SELECT count(*) FROM traces t JOIN stellar_systems s ON s.id = t.system_id
--   WHERE t.origin = 'PRÉCURSEUR' AND s.distance < 25;     -- doit rester ≤ 2
--
-- Non appliquée en production sans accord. Après 00054, 00055 et 00059.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Lectures par niveau ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trace_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id uuid NOT NULL REFERENCES public.traces(id) ON DELETE CASCADE,
  level public.observation_niveau NOT NULL,
  difficulty public.trace_difficulty NOT NULL,
  type public.trace_type NOT NULL,
  anchor_type public.observation_type NOT NULL,
  anchor_body text,
  description text NOT NULL,
  data text[] NOT NULL DEFAULT '{}',
  UNIQUE (trace_id, level)
);

COMMENT ON TABLE public.trace_levels IS 'Lectures d''une trace par niveau d''observation. Illisible côté client (get_trace_levels).';
COMMENT ON COLUMN public.trace_levels.anchor_type IS 'Type d''observation qui débloque la lecture (SIGNAL, PLANETE…).';
COMMENT ON COLUMN public.trace_levels.anchor_body IS 'Désignation du corps observé (ex. b, Cc) ; nul = tout corps du type.';

CREATE TABLE IF NOT EXISTS public.ship_trace_levels (
  ship_id uuid NOT NULL REFERENCES public.ships(id) ON DELETE CASCADE,
  trace_id uuid NOT NULL REFERENCES public.traces(id) ON DELETE CASCADE,
  level public.observation_niveau NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ship_id, trace_id, level)
);

ALTER TABLE public.trace_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ship_trace_levels ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.trace_levels FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.ship_trace_levels FROM PUBLIC, anon, authenticated;

-- 2. Découverte : écrite par le serveur seul ─────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own ship_traces" ON public.ship_traces;
DROP POLICY IF EXISTS "Players read own ship_traces" ON public.ship_traces;
CREATE POLICY "Players read own ship_traces" ON public.ship_traces
  FOR SELECT TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));
REVOKE ALL ON public.ship_traces FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ship_traces TO authenticated;

-- 3. Visibilité des traces ───────────────────────────────────────────────────────
-- Fonction SECURITY DEFINER : la politique lit scenario_arc, colonne que le joueur ne peut pas lire.
CREATE OR REPLACE FUNCTION public.trace_is_visible(p_trace_id uuid, p_scenario_arc text, p_origin public.trace_origin)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (p_scenario_arc IS NULL AND p_origin <> 'PRÉCURSEUR')
      OR EXISTS (
        SELECT 1 FROM ship_traces st JOIN ships s ON s.id = st.ship_id
        WHERE st.trace_id = p_trace_id AND s.user_id = auth.uid()
      );
$$;

REVOKE ALL ON FUNCTION public.trace_is_visible(uuid, text, public.trace_origin) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.trace_is_visible(uuid, text, public.trace_origin) TO authenticated;

DROP POLICY IF EXISTS "Public read traces" ON public.traces;
DROP POLICY IF EXISTS "Players read discoverable traces" ON public.traces;
CREATE POLICY "Players read discoverable traces" ON public.traces
  FOR SELECT TO authenticated
  USING (public.trace_is_visible(id, scenario_arc, origin));

-- 4. Déblocage ───────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unlock_trace_levels()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
  v_levels int;
  v_traces int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ship FROM ships WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun vaisseau pour ce compte' USING ERRCODE = 'P0002';
  END IF;
  IF v_ship.travel_state = 'IN_TRANSIT' OR v_ship.current_system_id IS NULL THEN
    RETURN json_build_object('levels', 0, 'traces', 0);
  END IF;

  -- Lectures accessibles par les observations du système courant
  WITH matched AS (
    SELECT DISTINCT l.trace_id, l.level
    FROM trace_levels l
    JOIN traces t ON t.id = l.trace_id
    JOIN observations o
      ON o.ship_id = v_ship.id
     AND o.system_id = t.system_id
     AND o.type = l.anchor_type
     AND o.niveau >= l.level
     AND (l.anchor_body IS NULL OR o.attributes->>'body_designation' = l.anchor_body)
    WHERE t.system_id = v_ship.current_system_id
  ), ins AS (
    INSERT INTO ship_trace_levels (ship_id, trace_id, level)
    SELECT v_ship.id, trace_id, level FROM matched
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_levels FROM ins;

  -- Une trace se découvre avec sa première lecture ; une entrée précurseur, en arrivant dans son système
  WITH ins AS (
    INSERT INTO ship_traces (ship_id, trace_id)
    SELECT v_ship.id, trace_id FROM ship_trace_levels WHERE ship_id = v_ship.id
    UNION
    SELECT v_ship.id, t.id FROM traces t
    WHERE t.origin = 'PRÉCURSEUR' AND t.system_id = v_ship.current_system_id
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_traces FROM ins;

  RETURN json_build_object('levels', v_levels, 'traces', v_traces);
END;
$$;

COMMENT ON FUNCTION public.unlock_trace_levels() IS
  'Débloque pour le vaisseau du joueur les lectures de traces accessibles depuis ses observations du système courant. Renvoie {levels, traces}.';

-- 5. Lectures débloquées d'une trace ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_trace_levels(p_trace_id uuid)
RETURNS TABLE (level public.observation_niveau, difficulty public.trace_difficulty, type public.trace_type, description text, data text[])
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.level, l.difficulty, l.type, l.description, l.data
  FROM trace_levels l
  JOIN ship_trace_levels u ON u.trace_id = l.trace_id AND u.level = l.level
  JOIN ships s ON s.id = u.ship_id
  WHERE l.trace_id = p_trace_id AND s.user_id = auth.uid()
  ORDER BY l.level;
$$;

REVOKE ALL ON FUNCTION public.unlock_trace_levels() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_trace_levels(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlock_trace_levels() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trace_levels(uuid) TO authenticated;

-- 6. Le Fil des 75 — LACUNA_SCENARIOS.md §5.3 ────────────────────────────────────
-- traces.description : première lecture de la trace (la seule visible dès sa découverte).
-- Type de la trace = type principal ; chaque lecture porte son propre type.
INSERT INTO public.traces (designation, type, origin, system_id, difficulty, real_reference, description, scenario_arc)
VALUES
  ('PROXIMA-SCN02-001', 'SIGNAL_RADIO', 'IMMUABLE', 'PROXIMA', '1', false,
   $t$Signal radio à 1420 MHz émis depuis le terminateur de Proxima b — la ligne de frontière perpétuelle entre la face illuminée et la face sombre de cette planète verrouillée tidalement. Émission par fenêtres de 40 minutes, périodicité interne 73 secondes. Polarisation circulaire gauche. Non corrélé aux émissions stellaires.$t$,
   'scn-02-fil-des-75'),
  ('ROSS128-SCN02-001', 'SIGNAL_RADIO', 'IMMUABLE', 'ROSS128', '1', false,
   $t$Signal à 1420 MHz — zone tempérée de Ross 128 b — synchronisé à l'aube locale. Fenêtre d'émission : 40 minutes par cycle jour-nuit de 61 heures. Durée de fenêtre identique à celle des émissions du terminateur de Proxima b.$t$,
   'scn-02-fil-des-75'),
  ('GLIESE667-SCN02-001', 'PHYSICAL_ARTIFACT', 'IMMUABLE', 'GLIESE667', '2', false,
   $t$Perturbation gravitationnelle sur l'orbite de 667Cc — anomalie détectable depuis l'orbite.$t$,
   'scn-02-fil-des-75'),
  ('GLIESE667-SCN02-002', 'PHYSICAL_ARTIFACT', 'IMMUABLE', 'GLIESE667', '3', false,
   $t$Concentration anormale de métaux réfractaires détectée au sol — craton équatorial, zone tectoniquement stable. Module déployé. Fouille à 60 cm de profondeur sous basalte daté > 3,5 Ga : plaque du même matériau que 667Cc-O1. 128 lignes de gravures. Espacement 4,7 mm. Une interruption à la ligne 75. Ratio 1/75 — identique à l'objet orbital.$t$,
   'scn-02-fil-des-75')
ON CONFLICT (designation) DO NOTHING;

INSERT INTO public.trace_levels (trace_id, level, difficulty, type, anchor_type, anchor_body, description, data)
VALUES
  -- PROXIMA-SCN02-001 : signal (difficulté 1), puis surface (difficulté 2)
  ((SELECT id FROM public.traces WHERE designation = 'PROXIMA-SCN02-001'), 'PASSIF', '1', 'SIGNAL_RADIO', 'SIGNAL', NULL,
   $t$Signal radio à 1420 MHz émis depuis le terminateur de Proxima b — la ligne de frontière perpétuelle entre la face illuminée et la face sombre de cette planète verrouillée tidalement. Émission par fenêtres de 40 minutes, périodicité interne 73 secondes. Polarisation circulaire gauche. Non corrélé aux émissions stellaires.$t$,
   ARRAY[$t$Signal à fréquence raie hydrogène : corrélation avec activité stellaire < 3%$t$]),
  ((SELECT id FROM public.traces WHERE designation = 'PROXIMA-SCN02-001'), 'ORBITE', '2', 'ORBITAL_ANOMALY', 'PLANETE', 'b',
   $t$Scan approfondi du terminateur : surface polie sur ~3 m², érosion insuffisante pour l'âge du site. Sous la surface — cavité souterraine, écho radar anormal, géométrie non naturelle.$t$,
   ARRAY[$t$Surface polie : taux d'érosion incompatible avec l'âge estimé du sol environnant$t$,
         $t$Cavité : dimensions non mesurables depuis la surface$t$]),
  -- ROSS128-SCN02-001 : signal (difficulté 1), puis vie (difficulté 2)
  ((SELECT id FROM public.traces WHERE designation = 'ROSS128-SCN02-001'), 'PASSIF', '1', 'SIGNAL_RADIO', 'SIGNAL', NULL,
   $t$Signal à 1420 MHz — zone tempérée de Ross 128 b — synchronisé à l'aube locale. Fenêtre d'émission : 40 minutes par cycle jour-nuit de 61 heures. Durée de fenêtre identique à celle des émissions du terminateur de Proxima b.$t$,
   ARRAY[$t$Signal : temporellement corrélé à l'aube locale — probabilité de coïncidence < 1%$t$]),
  ((SELECT id FROM public.traces WHERE designation = 'ROSS128-SCN02-001'), 'CONTACT', '2', 'BIOLOGICAL', 'PLANETE', 'b',
   $t$Module récupérable déployé sur tapis organique en zone tempérée : réponse lumineuse à l'exposition. Acides aminés identifiés — dont deux sans équivalent terrestre connu. Analyse laboratoire : vie multicellulaire confirmée, ancienneté estimée 40 000 ans sur site.$t$,
   ARRAY[$t$Vie multicellulaire : 91% de confiance — premier exemple extra-solaire confirmé$t$]),
  -- GLIESE667-SCN02-001 : détection orbitale (2), objet (2), gravures (3)
  ((SELECT id FROM public.traces WHERE designation = 'GLIESE667-SCN02-001'), 'SYSTEME', '2', 'ORBITAL_ANOMALY', 'PLANETE', 'Cc',
   $t$Perturbation gravitationnelle sur l'orbite de 667Cc — anomalie détectable depuis l'orbite.$t$,
   '{}'),
  ((SELECT id FROM public.traces WHERE designation = 'GLIESE667-SCN02-001'), 'ORBITE', '2', 'PHYSICAL_ARTIFACT', 'PLANETE', 'Cc',
   $t$Six semaines d'analyse : objet 1 400 m × 200 m en orbite intentionnelle autour de 667Cc. Aucune rotation. Température 2,7 K — fond cosmologique, pas de dissipation thermique interne. Composition : métaux réfractaires × 10, carbone amorphe. Aucune dérive orbitale mesurée sur 293 orbites consécutives.$t$,
   ARRAY[$t$Orbite : stabilité sur 293 mesures = intentionnelle à 99,7% de confiance$t$,
         $t$Composition : concentration × 10 = artificielle à 97% de confiance$t$]),
  ((SELECT id FROM public.traces WHERE designation = 'GLIESE667-SCN02-001'), 'CONTACT', '3', 'PHYSICAL_ARTIFACT', 'PLANETE', 'Cc',
   $t$Sonde déployée : surface couverte de gravures. 10 800 lignes. Espacement 4,7 mm ± 0,01. Régularité non atteignable par des processus géologiques connus. Datation : 4,2 à 4,8 milliards d'années. Contenu des gravures : ratio d'interruption 1/75 — une interruption complète toutes les 75 lignes. Signification indéterminée.$t$,
   ARRAY[$t$Gravures : espacement régulier = non naturel à 99,9% de confiance$t$,
         $t$Datation : 4,2–4,8 Ga = antérieur à toute vie complexe sur Terre$t$]),
  -- GLIESE667-SCN02-002 : plaque au sol (difficulté 3, module de descente et fouille)
  ((SELECT id FROM public.traces WHERE designation = 'GLIESE667-SCN02-002'), 'CONTACT', '3', 'PHYSICAL_ARTIFACT', 'PLANETE', 'Cc',
   $t$Concentration anormale de métaux réfractaires détectée au sol — craton équatorial, zone tectoniquement stable. Module déployé. Fouille à 60 cm de profondeur sous basalte daté > 3,5 Ga : plaque du même matériau que 667Cc-O1. 128 lignes de gravures. Espacement 4,7 mm. Une interruption à la ligne 75. Ratio 1/75 — identique à l'objet orbital.$t$,
   ARRAY[$t$Même constructeur que 667Cc-O1 : confiance 94%$t$,
         $t$Présence confirmée sur la planète ET en orbite autour d'elle$t$])
ON CONFLICT (trace_id, level) DO NOTHING;
