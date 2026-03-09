-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Données initiales (traces immuables)
-- Références scientifiques réelles du GDD
-- ═══════════════════════════════════════════════════════════════════════════════

-- Système Sol (point de départ)
INSERT INTO stellar_systems (id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level)
VALUES ('SOL', 'Sol', 'G2V', 0, 4.6, 8, true, 0)
ON CONFLICT (id) DO NOTHING;

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
