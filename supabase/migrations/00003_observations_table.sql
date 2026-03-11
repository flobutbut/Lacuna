-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Table observations (file d'observations Laboratoire)
-- Mars 2026 — Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md
-- ═══════════════════════════════════════════════════════════════════════════════

-- Types pour observations
CREATE TYPE observation_type AS ENUM (
  'SIGNAL', 'PLANETE', 'ATMOSPHERE', 'ETOILE', 'MINEUR', 'OBJET'
);

CREATE TYPE observation_state AS ENUM ('PENDING', 'RUNNING', 'DONE');

CREATE TYPE observation_niveau AS ENUM ('PASSIF', 'SYSTEME', 'ORBITE', 'CONTACT');

CREATE TYPE signal_support AS ENUM ('EM_RADIO', 'GAMMA_X', 'GRAVITATIONNEL');

-- Table observations — file d'attente Laboratoire
-- session_id : identifiant client (localStorage) pour prototype sans auth
-- ship_id : lien vaisseau quand auth disponible (nullable)
CREATE TABLE observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
  type observation_type NOT NULL,
  system_id TEXT REFERENCES stellar_systems(id),
  name TEXT NOT NULL,
  state observation_state DEFAULT 'PENDING',
  niveau observation_niveau DEFAULT 'PASSIF',
  coords TEXT,
  distance TEXT,
  support signal_support,
  duration_sec INT,
  date TEXT,
  system_display TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_observations_session ON observations(session_id);
CREATE INDEX idx_observations_ship ON observations(ship_id);
CREATE INDEX idx_observations_state ON observations(state);

-- RLS
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;

-- Lecture/écriture par session (prototype) — filtré côté client par session_id
-- Avec auth : restreindre par ship_id
CREATE POLICY "Allow all observations for prototype" ON observations
  FOR ALL USING (true) WITH CHECK (true);
