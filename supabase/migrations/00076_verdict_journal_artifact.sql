-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Verdict : journal et artefact (LACUNA_VERDICT.md §6.2, §6.3) — migration 00076
--
--   • record_verdict reçoit p_log_to_journal : avec le verdict, le serveur écrit une entrée MANUEL
--     au nom du joueur (« Verdict — [observation] »), reliée par lab_verdicts.logbook_entry_id.
--     Le déclencheur logbook_before_insert (00068) fixe date, contexte et génération.
--   • create_artifact : « Créer un artefact » après un verdict. La trace JOUEUR est persistée et
--     permanente, visible des autres vaisseaux (trace_is_visible, 00060) ; elle porte les écarts
--     mesurés (pas le texte des rapports) et une interprétation, avec la confiance du verdict.
--     Un seul artefact par verdict.
--   • traces.player_subtype : ANNOTATION, WARNING, DIRECTION, DISCOVERY (LACUNA_GDD.md §4).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Colonnes ────────────────────────────────────────────────────────────────────
ALTER TABLE public.traces
  ADD COLUMN IF NOT EXISTS player_subtype text,
  ADD COLUMN IF NOT EXISTS verdict_id uuid REFERENCES public.lab_verdicts(id) ON DELETE SET NULL;

ALTER TABLE public.traces
  DROP CONSTRAINT IF EXISTS traces_player_subtype_check,
  ADD CONSTRAINT traces_player_subtype_check CHECK (
    player_subtype IS NULL
    OR (origin = 'JOUEUR' AND player_subtype IN ('ANNOTATION', 'WARNING', 'DIRECTION', 'DISCOVERY')));

COMMENT ON COLUMN public.traces.player_subtype IS 'Sous-type d''une trace JOUEUR (LACUNA_GDD.md §4) ; NULL pour les autres origines';
COMMENT ON COLUMN public.traces.verdict_id IS 'Verdict d''où la trace JOUEUR a été déposée (jamais exposé aux joueurs)';

-- Lecture : le sous-type rejoint les colonnes lisibles (verdict_id et discovered_by restent cachés)
GRANT SELECT (player_subtype) ON public.traces TO authenticated;

ALTER TABLE public.lab_verdicts
  ADD COLUMN IF NOT EXISTS trace_id uuid REFERENCES public.traces(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS lab_verdicts_trace_unique ON public.lab_verdicts (trace_id) WHERE trace_id IS NOT NULL;
COMMENT ON COLUMN public.lab_verdicts.trace_id IS 'Artefact déposé depuis ce verdict (create_artifact) ; NULL sinon';

-- 2. Libellés ─────────────────────────────────────────────────────────────────────
-- Mêmes libellés que src/lib/verdicts.js et DEVIATION_FAMILIES (src/lib/deviations.js)
CREATE OR REPLACE FUNCTION public.verdict_reading_label(p_reading public.verdict_reading)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_reading
    WHEN 'NATUREL_CONNU' THEN 'Naturel connu'
    WHEN 'NATUREL_INEXPLIQUE' THEN 'Naturel inexpliqué'
    WHEN 'ARTIFICIEL_POSSIBLE' THEN 'Origine artificielle possible'
    ELSE 'Indéterminé'
  END;
$$;

CREATE OR REPLACE FUNCTION public.deviation_family_label(p_family text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_family
    WHEN 'ELECTROMAGNETIQUE' THEN 'électromagnétique'
    WHEN 'ORBITALE' THEN 'orbitale'
    WHEN 'CHIMIQUE' THEN 'chimique'
    WHEN 'MORPHOLOGIQUE' THEN 'morphologique'
    WHEN 'THERMIQUE' THEN 'thermique'
    WHEN 'TEMPORELLE' THEN 'temporelle'
    WHEN 'GRAVITATIONNELLE' THEN 'gravitationnelle'
    WHEN 'ABSENCE' THEN 'absence'
    ELSE lower(p_family)
  END;
$$;

-- Texte de l'entrée de journal d'un verdict — même texte que buildVerdictJournalText (src/lib/verdicts.js)
CREATE OR REPLACE FUNCTION public.verdict_journal_text(
  p_reading public.verdict_reading, p_confidence public.confidence_level, p_family text, p_sightings int, p_note text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT verdict_reading_label(p_reading) || ' (' || lower(p_confidence::text) || '). '
      || CASE WHEN p_family IS NULL THEN 'Aucun écart mesuré.'
              ELSE 'Écart principal (' || deviation_family_label(p_family) || '), mesuré par '
                   || p_sightings || ' rapport' || CASE WHEN p_sightings > 1 THEN 's' ELSE '' END || '.'
         END
      || CASE WHEN p_note IS NULL THEN '' ELSE E'\n« ' || p_note || ' »' END;
$$;

-- 3. record_verdict : écriture au journal ─────────────────────────────────────────
DROP FUNCTION IF EXISTS public.record_verdict(uuid, public.verdict_reading, public.confidence_level, text, text);

CREATE OR REPLACE FUNCTION public.record_verdict(
  p_observation_id uuid,
  p_reading public.verdict_reading,
  p_confidence public.confidence_level,
  p_note text DEFAULT NULL,
  p_family text DEFAULT NULL,
  p_log_to_journal boolean DEFAULT false)
RETURNS public.lab_verdicts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
  v_obs observations;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_sightings int := 0;
  v_entry_id uuid;
  v_row lab_verdicts;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT o.* INTO v_obs
    FROM observations o JOIN ships s ON s.id = o.ship_id
   WHERE o.id = p_observation_id AND s.user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Observation inconnue' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_ship FROM ships WHERE id = v_obs.ship_id;
  IF NOT EXISTS (SELECT 1 FROM lab_reports WHERE observation_id = p_observation_id) THEN
    RAISE EXCEPTION 'Aucun rapport d''analyse pour cette observation' USING ERRCODE = '22023';
  END IF;
  IF v_note IS NOT NULL AND char_length(v_note) > 280 THEN
    RAISE EXCEPTION 'Note trop longue (280 caractères au plus)' USING ERRCODE = '22001';
  END IF;
  -- La famille doit être celle d'un écart mesuré (pas une ombre) dans un rapport de l'observation
  IF p_family IS NOT NULL THEN
    SELECT count(DISTINCT r.id) INTO v_sightings
      FROM lab_reports r, jsonb_array_elements(coalesce(r.deviations, '[]'::jsonb)) AS d
     WHERE r.observation_id = p_observation_id
       AND d->>'family' = p_family
       AND d->>'requiresNiveau' IS NULL;
    IF v_sightings = 0 THEN
      RAISE EXCEPTION 'Famille d''écart non relevée' USING ERRCODE = '22023';
    END IF;
  END IF;

  IF p_log_to_journal THEN
    INSERT INTO logbook_entries (ship_id, type, generation, date, title, text, linked_systems)
    VALUES (v_ship.id, 'MANUEL', coalesce(v_ship.generation, 1), '',
            left('Verdict — ' || v_obs.name, 120),
            verdict_journal_text(p_reading, p_confidence, p_family, v_sightings, v_note),
            CASE WHEN v_obs.system_id IS NULL THEN '{}' ELSE ARRAY[v_obs.system_id] END)
    RETURNING id INTO v_entry_id;
  END IF;

  INSERT INTO lab_verdicts (observation_id, ship_id, reading, confidence, note, family, generation, ship_date, logbook_entry_id)
  VALUES (p_observation_id, v_ship.id, p_reading, p_confidence, v_note, p_family,
          coalesce(v_ship.generation, 1), ship_galactic_date(v_ship), v_entry_id)
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.record_verdict(uuid, public.verdict_reading, public.confidence_level, text, text, boolean) IS
  'Enregistre un verdict du joueur sur une de ses observations analysées, et au besoin son entrée MANUEL au journal ; génération et date fixées par le serveur.';

REVOKE ALL ON FUNCTION public.record_verdict(uuid, public.verdict_reading, public.confidence_level, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_verdict(uuid, public.verdict_reading, public.confidence_level, text, text, boolean) TO authenticated;

-- 4. create_artifact ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_artifact(
  p_verdict_id uuid,
  p_designation text,
  p_subtype text,
  p_interpretation text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_verdict lab_verdicts;
  v_obs observations;
  v_ship ships;
  v_base text := btrim(coalesce(p_designation, ''));
  v_designation text;
  v_n int := 1;
  v_interp text := nullif(btrim(coalesce(p_interpretation, '')), '');
  v_description text;
  v_ship_date text;
  v_discovered date;
  v_trace_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT v.* INTO v_verdict
    FROM lab_verdicts v JOIN ships s ON s.id = v.ship_id
   WHERE v.id = p_verdict_id AND s.user_id = auth.uid()
   FOR UPDATE OF v;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Verdict inconnu' USING ERRCODE = 'P0002';
  END IF;
  IF v_verdict.trace_id IS NOT NULL THEN
    RAISE EXCEPTION 'Un artefact a déjà été déposé pour ce verdict' USING ERRCODE = '23505';
  END IF;
  IF EXISTS (SELECT 1 FROM lab_verdicts WHERE observation_id = v_verdict.observation_id AND created_at > v_verdict.created_at) THEN
    RAISE EXCEPTION 'Ce verdict a été révisé' USING ERRCODE = '22023';
  END IF;
  IF p_subtype IS NULL OR p_subtype NOT IN ('ANNOTATION', 'WARNING', 'DIRECTION', 'DISCOVERY') THEN
    RAISE EXCEPTION 'Sous-type inconnu' USING ERRCODE = '22023';
  END IF;
  IF char_length(v_base) NOT BETWEEN 2 AND 40 THEN
    RAISE EXCEPTION 'Désignation de 2 à 40 caractères' USING ERRCODE = '22023';
  END IF;
  IF v_interp IS NOT NULL AND char_length(v_interp) > 2000 THEN
    RAISE EXCEPTION 'Interprétation trop longue (2 000 caractères au plus)' USING ERRCODE = '22001';
  END IF;

  SELECT * INTO v_obs FROM observations WHERE id = v_verdict.observation_id;
  SELECT * INTO v_ship FROM ships WHERE id = v_verdict.ship_id;

  -- Désignation unique dans tout le réseau : suffixe -2, -3… si elle est prise
  v_designation := v_base;
  WHILE EXISTS (SELECT 1 FROM traces WHERE designation = v_designation) LOOP
    v_n := v_n + 1;
    v_designation := v_base || '-' || v_n;
  END LOOP;

  -- Données : les écarts mesurés (un par identifiant), pas le texte brut des rapports
  SELECT string_agg(line, E'\n' ORDER BY line) INTO v_description
    FROM (SELECT DISTINCT ON (d->>'id')
                 initcap(deviation_family_label(d->>'family')) || ' — ' || (d->>'label')
                 || ' : attendu ' || coalesce(d->>'expected', '—') || ', mesuré ' || coalesce(d->>'measured', '—') || '.' AS line
            FROM lab_reports r, jsonb_array_elements(coalesce(r.deviations, '[]'::jsonb)) AS d
           WHERE r.observation_id = v_obs.id AND d->>'requiresNiveau' IS NULL) AS lines;
  v_description := coalesce(v_description, 'Aucun écart mesuré au-delà du bruit.');

  v_ship_date := ship_galactic_date(v_ship);
  BEGIN
    v_discovered := v_ship_date::date;
  EXCEPTION WHEN OTHERS THEN
    v_discovered := NULL;
  END;

  INSERT INTO traces (designation, type, origin, system_id, difficulty, description, discovered, discovered_by, player_subtype, verdict_id)
  VALUES (v_designation, 'PLAYER_TRACE', 'JOUEUR',
          (SELECT id FROM stellar_systems WHERE id = v_obs.system_id),
          '1', v_description, v_discovered, v_ship.id, p_subtype, v_verdict.id)
  RETURNING id INTO v_trace_id;

  INSERT INTO ship_traces (ship_id, trace_id) VALUES (v_ship.id, v_trace_id);

  INSERT INTO interpretations (trace_id, ship_id, generation, galactic_date, text, confidence)
  VALUES (v_trace_id, v_ship.id, v_verdict.generation, v_ship_date,
          coalesce(v_interp, v_verdict.note, verdict_reading_label(v_verdict.reading) || '.'),
          v_verdict.confidence);

  UPDATE lab_verdicts SET trace_id = v_trace_id WHERE id = v_verdict.id;

  RETURN json_build_object('trace_id', v_trace_id, 'designation', v_designation);
END;
$$;

COMMENT ON FUNCTION public.create_artifact(uuid, text, text, text) IS
  'Dépose une trace JOUEUR permanente depuis le verdict courant d''une observation (écarts mesurés + interprétation) ; un seul artefact par verdict.';

REVOKE ALL ON FUNCTION public.create_artifact(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_artifact(uuid, text, text, text) TO authenticated;

REVOKE ALL ON FUNCTION public.verdict_reading_label(public.verdict_reading) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.deviation_family_label(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verdict_journal_text(public.verdict_reading, public.confidence_level, text, int, text) FROM PUBLIC, anon;
