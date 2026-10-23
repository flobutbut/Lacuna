-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Drake de bord (LACUNA_VERDICT.md §7.1–7.3, §9.3) — migration 00077
--
--   • ship_drake : ce que chaque vaisseau croit, d'après ses verdicts (une ligne par vaisseau).
--   • ship_drake_compute : même calcul que computeShipDrake (src/lib/drake.js) —
--       contribution = s(lecture) × w(confiance) sur le terme de la famille de l'écart ;
--       T_bord = T_référence × 10^(0,05 × Σ), borné ; seul le verdict le plus récent de chaque
--       observation compte.
--   • Recalcul à chaque verdict ajouté ou supprimé (déclencheur sur lab_verdicts, y compris la
--     suppression d'une observation, en cascade).
--   • Le N collectif (drake_equation) n'est pas touché ici : lot 6.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Table ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ship_drake (
  ship_id UUID PRIMARY KEY REFERENCES public.ships(id) ON DELETE CASCADE,
  fl DECIMAL NOT NULL,
  fi DECIMAL NOT NULL,
  fc DECIMAL NOT NULL,
  l_val DECIMAL NOT NULL,
  n DECIMAL NOT NULL,
  verdicts INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ship_drake IS 'Drake de bord : termes variables d''après les verdicts du vaisseau (LACUNA_VERDICT.md §7.3)';
COMMENT ON COLUMN public.ship_drake.verdicts IS 'Nombre de verdicts courants qui contribuent (lecture ≠ indéterminé, avec un écart)';

ALTER TABLE public.ship_drake ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Players read own ship_drake" ON public.ship_drake;
CREATE POLICY "Players read own ship_drake" ON public.ship_drake
  FOR SELECT TO authenticated
  USING (ship_id IN (SELECT id FROM public.ships WHERE user_id = (SELECT auth.uid())));
REVOKE ALL ON public.ship_drake FROM anon, authenticated;
GRANT SELECT ON public.ship_drake TO authenticated;

-- 2. Calcul ───────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ship_drake_compute(p_ship_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sum_fl double precision := 0;
  v_sum_fi double precision := 0;
  v_sum_fc double precision := 0;
  v_sum_l double precision := 0;
  v_count int := 0;
  v_fl double precision;
  v_fi double precision;
  v_fc double precision;
  v_l double precision;
BEGIN
  WITH current AS (
    SELECT DISTINCT ON (observation_id) family, reading, confidence
      FROM lab_verdicts
     WHERE ship_id = p_ship_id
     ORDER BY observation_id, created_at DESC, id DESC
  ), contrib AS (
    SELECT CASE family
             WHEN 'CHIMIQUE' THEN 'fl'
             WHEN 'ORBITALE' THEN 'fi' WHEN 'MORPHOLOGIQUE' THEN 'fi' WHEN 'GRAVITATIONNELLE' THEN 'fi'
             WHEN 'ELECTROMAGNETIQUE' THEN 'fc' WHEN 'THERMIQUE' THEN 'fc' WHEN 'TEMPORELLE' THEN 'fc'
             WHEN 'ABSENCE' THEN 'l_val'
           END AS term,
           (CASE reading
              WHEN 'ARTIFICIEL_POSSIBLE' THEN 1.0 WHEN 'NATUREL_INEXPLIQUE' THEN 0.3
              WHEN 'NATUREL_CONNU' THEN -0.3 ELSE 0.0 END)
           * (CASE confidence
                WHEN 'OBSERVATION' THEN 0.25 WHEN 'HYPOTHÈSE' THEN 0.5
                WHEN 'CONVICTION' THEN 1.0 WHEN 'CERTITUDE' THEN 1.5 END) AS value
      FROM current
     WHERE family IS NOT NULL
  )
  SELECT coalesce(sum(value) FILTER (WHERE term = 'fl'), 0),
         coalesce(sum(value) FILTER (WHERE term = 'fi'), 0),
         coalesce(sum(value) FILTER (WHERE term = 'fc'), 0),
         coalesce(sum(value) FILTER (WHERE term = 'l_val'), 0),
         count(*) FILTER (WHERE term IS NOT NULL AND value <> 0)
    INTO v_sum_fl, v_sum_fi, v_sum_fc, v_sum_l, v_count
    FROM contrib;

  -- Références (LACUNA_GDD.md §7) et bornes : fractions dans [réf ÷ 10 ; min(réf × 10 ; 1)], L dans [100 ; 10⁷]
  v_fl := least(least(0.3 * 10, 1), greatest(0.3 / 10, 0.3 * power(10, 0.05 * v_sum_fl)));
  v_fi := least(least(0.1 * 10, 1), greatest(0.1 / 10, 0.1 * power(10, 0.05 * v_sum_fi)));
  v_fc := least(least(0.2 * 10, 1), greatest(0.2 / 10, 0.2 * power(10, 0.05 * v_sum_fc)));
  v_l := least(1e7, greatest(100, 10000 * power(10, 0.05 * v_sum_l)));

  INSERT INTO ship_drake (ship_id, fl, fi, fc, l_val, n, verdicts, updated_at)
  VALUES (p_ship_id, v_fl, v_fi, v_fc, v_l, 3 * 1 * 0.4 * v_fl * v_fi * v_fc * v_l, v_count, now())
  ON CONFLICT (ship_id) DO UPDATE
    SET fl = EXCLUDED.fl, fi = EXCLUDED.fi, fc = EXCLUDED.fc, l_val = EXCLUDED.l_val,
        n = EXCLUDED.n, verdicts = EXCLUDED.verdicts, updated_at = EXCLUDED.updated_at;
END;
$$;

COMMENT ON FUNCTION public.ship_drake_compute(uuid) IS
  'Recalcule le Drake de bord d''un vaisseau à partir de ses verdicts courants (même calcul que src/lib/drake.js).';

REVOKE ALL ON FUNCTION public.ship_drake_compute(uuid) FROM PUBLIC, anon, authenticated;

-- 3. Recalcul à chaque verdict ajouté ou supprimé ────────────────────────────────
CREATE OR REPLACE FUNCTION public.lab_verdicts_after_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Le vaisseau peut avoir disparu (suppression de compte en cascade)
  IF EXISTS (SELECT 1 FROM ships WHERE id = coalesce(NEW.ship_id, OLD.ship_id)) THEN
    PERFORM ship_drake_compute(coalesce(NEW.ship_id, OLD.ship_id));
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.lab_verdicts_after_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS tr_lab_verdicts_drake ON public.lab_verdicts;
CREATE TRIGGER tr_lab_verdicts_drake
  AFTER INSERT OR DELETE ON public.lab_verdicts
  FOR EACH ROW EXECUTE FUNCTION public.lab_verdicts_after_change();

-- 4. Vaisseaux existants : une ligne chacun (valeurs de référence sans verdict) ─────
SELECT public.ship_drake_compute(id) FROM public.ships;
