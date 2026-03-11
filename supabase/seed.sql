-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Données initiales (traces immuables + faux contenus prototype)
-- Références scientifiques réelles du GDD · LACUNA_TRACES.md
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Systèmes stellaires (voisinage solaire < 25 al) ──
-- coordinates: {ra, dec} en degrés pour projection 2D ciel (ra 0-360, dec -90 à 90)
INSERT INTO stellar_systems (id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level, coordinates)
VALUES
  ('SOL', 'Sol', 'G2V', 0, 4.6, 8, true, 0, '{"ra": 0, "dec": 0}'),
  ('PROXIMA', 'Proxima Centauri', 'M5.5V', 4.24, 4.85, 3, true, 1, '{"ra": 217.5, "dec": -62.7}'),
  ('BARNARD', 'Étoile de Barnard', 'M4V', 5.96, 10, 0, false, 2, '{"ra": 270.0, "dec": 4.7}'),
  ('ROSS128', 'Ross 128', 'M4V', 11.0, 9.5, 1, false, 1, '{"ra": 176.9, "dec": 0.8}'),
  ('EPSILON_ERIDANI', 'Epsilon Eridani', 'K2V', 10.5, 0.8, 1, false, 2, '{"ra": 53.2, "dec": -9.5}'),
  ('TAU_CETI', 'Tau Ceti', 'G8V', 11.9, 5.8, 5, true, 2, '{"ra": 26.0, "dec": -15.9}'),
  ('GLIESE667', 'Gliese 667C', 'M1.5V', 22.0, 2.0, 3, true, 3, '{"ra": 259.7, "dec": -34.9}'),
  ('HD44594', 'HD 44594', 'G0V', 11.4, 5.2, 2, true, 0, '{"ra": 95.0, "dec": -3.1}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  spectral_type = EXCLUDED.spectral_type,
  distance = EXCLUDED.distance,
  age = EXCLUDED.age,
  planets = EXCLUDED.planets,
  habitable_zone = EXCLUDED.habitable_zone,
  anomaly_level = EXCLUDED.anomaly_level,
  coordinates = EXCLUDED.coordinates;

-- Trace immuable : Signal WOW! 1977
INSERT INTO traces (
  designation, type, origin, system_id, difficulty, real_reference,
  description, visual, discovered
) VALUES (
  'WOW-1977-A', 'SIGNAL_RADIO', 'IMMUABLE', 'SOL', '1', true,
  'Signal radio de 72 secondes détecté à 1420 MHz, correspondant exactement à la raie de l''hydrogène. Non reproduit depuis. Non expliqué.',
  'waveform', '1977-08-15'
) ON CONFLICT (designation) DO NOTHING;

-- Trace immuable : Oumuamua
INSERT INTO traces (
  designation, type, origin, system_id, difficulty, real_reference,
  description, visual, discovered
) VALUES (
  'OUMUAMUA-2017', 'INTERSTELLAR_OBJECT', 'IMMUABLE', 'SOL', '1', true,
  'Objet interstellaire détecté en 2017. Trajectoire hyperbolique. Accélération non-gravitationnelle observée. Forme allongée suggérée. Origine inconnue.',
  'trajectory', '2017-10-19'
) ON CONFLICT (designation) DO NOTHING;

-- Trace immuable : Nucléobases Bennu/Ryugu
INSERT INTO traces (
  designation, type, origin, system_id, difficulty, real_reference,
  description, visual, discovered
) VALUES (
  'BENNU-NB-2023', 'CHEMICAL_ANOMALY', 'IMMUABLE', 'SOL', '2', true,
  'Nucléobases (uracile, niacine) découvertes dans les échantillons de Bennu et Ryugu. Composition suggérant une origine prébiotique. Questions sur l''ubiquité de la chimie de la vie.',
  'spectrogram', '2023-03-21'
) ON CONFLICT (designation) DO NOTHING;

-- ── Traces immuables voisinage (LACUNA_TRACES §2) ──
-- PROXIMA-001 — Le Silence de Proxima b (ABSENCE → STELLAR_ANOMALY)
INSERT INTO traces (designation, type, origin, system_id, difficulty, real_reference, description, visual, discovered)
VALUES ('PROXIMA-001', 'STELLAR_ANOMALY', 'IMMUABLE', 'PROXIMA', '1', true,
  'Proxima b en zone habitable mais atmosphère non détectée. Naine rouge ultra-active. Modèles prédisent érosion atmosphérique — non confirmée.',
  'spectrum', '2016-08-24')
ON CONFLICT (designation) DO NOTHING;

-- BARNARD-001 — La Planète de van de Kamp (ABSENCE → ORBITAL_ANOMALY)
INSERT INTO traces (designation, type, origin, system_id, difficulty, real_reference, description, visual, discovered)
VALUES ('BARNARD-001', 'ORBITAL_ANOMALY', 'IMMUABLE', 'BARNARD', '2', true,
  'Deux détections planétaires (1963, 2018) rétractées ou contestées. Statut orbital débattu. Artefact optique ou perturbations inexpliquées.',
  'orbital', '1963-01-01')
ON CONFLICT (designation) DO NOTHING;

-- ROSS128-001 — Le Signal de 2017 (SIGNAL → SIGNAL_RADIO)
INSERT INTO traces (designation, type, origin, system_id, difficulty, real_reference, description, visual, discovered)
VALUES ('ROSS128-001', 'SIGNAL_RADIO', 'IMMUABLE', 'ROSS128', '2', true,
  'Signal radio répétitif mai 2017, direction Ross 128. Bursts semi-périodiques. Attribution satellite probable mais non confirmée. Non reproduit.',
  'waveform', '2017-05-12')
ON CONFLICT (designation) DO NOTHING;

-- EPSILON-001 — Le Disque d''Epsilon Eridani (ANOMALIE_GEOMETRIQUE → ORBITAL_ANOMALY)
INSERT INTO traces (designation, type, origin, system_id, difficulty, real_reference, description, visual, discovered)
VALUES ('EPSILON-001', 'ORBITAL_ANOMALY', 'IMMUABLE', 'EPSILON_ERIDANI', '2', true,
  'Disque de débris structuré — anneaux distincts, zones de déplétion. Planètes non confirmées. Cible projet Ozma 1960.',
  'orbital', '1998-01-01')
ON CONFLICT (designation) DO NOTHING;

-- TAU-CETI-001 — Le Bombardement (ANOMALIE_CHIMIQUE → CHEMICAL_ANOMALY)
INSERT INTO traces (designation, type, origin, system_id, difficulty, real_reference, description, visual, discovered)
VALUES ('TAU-CETI-001', 'CHEMICAL_ANOMALY', 'IMMUABLE', 'TAU_CETI', '2', true,
  'Disque de débris 10× densité solaire. Deux planètes zone habitable. Anomalies isotopiques Fe. Taux bombardement météoritique élevé.',
  'spectrogram', '2017-08-09')
ON CONFLICT (designation) DO NOTHING;

-- GLIESE667-001 — Le Système Triple (ANOMALIE_GEOMETRIQUE → ORBITAL_ANOMALY)
INSERT INTO traces (designation, type, origin, system_id, difficulty, real_reference, description, visual, discovered)
VALUES ('GLIESE667-001', 'ORBITAL_ANOMALY', 'IMMUABLE', 'GLIESE667', '3', true,
  'Résonance orbitale 1:2:4 quasi-parfaite. Trois planètes zone habitable. Stabilité dynamique limite. Probabilité naturelle estimée < 2%.',
  'orbital', '2012-11-01')
ON CONFLICT (designation) DO NOTHING;
