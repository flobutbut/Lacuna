-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Onboarding (LACUNA_LORE.md §3–5, LACUNA_UI.md §9) — migration 00071
--
--   • Traces embarquées : WOW-1977-A, OUMUAMUA-2017 et BENNU-NB-2023 sont inscrites dans ship_traces
--     à la création du vaisseau (et pour les parties en cours).
--   • Premier départ : entrée AUTO au journal, famille TRACES, avec le message du flux de démarrage
--     (« 3 traces sont embarquées à bord. Elles ont motivé ce voyage. Vous avez le temps de les lire. »).
--   • Étoile de Tabby (KIC 8462852), anomalie n° 11 du catalogue, absente de stellar_systems : ajoutée.
--     Position J2000 : AD 20h06m15,45s, Déc +44°27′24,8″ (Wikipedia, AAVSO) ; distance ~1 470 al
--     (LACUNA_TRACES_IMMUABLES.md §3) ; type spectral F3V.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Traces embarquées ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ship_embark_traces(p_ship_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO ship_traces (ship_id, trace_id)
  SELECT p_ship_id, t.id FROM traces t
   WHERE t.designation IN ('WOW-1977-A', 'OUMUAMUA-2017', 'BENNU-NB-2023')
  ON CONFLICT DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.ships_on_insert_embark()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM ship_embark_traces(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_ships_embark_traces ON public.ships;
CREATE TRIGGER tr_ships_embark_traces
  AFTER INSERT ON public.ships
  FOR EACH ROW EXECUTE FUNCTION public.ships_on_insert_embark();

-- 2. Premier départ : message des traces embarquées au journal ───────────────────
CREATE OR REPLACE FUNCTION public.logbook_on_first_departure()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.travel_state = 'IN_TRANSIT' AND OLD.travel_state IS DISTINCT FROM 'IN_TRANSIT'
     AND NOT EXISTS (SELECT 1 FROM ship_travels WHERE ship_id = NEW.id) THEN
    PERFORM logbook_add(NEW, 'AUTO', 'TRACES', '3 traces sont embarquées à bord.',
      E'Elles ont motivé ce voyage.\nVous avez le temps de les lire.',
      'onb-traces', NEW.travel_departure_at);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_logbook_first_departure ON public.ships;
CREATE TRIGGER tr_logbook_first_departure
  AFTER UPDATE OF travel_state ON public.ships
  FOR EACH ROW EXECUTE FUNCTION public.logbook_on_first_departure();

REVOKE ALL ON FUNCTION public.ship_embark_traces(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.ships_on_insert_embark() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.logbook_on_first_departure() FROM PUBLIC, anon, authenticated;

-- 3. Étoile de Tabby ─────────────────────────────────────────────────────────────
-- Coordonnées cartésiennes (al) : même convention que system_xyz (x = d·cos δ·cos α, y = d·cos δ·sin α, z = d·sin δ)
INSERT INTO public.stellar_systems (id, name, spectral_type, distance, anomaly_level, coordinates, constellation_abbr, field_sources)
VALUES ('kic-8462852', 'Étoile de Tabby', 'F3V', 1470, 2,
        '{"x": 549.2381, "y": -894.0188, "z": 1029.5474, "ra": 301.5644, "dec": 44.4569}'::jsonb, 'Cyg',
        '{"name": "MANUAL", "distance": "MANUAL", "coordinates": "MANUAL", "spectral_type": "MANUAL", "anomaly_level": "MANUAL"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 4. Parties en cours : traces embarquées ────────────────────────────────────────
SELECT public.ship_embark_traces(id) FROM public.ships;
