-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Verdicts du Laboratoire (LACUNA_VERDICT.md §5, §9.2, §9.4) — migration 00075
--
--   • lab_verdicts : la lecture que le joueur fait d'une observation analysée (naturel connu,
--     naturel inexpliqué, origine artificielle possible, indéterminé), avec une confiance et une note.
--   • Un verdict n'est jamais modifié : une révision en ajoute un nouveau. Le plus récent est le
--     verdict courant, les précédents forment l'historique, daté par génération.
--   • Écriture par la RPC record_verdict seulement : génération et date du vaisseau sont fixées par
--     le serveur, la famille doit être celle d'un écart mesuré dans les rapports de l'observation.
--   • Lot 2 : ni entrée au journal (lot 3), ni Drake (lot 5).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Table ────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.verdict_reading AS ENUM
    ('NATUREL_CONNU', 'NATUREL_INEXPLIQUE', 'ARTIFICIEL_POSSIBLE', 'INDETERMINE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.lab_verdicts (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  observation_id UUID NOT NULL REFERENCES public.observations(id) ON DELETE CASCADE,
  ship_id UUID NOT NULL REFERENCES public.ships(id) ON DELETE CASCADE,
  reading public.verdict_reading NOT NULL,
  confidence public.confidence_level NOT NULL,
  note TEXT CHECK (note IS NULL OR char_length(note) BETWEEN 1 AND 280),
  family TEXT,
  generation INT NOT NULL,
  ship_date TEXT NOT NULL,
  logbook_entry_id UUID REFERENCES public.logbook_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lab_verdicts_observation ON public.lab_verdicts (observation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_verdicts_ship ON public.lab_verdicts (ship_id);

COMMENT ON TABLE public.lab_verdicts IS 'Verdicts du joueur sur ses observations (LACUNA_VERDICT.md §5) ; le plus récent par observation est le verdict courant';
COMMENT ON COLUMN public.lab_verdicts.family IS 'Famille de l''écart principal (DEVIATION_FAMILIES, src/lib/deviations.js) ; NULL si aucun écart mesuré';
COMMENT ON COLUMN public.lab_verdicts.ship_date IS 'Date du calendrier du vaisseau au moment du verdict (ship_galactic_date)';
COMMENT ON COLUMN public.lab_verdicts.logbook_entry_id IS 'Entrée MANUEL écrite avec le verdict (lot 3) ; NULL sinon';

-- 2. Droits : lecture de ses verdicts, écriture par la RPC ───────────────────────
ALTER TABLE public.lab_verdicts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players read own verdicts" ON public.lab_verdicts;
CREATE POLICY "Players read own verdicts" ON public.lab_verdicts
  FOR SELECT TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));
REVOKE ALL ON public.lab_verdicts FROM anon, authenticated;
GRANT SELECT ON public.lab_verdicts TO authenticated;

-- 3. RPC record_verdict ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_verdict(
  p_observation_id uuid,
  p_reading public.verdict_reading,
  p_confidence public.confidence_level,
  p_note text DEFAULT NULL,
  p_family text DEFAULT NULL)
RETURNS public.lab_verdicts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_row lab_verdicts;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT s.* INTO v_ship
    FROM ships s JOIN observations o ON o.ship_id = s.id
   WHERE o.id = p_observation_id AND s.user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Observation inconnue' USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lab_reports WHERE observation_id = p_observation_id) THEN
    RAISE EXCEPTION 'Aucun rapport d''analyse pour cette observation' USING ERRCODE = '22023';
  END IF;
  IF v_note IS NOT NULL AND char_length(v_note) > 280 THEN
    RAISE EXCEPTION 'Note trop longue (280 caractères au plus)' USING ERRCODE = '22001';
  END IF;
  -- La famille doit être celle d'un écart mesuré (pas une ombre) dans un rapport de l'observation
  IF p_family IS NOT NULL AND NOT EXISTS (
    SELECT 1
      FROM lab_reports r, jsonb_array_elements(coalesce(r.deviations, '[]'::jsonb)) AS d
     WHERE r.observation_id = p_observation_id
       AND d->>'family' = p_family
       AND d->>'requiresNiveau' IS NULL) THEN
    RAISE EXCEPTION 'Famille d''écart non relevée' USING ERRCODE = '22023';
  END IF;

  INSERT INTO lab_verdicts (observation_id, ship_id, reading, confidence, note, family, generation, ship_date)
  VALUES (p_observation_id, v_ship.id, p_reading, p_confidence, v_note, p_family,
          coalesce(v_ship.generation, 1), ship_galactic_date(v_ship))
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.record_verdict(uuid, public.verdict_reading, public.confidence_level, text, text) IS
  'Enregistre un verdict du joueur sur une de ses observations analysées ; génération et date fixées par le serveur.';

REVOKE ALL ON FUNCTION public.record_verdict(uuid, public.verdict_reading, public.confidence_level, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_verdict(uuid, public.verdict_reading, public.confidence_level, text, text) TO authenticated;
