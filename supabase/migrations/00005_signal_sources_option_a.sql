-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Option A : Sources de signaux (objets émetteurs + événements transients)
-- Mars 2026 — Réf. Documentation-backend.md § Sources de signaux
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Extension system_object_type (PULSAR, NEUTRON_STAR, MAGNETAR) ──
ALTER TYPE system_object_type ADD VALUE IF NOT EXISTS 'PULSAR';
ALTER TYPE system_object_type ADD VALUE IF NOT EXISTS 'NEUTRON_STAR';
ALTER TYPE system_object_type ADD VALUE IF NOT EXISTS 'MAGNETAR';

-- ── 2. Colonnes d'émission sur system_objects ──
ALTER TABLE system_objects
  ADD COLUMN IF NOT EXISTS emits_signals BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS emission_support signal_support,
  ADD COLUMN IF NOT EXISTS emission_pattern TEXT,
  ADD COLUMN IF NOT EXISTS emission_frequency_hz DECIMAL,
  ADD COLUMN IF NOT EXISTS emission_direction TEXT;

COMMENT ON COLUMN system_objects.emits_signals IS 'Émet des signaux captables (PULSAR, NEUTRON_STAR, MAGNETAR)';
COMMENT ON COLUMN system_objects.emission_support IS 'EM_RADIO, GAMMA_X, GRAVITATIONNEL';
COMMENT ON COLUMN system_objects.emission_pattern IS 'CONTINUOUS, PERIODIC, BURST';
COMMENT ON COLUMN system_objects.emission_frequency_hz IS 'Fréquence période en Hz (ex. 1.3 pour PSR B1919+21)';
COMMENT ON COLUMN system_objects.emission_direction IS 'omni, beam (faisceau)';

-- ── 3. Table signal_events (événements transients) ──
CREATE TABLE IF NOT EXISTS signal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_id TEXT NOT NULL REFERENCES stellar_systems(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  duration_sec INT,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signal_events_system ON signal_events(system_id);
CREATE INDEX IF NOT EXISTS idx_signal_events_observed ON signal_events(observed_at);

ALTER TABLE signal_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read signal_events" ON signal_events FOR SELECT USING (true);

-- ── 4. Table signals (captures par les capteurs du vaisseau) ──
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type TEXT CHECK (source_type IN ('OBJECT', 'EVENT', 'UNKNOWN')),
  source_object_id UUID REFERENCES system_objects(id) ON DELETE SET NULL,
  source_event_id UUID REFERENCES signal_events(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  ship_id UUID REFERENCES ships(id) ON DELETE CASCADE,
  frequency_hz DECIMAL,
  support signal_support NOT NULL,
  duration_sec INT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  attributes JSONB DEFAULT '{}',
  CONSTRAINT signals_source_check CHECK (
    (source_type = 'OBJECT' AND source_object_id IS NOT NULL AND source_event_id IS NULL) OR
    (source_type = 'EVENT' AND source_event_id IS NOT NULL AND source_object_id IS NULL) OR
    (source_type = 'UNKNOWN' AND source_object_id IS NULL AND source_event_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_signals_session ON signals(session_id);
CREATE INDEX IF NOT EXISTS idx_signals_ship ON signals(ship_id);
CREATE INDEX IF NOT EXISTS idx_signals_source_object ON signals(source_object_id);
CREATE INDEX IF NOT EXISTS idx_signals_source_event ON signals(source_event_id);
CREATE INDEX IF NOT EXISTS idx_signals_captured ON signals(captured_at);

ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
-- Prototype : accès ouvert (filtrage session_id côté client). Avec auth : restreindre par ship_id.
CREATE POLICY "Allow all signals for prototype" ON signals FOR ALL USING (true) WITH CHECK (true);
