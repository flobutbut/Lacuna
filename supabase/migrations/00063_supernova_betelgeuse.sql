-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Supernova de Bételgeuse (SN-001, LACUNA_TRACES_IMMUABLES.md §5)
--
--   • ships.supernova_t0 : instant de la bouffée de neutrinos, propre à chaque partie —
--     création de la partie + 10 minutes. Une réinitialisation recrée le vaisseau, donc l'événement.
--     Les vaisseaux existants reçoivent « maintenant + 10 minutes » à l'application.
--   • signal_events : l'événement (une ligne, système 'betelgeuse').
--   • capture_supernova_neutrinos() : à partir de T0, copie la bouffée dans les signaux du joueur
--     (support NEUTRINO, sans fréquence ; disponible 24 h). Une seule fois par partie (supernova_captured_at).
--
-- La suite (sortie du choc, montée, déclin, rémanent) se calcule côté client à partir de T0
-- (src/lib/supernova.js) : rien d'autre n'est stocké.
--
-- VALEURS PROVISOIRES de la bouffée : 5 000 000 événements (extrapolation de Super-Kamiokande
-- à la distance de Bételgeuse, non vérifiée), énergie moyenne 15 MeV et durée ~10 s (SN 1987A),
-- direction à ±3° (pointage attendu pour une supernova proche).
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. T0 par partie ───────────────────────────────────────────────────────────────
ALTER TABLE public.ships
  ADD COLUMN IF NOT EXISTS supernova_t0 timestamptz DEFAULT (now() + interval '10 minutes'),
  ADD COLUMN IF NOT EXISTS supernova_captured_at timestamptz;

COMMENT ON COLUMN public.ships.supernova_t0 IS
  'Bouffée de neutrinos de la supernova de Bételgeuse pour cette partie (création + 10 min). Les phases suivantes en découlent.';
COMMENT ON COLUMN public.ships.supernova_captured_at IS
  'Capture de la bouffée par ce vaisseau : une seule fois, même si le joueur supprime ensuite le signal (analyse).';

-- 2. L'événement ─────────────────────────────────────────────────────────────────
INSERT INTO public.signal_events (system_id, event_type, observed_at, duration_sec, attributes)
SELECT 'betelgeuse', 'SUPERNOVA', now(), 10, '{"key": "SN-001"}'::jsonb
WHERE EXISTS (SELECT 1 FROM public.stellar_systems WHERE id = 'betelgeuse')
  AND NOT EXISTS (SELECT 1 FROM public.signal_events WHERE attributes->>'key' = 'SN-001');

-- 3. Capture de la bouffée ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.capture_supernova_neutrinos()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ship ships;
  v_event uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_ship FROM ships WHERE user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun vaisseau pour ce compte' USING ERRCODE = 'P0002';
  END IF;
  -- Avant T0, ou plus de 24 h après (la bouffée ne serait plus disponible) : rien à capter
  IF v_ship.supernova_t0 IS NULL OR now() < v_ship.supernova_t0
     OR now() > v_ship.supernova_t0 + interval '24 hours' THEN
    RETURN json_build_object('inserted', 0);
  END IF;
  SELECT id INTO v_event FROM signal_events WHERE attributes->>'key' = 'SN-001' LIMIT 1;
  IF v_event IS NULL THEN
    RETURN json_build_object('inserted', 0);
  END IF;
  -- Une seule capture par partie : le signal disparaît de la liste quand le joueur l'analyse
  IF v_ship.supernova_captured_at IS NOT NULL THEN
    RETURN json_build_object('inserted', 0);
  END IF;

  INSERT INTO signals (source_type, source_event_id, ship_id, frequency_hz, support, duration_sec, captured_at, attributes)
  VALUES ('EVENT', v_event, v_ship.id, NULL, 'NEUTRINO', 10, v_ship.supernova_t0,
          jsonb_build_object(
            'structure', 'sursaut',
            'lifetime_ms', 86400000,
            'neutrino', jsonb_build_object(
              'event_count', 5000000,
              'duration_s', 10,
              'mean_energy_mev', 15,
              'direction', jsonb_build_object('ra', 88.793, 'dec', 7.407),
              'uncertainty_deg', 3)));
  UPDATE ships SET supernova_captured_at = now() WHERE id = v_ship.id;

  RETURN json_build_object('inserted', 1);
END;
$$;

COMMENT ON FUNCTION public.capture_supernova_neutrinos() IS
  'À partir de ships.supernova_t0, copie la bouffée de neutrinos de Bételgeuse dans les signaux du joueur (une fois par partie).';

REVOKE ALL ON FUNCTION public.capture_supernova_neutrinos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.capture_supernova_neutrinos() TO authenticated;
