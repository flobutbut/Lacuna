-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Correctif du N collectif (migration 00079)
--
--   drake_collective_compute (00078) ajoutait les termes changés par `v_changed || 'fl'` :
--   le littéral est lu comme un tableau (« malformed array literal ») et le recalcul échoue
--   dès qu'un terme varie. array_append lève l'ambiguïté. Le reste de la fonction est inchangé.
-- ═══════════════════════════════════════════════════════════════════════════════

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

  IF abs(v_fl - v_row.fl) > 1e-9 THEN v_changed := array_append(v_changed, 'fl'); END IF;
  IF abs(v_fi - v_row.fi) > 1e-9 THEN v_changed := array_append(v_changed, 'fi'); END IF;
  IF abs(v_fc - v_row.fc) > 1e-9 THEN v_changed := array_append(v_changed, 'fc'); END IF;
  IF abs(v_l - v_row.l_val) > 1e-6 THEN v_changed := array_append(v_changed, 'L'); END IF;

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

REVOKE ALL ON FUNCTION public.drake_collective_compute() FROM PUBLIC, anon, authenticated;
