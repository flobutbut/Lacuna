-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — N collectif (LACUNA_VERDICT.md §7.4) — migration 00078
--
--   • ship_drake gagne le nombre de verdicts par terme (fl_count…) : c'est le poids d'un vaisseau.
--   • drake_collective_compute : chaque terme variable de drake_equation est la moyenne géométrique
--     des termes de bord des vaisseaux qui ont au moins un verdict sur ce terme, pondérée par ce
--     nombre (plafonné à 20) ; sans vaisseau, valeur de référence. Même calcul que
--     computeCollectiveDrake (src/lib/drake.js).
--   • Une variation met à jour n, last_delta, last_updated et écrit une ligne dans drake_history
--     (termes changés, « Recalcul collectif ») ; le header affiche déjà N= et le delta.
--   • Recalcul une fois par jour réel (pg_cron, 04:00 UTC), pas à chaque verdict : « sans
--     explication immédiate » (LACUNA_GDD.md §7).
--   • drake_equation et drake_history : lecture seule pour les rôles de l'API (les droits
--     d'écriture accordés au niveau des tables sont retirés ; la RLS les bloquait déjà).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Poids par terme dans ship_drake ─────────────────────────────────────────────
ALTER TABLE public.ship_drake
  ADD COLUMN IF NOT EXISTS fl_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fi_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fc_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS l_count int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.ship_drake.fl_count IS 'Verdicts courants qui contribuent à fl (poids du vaisseau dans le N collectif)';

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
  v_n_fl int := 0;
  v_n_fi int := 0;
  v_n_fc int := 0;
  v_n_l int := 0;
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
         count(*) FILTER (WHERE term = 'fl' AND value <> 0),
         count(*) FILTER (WHERE term = 'fi' AND value <> 0),
         count(*) FILTER (WHERE term = 'fc' AND value <> 0),
         count(*) FILTER (WHERE term = 'l_val' AND value <> 0)
    INTO v_sum_fl, v_sum_fi, v_sum_fc, v_sum_l, v_n_fl, v_n_fi, v_n_fc, v_n_l
    FROM contrib;

  -- Références (LACUNA_GDD.md §7) et bornes : fractions dans [réf ÷ 10 ; min(réf × 10 ; 1)], L dans [100 ; 10⁷]
  v_fl := least(least(0.3 * 10, 1), greatest(0.3 / 10, 0.3 * power(10, 0.05 * v_sum_fl)));
  v_fi := least(least(0.1 * 10, 1), greatest(0.1 / 10, 0.1 * power(10, 0.05 * v_sum_fi)));
  v_fc := least(least(0.2 * 10, 1), greatest(0.2 / 10, 0.2 * power(10, 0.05 * v_sum_fc)));
  v_l := least(1e7, greatest(100, 10000 * power(10, 0.05 * v_sum_l)));

  INSERT INTO ship_drake (ship_id, fl, fi, fc, l_val, n, verdicts, fl_count, fi_count, fc_count, l_count, updated_at)
  VALUES (p_ship_id, v_fl, v_fi, v_fc, v_l, 3 * 1 * 0.4 * v_fl * v_fi * v_fc * v_l,
          v_n_fl + v_n_fi + v_n_fc + v_n_l, v_n_fl, v_n_fi, v_n_fc, v_n_l, now())
  ON CONFLICT (ship_id) DO UPDATE
    SET fl = EXCLUDED.fl, fi = EXCLUDED.fi, fc = EXCLUDED.fc, l_val = EXCLUDED.l_val,
        n = EXCLUDED.n, verdicts = EXCLUDED.verdicts,
        fl_count = EXCLUDED.fl_count, fi_count = EXCLUDED.fi_count,
        fc_count = EXCLUDED.fc_count, l_count = EXCLUDED.l_count,
        updated_at = EXCLUDED.updated_at;
END;
$$;

REVOKE ALL ON FUNCTION public.ship_drake_compute(uuid) FROM PUBLIC, anon, authenticated;

SELECT public.ship_drake_compute(id) FROM public.ships;

-- 2. drake_equation : date du dernier recalcul, droits ────────────────────────────
ALTER TABLE public.drake_equation ADD COLUMN IF NOT EXISTS last_computed_at timestamptz;
COMMENT ON COLUMN public.drake_equation.last_computed_at IS 'Dernier recalcul collectif (drake_collective_compute), qu''il ait fait varier N ou non';
COMMENT ON COLUMN public.drake_equation.last_updated IS 'Dernière variation de N';

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.drake_equation FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.drake_history FROM anon, authenticated;

-- 3. Calcul collectif ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.drake_collective_compute()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row drake_equation;
  v_fl double precision;
  v_fi double precision;
  v_fc double precision;
  v_l double precision;
  v_n double precision;
  v_changed text[] := '{}';
BEGIN
  SELECT * INTO v_row FROM drake_equation ORDER BY created_at LIMIT 1 FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'drake_equation vide' USING ERRCODE = 'P0002';
  END IF;

  -- Moyenne géométrique pondérée (poids plafonné à 20) ; référence sans vaisseau contributeur
  SELECT coalesce(exp(sum(least(fl_count, 20) * ln(fl)) FILTER (WHERE fl_count > 0)
                      / nullif(sum(least(fl_count, 20)) FILTER (WHERE fl_count > 0), 0)), 0.3),
         coalesce(exp(sum(least(fi_count, 20) * ln(fi)) FILTER (WHERE fi_count > 0)
                      / nullif(sum(least(fi_count, 20)) FILTER (WHERE fi_count > 0), 0)), 0.1),
         coalesce(exp(sum(least(fc_count, 20) * ln(fc)) FILTER (WHERE fc_count > 0)
                      / nullif(sum(least(fc_count, 20)) FILTER (WHERE fc_count > 0), 0)), 0.2),
         coalesce(exp(sum(least(l_count, 20) * ln(l_val)) FILTER (WHERE l_count > 0)
                      / nullif(sum(least(l_count, 20)) FILTER (WHERE l_count > 0), 0)), 10000)
    INTO v_fl, v_fi, v_fc, v_l
    FROM ship_drake;

  v_n := v_row.r_star * v_row.fp * v_row.ne * v_fl * v_fi * v_fc * v_l;

  IF abs(v_fl - v_row.fl) > 1e-9 THEN v_changed := v_changed || 'fl'; END IF;
  IF abs(v_fi - v_row.fi) > 1e-9 THEN v_changed := v_changed || 'fi'; END IF;
  IF abs(v_fc - v_row.fc) > 1e-9 THEN v_changed := v_changed || 'fc'; END IF;
  IF abs(v_l - v_row.l_val) > 1e-6 THEN v_changed := v_changed || 'L'; END IF;

  IF cardinality(v_changed) > 0 THEN
    UPDATE drake_equation
       SET fl = v_fl, fi = v_fi, fc = v_fc, l_val = v_l, n = v_n,
           last_delta = v_n - v_row.n, last_updated = now(), last_computed_at = now()
     WHERE id = v_row.id;
    INSERT INTO drake_history (date, n, changed_term, reason)
    VALUES (current_date, v_n, array_to_string(v_changed, ', '), 'Recalcul collectif');
  ELSE
    UPDATE drake_equation SET last_computed_at = now() WHERE id = v_row.id;
  END IF;

  RETURN json_build_object('n', v_n, 'delta', v_n - v_row.n, 'changed', v_changed);
END;
$$;

COMMENT ON FUNCTION public.drake_collective_compute() IS
  'Recalcule le N collectif (drake_equation) à partir des Drake de bord ; une ligne drake_history par variation. Même calcul que computeCollectiveDrake (src/lib/drake.js).';

REVOKE ALL ON FUNCTION public.drake_collective_compute() FROM PUBLIC, anon, authenticated;

-- 4. Une fois par jour réel ───────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'drake-collective-daily';
SELECT cron.schedule('drake-collective-daily', '0 4 * * *', $$SELECT public.drake_collective_compute()$$);
