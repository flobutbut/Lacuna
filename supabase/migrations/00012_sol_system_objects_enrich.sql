-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Enrichissement données système solaire (distances, orbites, atmosphères)
-- Mars 2026 — Données NASA/IAU, distances centre planète ↔ centre Soleil (UA)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Soleil
UPDATE system_objects SET
  radius_earth = 109.1,
  stellar_activity = 'MODERATE'
WHERE system_id = 'SOL' AND type = 'STAR';

-- Mercure
UPDATE system_objects SET
  orbital_semi_major_axis_au = 0.3871,
  orbital_period_days = 87.97,
  orbital_eccentricity = 0.2056,
  orbital_inclination_deg = 7.00,
  radius_earth = 0.383,
  has_atmosphere = true,
  atmosphere_detected = true,
  atmosphere_pressure_bar = 1e-14,
  atmosphere_notes = 'Exosphère ténue (H, He, O, Na)'
WHERE system_id = 'SOL' AND designation = 'b';

-- Vénus
UPDATE system_objects SET
  orbital_semi_major_axis_au = 0.7233,
  orbital_period_days = 224.70,
  orbital_eccentricity = 0.0068,
  orbital_inclination_deg = 3.39,
  radius_earth = 0.949,
  has_atmosphere = true,
  atmosphere_detected = true,
  atmosphere_pressure_bar = 92,
  atmosphere_notes = 'CO₂ 96.5 %, effet de serre extrême'
WHERE system_id = 'SOL' AND designation = 'c';

-- Terre
UPDATE system_objects SET
  orbital_semi_major_axis_au = 1.0000,
  orbital_period_days = 365.25,
  orbital_eccentricity = 0.0167,
  orbital_inclination_deg = 0.00,
  radius_earth = 1.0,
  has_atmosphere = true,
  atmosphere_detected = true,
  atmosphere_pressure_bar = 1.013,
  atmosphere_notes = 'N₂ 78 %, O₂ 21 %, zone habitable'
WHERE system_id = 'SOL' AND designation = 'd';

-- Mars
UPDATE system_objects SET
  orbital_semi_major_axis_au = 1.5237,
  orbital_period_days = 686.98,
  orbital_eccentricity = 0.0934,
  orbital_inclination_deg = 1.85,
  radius_earth = 0.532,
  has_atmosphere = true,
  atmosphere_detected = true,
  atmosphere_pressure_bar = 0.00636,
  atmosphere_notes = 'CO₂ 95 %, fine, poussière'
WHERE system_id = 'SOL' AND designation = 'e';

-- Jupiter
UPDATE system_objects SET
  orbital_semi_major_axis_au = 5.2026,
  orbital_period_days = 4332.59,
  orbital_eccentricity = 0.0484,
  orbital_inclination_deg = 1.30,
  radius_earth = 11.21,
  has_atmosphere = true,
  atmosphere_detected = true,
  atmosphere_notes = 'Géante gazeuse H/He, transitions gazeuses'
WHERE system_id = 'SOL' AND designation = 'f';

-- Saturne
UPDATE system_objects SET
  orbital_semi_major_axis_au = 9.5369,
  orbital_period_days = 10759.22,
  orbital_eccentricity = 0.0542,
  orbital_inclination_deg = 2.49,
  radius_earth = 9.45,
  has_atmosphere = true,
  atmosphere_detected = true,
  atmosphere_notes = 'Géante gazeuse H/He, anneaux'
WHERE system_id = 'SOL' AND designation = 'g';

-- Uranus
UPDATE system_objects SET
  orbital_semi_major_axis_au = 19.1913,
  orbital_period_days = 30687.15,
  orbital_eccentricity = 0.0472,
  orbital_inclination_deg = 0.77,
  radius_earth = 4.01,
  has_atmosphere = true,
  atmosphere_detected = true,
  atmosphere_notes = 'Géante de glace H/He/CH₄'
WHERE system_id = 'SOL' AND designation = 'h';

-- Neptune
UPDATE system_objects SET
  orbital_semi_major_axis_au = 30.0690,
  orbital_period_days = 60190.03,
  orbital_eccentricity = 0.0086,
  orbital_inclination_deg = 1.77,
  radius_earth = 3.88,
  has_atmosphere = true,
  atmosphere_detected = true,
  atmosphere_notes = 'Géante de glace H/He/CH₄'
WHERE system_id = 'SOL' AND designation = 'i';
