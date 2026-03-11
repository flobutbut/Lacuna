-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Table system_objects (objets composant un système stellaire)
-- Mars 2026 — Réf. LACUNA_TRACES, LACUNA_LABORATOIRE_INSTRUMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE system_object_type AS ENUM ('STAR', 'PLANET', 'MOON', 'MINOR_BODY', 'DEBRIS_DISK');

CREATE TYPE confirmation_status AS ENUM ('CONFIRMED', 'DEBATED', 'UNCONFIRMED');

CREATE TABLE system_objects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_id TEXT NOT NULL REFERENCES stellar_systems(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES system_objects(id) ON DELETE CASCADE,
  type system_object_type NOT NULL,
  designation TEXT,
  name TEXT NOT NULL,
  sort_order INT DEFAULT 0,

  -- Orbite (PLANET, MOON, MINOR_BODY)
  orbital_semi_major_axis_au DECIMAL,
  orbital_period_days DECIMAL,
  orbital_eccentricity DECIMAL,
  orbital_inclination_deg DECIMAL,

  -- Physique (STAR, PLANET, MOON)
  mass_earth DECIMAL,
  mass_stellar DECIMAL,
  radius_earth DECIMAL,
  spectral_type TEXT,
  stellar_activity TEXT,

  -- Habitabilité (PLANET, MOON)
  in_habitable_zone BOOLEAN DEFAULT false,
  habitable_zone_type TEXT,

  -- Atmosphère (PLANET, MOON)
  has_atmosphere BOOLEAN,
  atmosphere_detected BOOLEAN,
  atmosphere_pressure_bar DECIMAL,
  atmosphere_notes TEXT,

  -- Disque (DEBRIS_DISK)
  disk_inner_radius_au DECIMAL,
  disk_outer_radius_au DECIMAL,
  disk_mass_earth DECIMAL,
  disk_structure TEXT,
  disk_density_factor DECIMAL,

  -- Meta
  confirmation_status confirmation_status DEFAULT 'CONFIRMED',
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_objects_system ON system_objects(system_id);
CREATE INDEX idx_system_objects_parent ON system_objects(parent_id);
CREATE INDEX idx_system_objects_type ON system_objects(type);
CREATE INDEX idx_system_objects_sort ON system_objects(system_id, sort_order);

ALTER TABLE system_objects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read system_objects" ON system_objects FOR SELECT USING (true);
