-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Départ le 1er janvier 2041 (LACUNA_GDD.md §2, LACUNA_LORE.md §2) — migration 00073
--
--   Le calendrier du vaisseau partait de 2187, ce qui contredisait le lore : volontaires sélectionnés
--   entre 2036 et 2040, premier vaisseau de classe ARCA opérationnel en 2041.
--   • ship_galactic_date : départ en 2041 ; les années de plus de quatre chiffres ne sont plus tronquées.
--   • built_year : 2041 pour tous les vaisseaux (au lieu de année réelle + 212).
--   • Données existantes : dates du journal décalées de −146 ans, dates de réception des signaux recalculées.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Calendrier ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ship_galactic_date(p_ship public.ships, p_at timestamptz DEFAULT now())
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_years double precision := ship_galactic_years(p_ship, p_at);
  v_year text := (2041 + floor(v_years))::bigint::text;
  v_day int;
BEGIN
  v_day := least(364, floor((v_years - floor(v_years)) * 365)::int);
  -- Au moins quatre chiffres, sans tronquer les années plus longues (lpad tronque au-delà de la longueur demandée)
  RETURN lpad(v_year, greatest(4, length(v_year)), '0') || '-' || to_char(date '2001-01-01' + v_day, 'MM-DD');
END;
$$;

REVOKE ALL ON FUNCTION public.ship_galactic_date(public.ships, timestamptz) FROM PUBLIC, anon;

-- 2. Année de construction ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ships_set_built_year()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Entrée en service du premier vaisseau de classe ARCA (LACUNA_LORE.md §2)
  NEW.built_year := 2041;
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN public.ships.built_year IS 'Année de construction : 2041, entrée en service du premier vaisseau ARCA (LACUNA_LORE.md §2)';

UPDATE public.ships SET built_year = 2041 WHERE built_year IS DISTINCT FROM 2041;

-- 3. Données existantes ──────────────────────────────────────────────────────────
-- Journal : même jour de l'année, 146 ans plus tôt
UPDATE public.logbook_entries
SET date = lpad(y::text, greatest(4, length(y::text)), '0') || substr(date, length(split_part(date, '-', 1)) + 1)
FROM (SELECT id AS eid, split_part(date, '-', 1)::bigint - 146 AS y FROM public.logbook_entries
       WHERE date ~ '^[0-9]+-[0-9]{2}-[0-9]{2}$') AS shifted
WHERE logbook_entries.id = shifted.eid;

-- Signaux des parties en cours : date de réception recalculée
UPDATE public.signals g
SET attributes = coalesce(g.attributes, '{}'::jsonb)
  || jsonb_build_object('receivedAt', public.ship_galactic_date(s, coalesce(g.captured_at, now())))
FROM public.ships s
WHERE g.ship_id = s.id;
