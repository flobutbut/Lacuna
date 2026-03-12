-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Colonne anomalous sur observations (signaux atypiques)
-- Mars 2026 — Réf. Analyse-flux-signaux-supabase.md §5.2
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE observations ADD COLUMN IF NOT EXISTS anomalous BOOLEAN DEFAULT false;

COMMENT ON COLUMN observations.anomalous IS 'Signal atypique / anormal (ex. WOW, pulsation inhabituelle)';
