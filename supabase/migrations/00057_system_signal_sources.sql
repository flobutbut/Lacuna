-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Émetteurs de système : signaux propres à un système, captés à l'arrivée
-- (LACUNA_SCENARIOS.md §5.3 — PROXIMA-SCN02-001 et ROSS128-SCN02-001)
--
--   • signals.source_type accepte 'EMITTER' : émetteur situé dans le système du vaisseau
--     (source_system_id renseigné).
--   • system_signal_sources : définition des émetteurs. Illisible côté client (RLS sans
--     politique) : elle porte l'appartenance aux scénarios et les valeurs provisoires.
--   • capture_system_signals() : copie, pour le vaisseau du joueur, les émetteurs de son
--     système courant. Déterministe, idempotente, sans paramètre (la position est lue ici).
--   • game_settings.scenario_signal_epoch : époque commune des cycles d'émission.
--     Les fenêtres sont en temps réel : phase = (maintenant − époque − décalage) mod cycle.
--
-- VALEURS PROVISOIRES (non documentées dans LACUNA_SCENARIOS.md ; colonne `provisional`) :
--   • époque, décalage « aube locale » (0) et cycle de Proxima b (61 h, repris de Ross 128 b :
--     la doc ne donne aucun rythme pour une planète verrouillée) ;
--   • flux relatif 0,13 (impulsion ~20 dB au-dessus du bruit de la bande L, cf. radarSpectrum.js) ;
--   • durée de capture 300 s (~4 périodes de 73 s) ;
--   • forme de la salve de 73 s : impulsion de pulsar (côté Radar).
-- Non appliquée en production sans accord.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Type de source EMITTER ──────────────────────────────────────────────────────
ALTER TABLE public.signals DROP CONSTRAINT IF EXISTS signals_source_type_check;
ALTER TABLE public.signals ADD CONSTRAINT signals_source_type_check CHECK (
  source_type = ANY (ARRAY['OBJECT'::text, 'EVENT'::text, 'PULSAR'::text, 'EMITTER'::text, 'UNKNOWN'::text])
);

ALTER TABLE public.signals DROP CONSTRAINT IF EXISTS signals_source_check;
ALTER TABLE public.signals ADD CONSTRAINT signals_source_check CHECK (
  (source_type = 'OBJECT'  AND source_object_id IS NOT NULL AND source_event_id IS NULL AND source_system_id IS NULL) OR
  (source_type = 'EVENT'   AND source_event_id IS NOT NULL AND source_object_id IS NULL AND source_system_id IS NULL) OR
  (source_type = 'PULSAR'  AND source_system_id IS NOT NULL AND source_object_id IS NULL AND source_event_id IS NULL) OR
  (source_type = 'EMITTER' AND source_system_id IS NOT NULL AND source_object_id IS NULL AND source_event_id IS NULL) OR
  (source_type = 'UNKNOWN' AND source_object_id IS NULL AND source_event_id IS NULL AND source_system_id IS NULL)
);

COMMENT ON CONSTRAINT signals_source_check ON public.signals IS
'Exactement une source par signal selon source_type.
OBJECT → source_object_id (system_objects) · EVENT → source_event_id (signal_events)
PULSAR → source_system_id (astre émetteur lointain) · EMITTER → source_system_id (émetteur du système du vaisseau)
UNKNOWN → aucune source (traces narratives)';

-- 2. Définition des émetteurs ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.system_signal_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  system_id text NOT NULL REFERENCES public.stellar_systems(id) ON DELETE CASCADE,
  scenario_arc text,
  frequency_hz numeric NOT NULL,
  band text NOT NULL CHECK (band IN ('P', 'L', 'X', 'G')),
  support public.signal_support NOT NULL DEFAULT 'EM_RADIO',
  polarization text,
  structure text,
  pulse_period_s numeric CHECK (pulse_period_s IS NULL OR pulse_period_s > 0),
  window_duration_s int,
  cycle_s int,
  window_offset_s int NOT NULL DEFAULT 0,
  capture_duration_s int NOT NULL CHECK (capture_duration_s > 0),
  flux_relative numeric NOT NULL CHECK (flux_relative > 0),
  provisional text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_signal_sources_window_check CHECK (
    (cycle_s IS NULL AND window_duration_s IS NULL)
    OR (cycle_s > 0 AND window_duration_s > 0 AND window_duration_s <= cycle_s)
  )
);

CREATE INDEX IF NOT EXISTS idx_system_signal_sources_system ON public.system_signal_sources(system_id);

ALTER TABLE public.system_signal_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.system_signal_sources FROM PUBLIC, anon, authenticated;

COMMENT ON TABLE public.system_signal_sources IS 'Émetteurs propres à un système, copiés dans signals à l''arrivée (capture_system_signals). Illisible côté client.';
COMMENT ON COLUMN public.system_signal_sources.provisional IS 'Colonnes dont la valeur est provisoire (absente de la doc de conception).';

-- 3. Époque commune des cycles ───────────────────────────────────────────────────
INSERT INTO public.game_settings (key, value, description)
VALUES ('scenario_signal_epoch', to_jsonb('2026-10-01T00:00:00Z'::text),
        'Époque (UTC) des cycles d''émission des signaux à fenêtres. Valeur provisoire : la phase des fenêtres en dépend pour tous les joueurs.')
ON CONFLICT (key) DO NOTHING;

-- 4. Émetteurs du Fil des 75 (LACUNA_SCENARIOS.md §5.3) ──────────────────────────
-- Proxima b : 1420 MHz au terminateur, fenêtres de 40 min, périodicité interne 73 s, polarisation circulaire gauche.
-- Ross 128 b : 1420 MHz à l'aube locale, fenêtre de 40 min par cycle jour-nuit de 61 h (aucune périodicité interne ni polarisation documentées).
INSERT INTO public.system_signal_sources
  (key, system_id, scenario_arc, frequency_hz, band, polarization, structure, pulse_period_s,
   window_duration_s, cycle_s, window_offset_s, capture_duration_s, flux_relative, provisional)
VALUES
  ('PROXIMA-SCN02-001', 'PROXIMA', 'scn-02-fil-des-75', 1420000000, 'L', 'circulaire gauche', 'pulsé régulier', 73,
   2400, 219600, 0, 300, 0.13, ARRAY['cycle_s', 'window_offset_s', 'capture_duration_s', 'flux_relative']),
  ('ROSS128-SCN02-001', 'ROSS128', 'scn-02-fil-des-75', 1420000000, 'L', NULL, NULL, NULL,
   2400, 219600, 0, 300, 0.13, ARRAY['window_offset_s', 'capture_duration_s', 'flux_relative'])
ON CONFLICT (key) DO NOTHING;

-- 5. Capture à l'arrivée ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.capture_system_signals()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
  v_epoch text;
  v_inserted int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  -- Verrou : deux appels simultanés (montage + changement de système) n'insèrent pas deux fois
  SELECT * INTO v_ship FROM ships WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun vaisseau pour ce compte' USING ERRCODE = 'P0002';
  END IF;
  IF v_ship.travel_state = 'IN_TRANSIT' OR v_ship.current_system_id IS NULL THEN
    RETURN json_build_object('inserted', 0);
  END IF;

  SELECT value #>> '{}' INTO v_epoch FROM game_settings WHERE key = 'scenario_signal_epoch';

  WITH ins AS (
    INSERT INTO signals (source_type, source_system_id, ship_id, frequency_hz, support, duration_sec, attributes)
    SELECT 'EMITTER', s.system_id, v_ship.id, s.frequency_hz, s.support, s.capture_duration_s,
           jsonb_strip_nulls(jsonb_build_object(
             'source_ref', s.id,
             'band', s.band,
             'polarization', s.polarization,
             'structure', s.structure,
             'pulse_period_s', s.pulse_period_s,
             'is_periodic', s.pulse_period_s IS NOT NULL,
             'flux_relative', s.flux_relative,
             'azimuth', 0,
             'elevation', 0,
             'anomalous', false,
             'window', CASE WHEN s.cycle_s IS NOT NULL THEN jsonb_build_object(
                         'epoch', v_epoch, 'cycle_s', s.cycle_s,
                         'offset_s', s.window_offset_s, 'duration_s', s.window_duration_s) END
           ))
    FROM system_signal_sources s
    WHERE s.system_id = v_ship.current_system_id
      AND NOT EXISTS (
        SELECT 1 FROM signals g
        WHERE g.ship_id = v_ship.id AND g.source_type = 'EMITTER' AND g.attributes->>'source_ref' = s.id::text
      )
    RETURNING 1
  )
  SELECT count(*) INTO v_inserted FROM ins;

  RETURN json_build_object('inserted', v_inserted);
END;
$$;

COMMENT ON FUNCTION public.capture_system_signals() IS
  'Copie dans signals les émetteurs du système courant du vaisseau du joueur (idempotent). Renvoie {inserted}.';

REVOKE ALL ON FUNCTION public.capture_system_signals() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.capture_system_signals() TO authenticated;
