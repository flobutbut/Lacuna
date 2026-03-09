-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Schéma initial
-- Basé sur le GDD v0.1 — Mars 2026
-- ═══════════════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Types ENUM ──
CREATE TYPE trace_type AS ENUM (
  'SIGNAL_RADIO', 'INTERSTELLAR_OBJECT', 'CHEMICAL_ANOMALY', 'STELLAR_ANOMALY',
  'ORBITAL_ANOMALY', 'ENCODED_SEQUENCE', 'PHYSICAL_ARTIFACT', 'PLAYER_TRACE'
);

CREATE TYPE trace_origin AS ENUM ('IMMUABLE', 'GENERÉE', 'JOUEUR');

CREATE TYPE trace_difficulty AS ENUM ('1', '2', '3', '4');

CREATE TYPE confidence_level AS ENUM ('OBSERVATION', 'HYPOTHÈSE', 'CONVICTION', 'CERTITUDE');

CREATE TYPE log_entry_type AS ENUM ('MANUEL', 'AUTO', 'GENERATIONNEL');

CREATE TYPE ship_travel_state AS ENUM ('IDLE', 'IN_TRANSIT', 'ARRIVED', 'DAMAGED');

-- ── Systèmes stellaires (génération procédurale, lazy) ──
CREATE TABLE stellar_systems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  spectral_type TEXT,
  distance DECIMAL(10, 2),
  age DECIMAL(5, 2),
  planets INT DEFAULT 0,
  habitable_zone BOOLEAN DEFAULT false,
  anomaly_level INT DEFAULT 0 CHECK (anomaly_level BETWEEN 0 AND 3),
  coordinates JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Traces (objet fondamental du jeu) ──
CREATE TABLE traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  designation TEXT NOT NULL UNIQUE,
  type trace_type NOT NULL,
  origin trace_origin NOT NULL,
  system_id TEXT REFERENCES stellar_systems(id),
  coordinates JSONB,
  age DECIMAL,
  difficulty trace_difficulty DEFAULT '1',
  real_reference BOOLEAN DEFAULT false,
  description TEXT,
  visual TEXT,
  points_to UUID REFERENCES traces(id),
  discovered DATE,
  discovered_by UUID, -- ship_id, nullable pour IMMUABLE
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_traces_system ON traces(system_id);
CREATE INDEX idx_traces_type ON traces(type);
CREATE INDEX idx_traces_origin ON traces(origin);

-- ── Vaisseaux ──
CREATE TABLE ships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voyage INT DEFAULT 1,
  generation INT DEFAULT 1,
  departure_date DATE,
  position JSONB DEFAULT '{"x": 0, "y": 0, "z": 0}',
  travel_state ship_travel_state DEFAULT 'IDLE',
  travel_destination TEXT REFERENCES stellar_systems(id),
  travel_departure_at TIMESTAMPTZ,
  travel_arrival_at TIMESTAMPTZ,
  systems JSONB DEFAULT '{"propulsion": 1, "hull": 1, "plasmaShield": 1, "observatory": 1, "lifeSupport": 1}',
  fuel JSONB DEFAULT '{"he3": 1, "deuterium": 1}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ── Population (par vaisseau) ──
CREATE TABLE populations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE UNIQUE,
  total INT DEFAULT 10247,
  generation INT DEFAULT 1,
  average_age DECIMAL(5, 2) DEFAULT 34.2,
  birth_rate DECIMAL(6, 4) DEFAULT 0.012,
  will DECIMAL(4, 3) DEFAULT 0.82,
  social_cohesion DECIMAL(4, 3) DEFAULT 0.67,
  food_supply DECIMAL(4, 3) DEFAULT 0.91,
  medical_care DECIMAL(4, 3) DEFAULT 0.95,
  culture TEXT DEFAULT 'ACTIVE',
  governance TEXT DEFAULT 'TENSION_MINEURE',
  history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Traces collectées par un vaisseau ──
CREATE TABLE ship_traces (
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
  trace_id UUID REFERENCES traces(id) ON DELETE CASCADE,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (ship_id, trace_id)
);

-- ── Interprétations (anonymes, liées aux traces) ──
CREATE TABLE interpretations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trace_id UUID REFERENCES traces(id) ON DELETE CASCADE,
  ship_id UUID REFERENCES ships(id) ON DELETE SET NULL, -- anonyme côté API
  generation INT,
  ship_age TEXT,
  galactic_date TEXT,
  text TEXT NOT NULL,
  direction TEXT,
  confidence confidence_level DEFAULT 'HYPOTHÈSE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interpretations_trace ON interpretations(trace_id);

-- ── Carnet de bord ──
CREATE TABLE logbook_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
  type log_entry_type NOT NULL,
  generation INT NOT NULL,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  linked_traces UUID[] DEFAULT '{}',
  linked_systems TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logbook_ship ON logbook_entries(ship_id);

-- ── Carte (noeuds visités par vaisseau) ──
CREATE TABLE map_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL,
  name TEXT NOT NULL,
  visited_at DATE,
  generation INT,
  traces_found INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ship_id, system_id)
);

CREATE TABLE map_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
  from_system TEXT NOT NULL,
  to_system TEXT NOT NULL,
  travel_time INT,
  generation INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_map_nodes_ship ON map_nodes(ship_id);
CREATE INDEX idx_map_edges_ship ON map_edges(ship_id);

-- ── Équation de Drake (global, singleton) ──
CREATE TABLE drake_equation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  r_star DECIMAL DEFAULT 3.0,
  fp DECIMAL DEFAULT 1.0,
  ne DECIMAL DEFAULT 0.4,
  fl DECIMAL DEFAULT 0.31,
  fi DECIMAL DEFAULT 0.10,
  fc DECIMAL DEFAULT 0.20,
  l_val DECIMAL DEFAULT 10000,
  n DECIMAL DEFAULT 12.4,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  last_delta DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Une seule ligne
INSERT INTO drake_equation (id) VALUES (uuid_generate_v4());

CREATE TABLE drake_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE,
  n DECIMAL,
  changed_term TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS (Row Level Security) ──
ALTER TABLE ships ENABLE ROW LEVEL SECURITY;
ALTER TABLE populations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE logbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_edges ENABLE ROW LEVEL SECURITY;

-- Traces et systèmes stellaires : lecture publique
ALTER TABLE traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE stellar_systems ENABLE ROW LEVEL SECURITY;

-- Drake : lecture publique
ALTER TABLE drake_equation ENABLE ROW LEVEL SECURITY;
ALTER TABLE drake_history ENABLE ROW LEVEL SECURITY;

-- Policies : chaque user ne voit que son vaisseau et les données associées
CREATE POLICY "Users can manage own ship" ON ships
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own population" ON populations
  FOR ALL USING (
    ship_id IN (SELECT id FROM ships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own ship_traces" ON ship_traces
  FOR ALL USING (
    ship_id IN (SELECT id FROM ships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert interpretations" ON interpretations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read interpretations" ON interpretations
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own logbook" ON logbook_entries
  FOR ALL USING (
    ship_id IN (SELECT id FROM ships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own map" ON map_nodes
  FOR ALL USING (
    ship_id IN (SELECT id FROM ships WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own map edges" ON map_edges
  FOR ALL USING (
    ship_id IN (SELECT id FROM ships WHERE user_id = auth.uid())
  );

-- Lecture publique pour traces, systèmes, drake
CREATE POLICY "Public read traces" ON traces FOR SELECT USING (true);
CREATE POLICY "Public read stellar_systems" ON stellar_systems FOR SELECT USING (true);
CREATE POLICY "Public read drake" ON drake_equation FOR SELECT USING (true);
CREATE POLICY "Public read drake_history" ON drake_history FOR SELECT USING (true);

-- Service role pour écriture drake (via Edge Function ou trigger)
-- Les traces immuables seront insérées manuellement / seed
