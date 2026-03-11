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
  ('HD44594', 'HD 44594', 'G0V', 11.4, 5.2, 2, true, 0, '{"ra": 95.0, "dec": -3.1}'),
  ('PSR_B1919', 'Région PSR B1919+21', NULL, 2283, NULL, 0, false, 2, '{"ra": 290.0, "dec": 21.8}'),
  -- Naines brunes (IR-only) — sources : WISE, Luhman
  ('LUHMAN16', 'Luhman 16', 'L7.5', 6.5, 1, 0, false, 1, '{"ra": 162.3, "dec": -53.3}'),
  ('WISE0855', 'WISE 0855−0714', 'Y4', 7.4, 1, 0, false, 2, '{"ra": 133.9, "dec": -7.2}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  spectral_type = EXCLUDED.spectral_type,
  distance = EXCLUDED.distance,
  age = EXCLUDED.age,
  planets = EXCLUDED.planets,
  habitable_zone = EXCLUDED.habitable_zone,
  anomaly_level = EXCLUDED.anomaly_level,
  coordinates = EXCLUDED.coordinates;

-- ── Vaisseau prototype ARCA (user_id NULL pour prototype sans auth) ──
INSERT INTO ships (id, user_id, name, voyage, generation, current_system_id, travel_state, classe)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  NULL,
  'ARCA',
  1,
  1,
  'SOL',
  'IDLE',
  'Vaisseau générationnel de classe I'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  current_system_id = EXCLUDED.current_system_id,
  travel_state = EXCLUDED.travel_state,
  classe = EXCLUDED.classe;

-- Systèmes techniques du vaisseau ARCA (ship_systems)
INSERT INTO ship_systems (ship_id, propulsion, hull, plasma_shield, observatory, reservoir, alimentation, atmosphere, medical, he3_current, he3_max, deuterium_current, deuterium_max, dry_mass, capacity)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  0.88, 0.97, 1, 1, 0.84, 0.71, 0.96, 0.95,
  1484000, 2000000, 972000, 1200000,
  800000, 12000
)
ON CONFLICT (ship_id) DO UPDATE SET
  propulsion = EXCLUDED.propulsion,
  hull = EXCLUDED.hull,
  plasma_shield = EXCLUDED.plasma_shield,
  observatory = EXCLUDED.observatory,
  reservoir = EXCLUDED.reservoir,
  alimentation = EXCLUDED.alimentation,
  atmosphere = EXCLUDED.atmosphere,
  medical = EXCLUDED.medical,
  he3_current = EXCLUDED.he3_current,
  he3_max = EXCLUDED.he3_max,
  deuterium_current = EXCLUDED.deuterium_current,
  deuterium_max = EXCLUDED.deuterium_max;

-- Population du vaisseau prototype
INSERT INTO populations (ship_id, total, generation, average_age, birth_rate, will, social_cohesion, food_supply, medical_care)
VALUES ('11111111-1111-1111-1111-111111111111', 10247, 1, 34.2, 0.012, 0.82, 0.67, 0.91, 0.95)
ON CONFLICT (ship_id) DO UPDATE SET
  total = EXCLUDED.total,
  generation = EXCLUDED.generation;

-- ── Objets des systèmes (system_objects) ──
-- SOL — étoile + 8 planètes
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, mass_stellar)
VALUES ('SOL', 'STAR', 'a', 'Soleil', 0, 'G2V', 1.0);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('SOL', 'PLANET', 'b', 'Mercure', 1, 87.97, 0.055, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('SOL', 'PLANET', 'c', 'Vénus', 2, 224.7, 0.815, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('SOL', 'PLANET', 'd', 'Terre', 3, 365.25, 1.0, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('SOL', 'PLANET', 'e', 'Mars', 4, 687.0, 0.107, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('SOL', 'PLANET', 'f', 'Jupiter', 5, 4332.6, 317.8, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('SOL', 'PLANET', 'g', 'Saturne', 6, 10759, 95.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('SOL', 'PLANET', 'h', 'Uranus', 7, 30688, 14.5, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('SOL', 'PLANET', 'i', 'Neptune', 8, 60182, 17.1, false, NULL);

-- PROXIMA — étoile + Proxima b
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar)
VALUES ('PROXIMA', 'STAR', 'a', 'Proxima Centauri', 0, 'M5.5V', 'ACTIVE', 0.12);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, has_atmosphere, atmosphere_detected, atmosphere_notes, confirmation_status)
VALUES ('PROXIMA', 'PLANET', 'b', 'Proxima b', 1, 11.2, 1.17, true, true, false, 'Érosion stellaire présumée — non confirmée', 'CONFIRMED');

-- BARNARD — étoile seule (planètes non confirmées)
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar)
VALUES ('BARNARD', 'STAR', 'a', 'Étoile de Barnard', 0, 'M4V', 'CALM', 0.16);

-- ROSS128 — étoile + Ross 128 b
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar)
VALUES ('ROSS128', 'STAR', 'a', 'Ross 128', 0, 'M4V', 'CALM', 0.17);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type, attributes)
VALUES ('ROSS128', 'PLANET', 'b', 'Ross 128 b', 1, 9.87, 1.35, false, 'TEMPERATE', '{"flux_uv_vs_proxima_b": 0.25}');

-- EPSILON_ERIDANI — étoile + disques
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, mass_stellar)
VALUES ('EPSILON_ERIDANI', 'STAR', 'a', 'Epsilon Eridani', 0, 'K2V', 0.82);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, disk_inner_radius_au, disk_outer_radius_au, disk_structure)
VALUES ('EPSILON_ERIDANI', 'DEBRIS_DISK', NULL, 'Disque interne', 1, 3, 3, 'RINGS');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, disk_inner_radius_au, disk_outer_radius_au, disk_structure)
VALUES ('EPSILON_ERIDANI', 'DEBRIS_DISK', NULL, 'Zone de déplétion', 2, 3, 20, 'DEPLETION_ZONES');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, disk_inner_radius_au, disk_outer_radius_au, disk_structure, attributes)
VALUES ('EPSILON_ERIDANI', 'DEBRIS_DISK', NULL, 'Anneau externe', 3, 60, 60, 'ASYMMETRIC', '{"asymmetry": "densité élevée d''un côté"}');

-- TAU_CETI — étoile + planètes e, f + disque
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, mass_stellar)
VALUES ('TAU_CETI', 'STAR', 'a', 'Tau Ceti', 0, 'G8V', 0.78);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('TAU_CETI', 'PLANET', 'e', 'Tau Ceti e', 1, 168, 4.3, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type)
VALUES ('TAU_CETI', 'PLANET', 'f', 'Tau Ceti f', 2, 642, 3.9, true, 'EXTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, disk_inner_radius_au, disk_outer_radius_au, disk_density_factor, disk_structure)
VALUES ('TAU_CETI', 'DEBRIS_DISK', NULL, 'Disque de débris', 3, 10, 55, 10, 'DENSE');

-- GLIESE667 — système triple + planètes
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, mass_stellar)
VALUES ('GLIESE667', 'STAR', 'A', 'Gliese 667 A', 0, 'K3V', 0.73);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, mass_stellar)
VALUES ('GLIESE667', 'STAR', 'B', 'Gliese 667 B', 1, 'K5V', 0.69);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar)
VALUES ('GLIESE667', 'STAR', 'C', 'Gliese 667 C', 2, 'M1.5V', 'CALM', 0.31);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, attributes)
VALUES ('GLIESE667', 'PLANET', 'Cc', 'GJ 667Cc', 3, 28.1, 3.8, true, '{"resonance": "1:2:4"}');

-- HD44594 — étoile + 2 planètes génériques
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type)
VALUES ('HD44594', 'STAR', 'a', 'HD 44594', 0, 'G0V');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth)
VALUES ('HD44594', 'PLANET', 'b', 'HD 44594 b', 1, 45, 2.1);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone)
VALUES ('HD44594', 'PLANET', 'c', 'HD 44594 c', 2, 120, 1.5, true);

-- PSR_B1919 — Pulsar (trace PSR-001, LACUNA_TRACES §3). Premier pulsar découvert — initialement nommé LGM-1.
INSERT INTO system_objects (system_id, type, designation, name, sort_order, emits_signals, emission_support, emission_pattern, emission_frequency_hz, emission_direction, confirmation_status)
VALUES ('PSR_B1919', 'PULSAR', NULL, 'PSR B1919+21', 0, true, 'EM_RADIO', 'PERIODIC', 1.33, 'beam', 'CONFIRMED');

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

-- ── Systèmes stellaires étendus (~90 systèmes, données scientifiques) ──
-- Généré par: node scripts/generateExtendedSeed.js | Sources: NASA Exoplanet Archive, Wikipedia
-- Systèmes stellaires
INSERT INTO stellar_systems (id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level, coordinates)
VALUES
  ('LALANDE21185', 'Lalande 21185', 'M2V', 8.3, 5, 2, true, 0, '{"ra": 168.5, "dec": 35.2}'),
  ('GLIESE887', 'Gliese 887', 'M1.5V', 10.7, 4, 4, true, 0, '{"ra": 350.9, "dec": -35.3}'),
  ('GJ1061', 'GJ 1061', 'M5.5V', 12, 7, 3, true, 0, '{"ra": 53.2, "dec": -44.5}'),
  ('GROOMBRIDGE34', 'Groombridge 34', 'M1.5V', 11.6, 3, 2, false, 0, '{"ra": 9.2, "dec": 43.9}'),
  ('EPSILON_INDI', 'Epsilon Indi', 'K5V', 11.9, 1.3, 1, false, 0, '{"ra": 330.9, "dec": -56.9}'),
  ('YZ_CETI', 'YZ Ceti', 'M4V', 12.1, 3, 3, false, 0, '{"ra": 18.1, "dec": -16}'),
  ('LUYTEN_STAR', 'Étoile de Luyten', 'M3.5V', 12.3, 8, 2, true, 0, '{"ra": 110, "dec": 5.2}'),
  ('TEEGARDEN', 'Étoile de Teegarden', 'M7V', 12.5, 8, 3, true, 0, '{"ra": 43.3, "dec": 16.9}'),
  ('WOLF1061', 'Wolf 1061', 'M3V', 14, 5, 3, true, 0, '{"ra": 247.5, "dec": -12.7}'),
  ('GLIESE876', 'Gliese 876', 'M4V', 15.2, 10, 4, false, 0, '{"ra": 340.1, "dec": -14.2}'),
  ('GJ1002', 'GJ 1002', 'M5.5V', 15.8, 5, 2, true, 0, '{"ra": 1.5, "dec": -7.5}'),
  ('GLIESE832', 'Gliese 832', 'M2V', 16.2, 9, 1, false, 0, '{"ra": 259.2, "dec": -49}'),
  ('GLIESE674', 'Gliese 674', 'M3V', 14.8, 5, 1, false, 0, '{"ra": 262.4, "dec": -51.1}'),
  ('GLIESE687', 'Gliese 687', 'M3V', 14.8, 7, 2, false, 0, '{"ra": 264.4, "dec": 68.6}'),
  ('GJ3323', 'GJ 3323', 'M4V', 17.5, 5, 2, false, 0, '{"ra": 73.2, "dec": -6.7}'),
  ('GLIESE251', 'Gliese 251', 'M3V', 18.2, 5, 2, false, 0, '{"ra": 104.1, "dec": 33.4}'),
  ('82_ERIDANI', '82 G. Eridani', 'G6V', 19.7, 6, 3, true, 0, '{"ra": 46, "dec": -43.4}'),
  ('GLIESE581', 'Gliese 581', 'M3V', 20.5, 7, 4, true, 1, '{"ra": 229.9, "dec": -7.7}'),
  ('HD219134', 'HD 219134', 'K3V', 21.3, 11, 5, false, 0, '{"ra": 348.3, "dec": 57.2}'),
  ('GLIESE625', 'Gliese 625', 'M2V', 21.1, 3, 1, false, 0, '{"ra": 247.5, "dec": 54.3}'),
  ('LTT1445', 'LTT 1445', 'M3V', 22.4, 5, 2, false, 0, '{"ra": 79.4, "dec": -16.6}'),
  ('GLIESE393', 'Gliese 393', 'M2.5V', 23, 4, 1, false, 0, '{"ra": 158.5, "dec": 0.9}'),
  ('61_VIRGINIS', '61 Virginis', 'G5V', 27.8, 6, 3, false, 0, '{"ra": 199, "dec": -18.3}'),
  ('GLIESE785', 'Gliese 785', 'K2V', 28.7, 5, 2, false, 0, '{"ra": 308.4, "dec": -21.1}'),
  ('GLIESE433', 'Gliese 433', 'M2V', 29.6, 5, 3, false, 0, '{"ra": 173.1, "dec": -32.4}'),
  ('GLIESE357', 'Gliese 357', 'M2.5V', 30.8, 5, 3, true, 0, '{"ra": 152.2, "dec": -21.5}'),
  ('GLIESE367', 'Gliese 367', 'M1V', 30.7, 5, 3, false, 0, '{"ra": 146.1, "dec": -45.8}'),
  ('WOLF1069', 'Wolf 1069', 'M5V', 31.2, 5, 1, true, 0, '{"ra": 270.5, "dec": 58.4}'),
  ('AU_MICROSCOPII', 'AU Microscopii', 'M1V', 31.7, 0.02, 2, false, 1, '{"ra": 311.3, "dec": -31.3}'),
  ('GLIESE436', 'Gliese 436', 'M2.5V', 31.9, 6, 1, false, 0, '{"ra": 176.5, "dec": 26.7}'),
  ('HD260655', 'HD 260655', 'M0V', 32.6, 4, 2, false, 0, '{"ra": 97.2, "dec": 8.4}'),
  ('TRAPPIST1', 'TRAPPIST-1', 'M8V', 40.7, 7.6, 7, true, 2, '{"ra": 346.6, "dec": -5}'),
  ('55_CANCRI', '55 Cancri', 'G8V', 40.9, 10, 5, true, 0, '{"ra": 133.2, "dec": 28.4}'),
  ('HD40307', 'HD 40307', 'K2.5V', 41.8, 5, 6, true, 1, '{"ra": 88.5, "dec": -60}'),
  ('HD189733', 'HD 189733', 'K2V', 64.5, 5, 1, false, 0, '{"ra": 300.2, "dec": 22.7}'),
  ('KEPLER90', 'Kepler-90', 'G0V', 2845, 2, 8, false, 0, '{"ra": 289, "dec": 49}'),
  ('KEPLER452', 'Kepler-452', 'G2V', 1850, 6, 1, true, 0, '{"ra": 290, "dec": 44.5}'),
  ('GLIESE176', 'Gliese 176', 'M2.5V', 30.9, 5, 1, false, 0, '{"ra": 67.4, "dec": 18.9}'),
  ('GLIESE514', 'Gliese 514', 'M1V', 24.9, 5, 1, false, 0, '{"ra": 202.5, "dec": -12.3}'),
  ('GLIESE486', 'Gliese 486', 'M3.5V', 26.4, 2, 1, false, 0, '{"ra": 258.1, "dec": 9.4}'),
  ('GLIESE686', 'Gliese 686', 'M1.5V', 26.6, 5, 1, false, 0, '{"ra": 264.1, "dec": 18.6}'),
  ('HN_LIBRAE', 'HN Librae', 'M3V', 20.4, 5, 1, false, 0, '{"ra": 227.5, "dec": -4}'),
  ('GLIESE849', 'Gliese 849', 'M3.5V', 28.8, 5, 2, false, 0, '{"ra": 332.5, "dec": -4.7}'),
  ('GLIESE752', 'Gliese 752 A', 'M2.5V', 19.3, 5, 1, false, 0, '{"ra": 289.5, "dec": 5.2}'),
  ('GJ3988', 'GJ 3988', 'M5V', 32.3, 5, 1, false, 0, '{"ra": 126.5, "dec": 26.9}'),
  ('GLIESE49', 'Gliese 49', 'K7V', 32.2, 5, 1, false, 0, '{"ra": 13.5, "dec": 61.2}'),
  ('GJ1151', 'GJ 1151', 'M4.5V', 26.2, 5, 1, false, 0, '{"ra": 179.5, "dec": 48.2}'),
  ('GJ1289', 'GJ 1289', 'M4V', 27.3, 5, 1, false, 0, '{"ra": 289, "dec": -12.5}'),
  ('TZ_ARietis', 'TZ Arietis', 'M4.5V', 14.6, 5, 1, false, 0, '{"ra": 27.5, "dec": 17}'),
  ('EQ_PEGASI', 'EQ Pegasi A', 'M3.5V', 20.4, 5, 1, false, 0, '{"ra": 351.5, "dec": 20}'),
  ('GLIESE338', 'Gliese 338 B', 'M0V', 20.7, 5, 1, false, 0, '{"ra": 137.5, "dec": 52.6}'),
  ('GLIESE725A', 'Gliese 725 A', 'M3V', 11.5, 5, 1, false, 0, '{"ra": 280.5, "dec": 59}'),
  ('GJ3512', 'GJ 3512', 'M5.5V', 31, 5, 2, false, 2, '{"ra": 141.5, "dec": 59}'),
  ('WOLF359', 'Wolf 359', 'M6V', 7.9, 5, 0, false, 0, '{"ra": 164.1, "dec": 7}'),
  ('LACAILLE9352', 'Lacaille 9352', 'M0.5V', 10.7, 5, 2, false, 0, '{"ra": 344.4, "dec": -35.8}'),
  ('LHS288', 'LHS 288', 'M5V', 15.8, 5, 0, false, 0, '{"ra": 78.5, "dec": -68.3}'),
  ('GLIESE205', 'Gliese 205', 'M1.5V', 18.5, 5, 0, false, 0, '{"ra": 81.5, "dec": -7.6}'),
  ('GLIESE229', 'Gliese 229', 'M1V', 18.8, 5, 0, false, 0, '{"ra": 91.5, "dec": -21.9}'),
  ('40_ERIDANI', '40 Eridani', 'K1V', 16.3, 5, 0, false, 0, '{"ra": 63.8, "dec": -7.6}'),
  ('VAN_MAANEN2', 'Van Maanen 2', 'DZ7', 14.1, 10, 0, false, 0, '{"ra": 15.5, "dec": 5.5}'),
  ('GJ4026', 'GJ 4026', 'M4V', 28.5, 5, 0, false, 0, '{"ra": 178.5, "dec": 44.2}'),
  ('GLIESE526', 'Gliese 526', 'M1V', 18.3, 5, 0, false, 0, '{"ra": 209.5, "dec": 48.6}'),
  ('GLIESE754', 'Gliese 754', 'M4.5V', 19.3, 5, 0, false, 0, '{"ra": 289.2, "dec": -23.8}'),
  ('K2_18', 'K2-18', 'M2.5V', 124, 5, 1, true, 0, '{"ra": 172.5, "dec": 7.6}'),
  ('TOI700', 'TOI-700', 'M2V', 101, 1.5, 4, true, 0, '{"ra": 97.5, "dec": -65.5}'),
  ('GJ1214', 'Gliese 1214', 'M4.5V', 48, 6, 1, false, 0, '{"ra": 258.5, "dec": 5}'),
  ('GJ1132', 'Gliese 1132', 'M4V', 41, 5, 2, false, 0, '{"ra": 153.5, "dec": -47.1}'),
  ('K2_72', 'K2-72', 'M2V', 217, 5, 4, true, 0, '{"ra": 336.5, "dec": 9.6}'),
  ('LHS3844', 'LHS 3844', 'M5V', 48.6, 5, 1, false, 0, '{"ra": 337.5, "dec": -69.3}'),
  ('HD97658', 'HD 97658', 'K1V', 69, 5, 1, false, 0, '{"ra": 169.5, "dec": 25.7}'),
  ('HD85512', 'HD 85512', 'K5V', 36, 5.6, 1, true, 0, '{"ra": 147.5, "dec": -43.5}'),
  ('LHS1140', 'LHS 1140', 'M4.5V', 49, 5, 2, true, 0, '{"ra": 9.5, "dec": -15.3}'),
  ('WOLF424', 'Wolf 424', 'M5.5V', 14.3, 5, 0, false, 0, '{"ra": 195.5, "dec": 9.2}'),
  ('GJ412', 'GJ 412', 'M1V', 15.8, 5, 0, false, 0, '{"ra": 174.5, "dec": 43.5}'),
  ('GLIESE445', 'Gliese 445', 'M3.5V', 17.6, 5, 0, false, 0, '{"ra": 176.5, "dec": 78.7}'),
  ('GLIESE83', 'Gliese 83.1', 'M4.5V', 19.8, 5, 0, false, 0, '{"ra": 26.5, "dec": -18.2}'),
  ('GJ1245', 'GJ 1245', 'M5.5V', 15.2, 5, 0, false, 0, '{"ra": 299.5, "dec": 44}'),
  ('GJ1068', 'GJ 1068', 'M4V', 25.5, 5, 0, false, 0, '{"ra": 45.5, "dec": -12.5}'),
  ('GJ1128', 'GJ 1128', 'M4V', 34.2, 5, 0, false, 0, '{"ra": 278.5, "dec": 35.2}'),
  ('GLIESE392', 'Gliese 392', 'M2V', 22.5, 5, 0, false, 0, '{"ra": 152.5, "dec": 3.5}'),
  ('GJ3021', 'GJ 3021', 'G6V', 57, 5, 1, false, 0, '{"ra": 12.5, "dec": -79.6}'),
  ('HD69830', 'HD 69830', 'K0V', 41, 7, 3, true, 0, '{"ra": 125.5, "dec": -12.6}'),
  ('UPSILON_ANDROMEDAE', 'Upsilon Andromedae', 'F8V', 44, 3, 4, true, 0, '{"ra": 24.2, "dec": 41.4}'),
  ('TAU_BOOTIS', 'Tau Boötis', 'F7V', 51, 2, 1, false, 0, '{"ra": 218, "dec": 17.5}'),
  ('HD209458', 'HD 209458', 'G0V', 159, 4, 1, false, 0, '{"ra": 331.5, "dec": 18.9}'),
  ('HD147506', 'HAT-P-2', 'F8V', 419, 2, 1, false, 0, '{"ra": 242.5, "dec": 41}'),
  ('KEPLER186', 'Kepler-186', 'M1V', 582, 4, 5, true, 0, '{"ra": 299.5, "dec": 43.9}'),
  ('KEPLER442', 'Kepler-442', 'K5V', 1206, 3, 1, true, 0, '{"ra": 290.5, "dec": 39.9}'),
  ('KEPLER438', 'Kepler-438', 'M1V', 640, 4, 1, true, 0, '{"ra": 278.5, "dec": 41.9}')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  spectral_type = EXCLUDED.spectral_type,
  distance = EXCLUDED.distance,
  age = EXCLUDED.age,
  planets = EXCLUDED.planets,
  habitable_zone = EXCLUDED.habitable_zone,
  anomaly_level = EXCLUDED.anomaly_level,
  coordinates = EXCLUDED.coordinates;

-- Objets des systèmes (étoiles + planètes)
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('LALANDE21185', 'STAR', 'a', 'Lalande 21185', 0, 'M2V', 'CALM', 0.46);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LALANDE21185', 'PLANET', 'b', 'Lalande 21185 b', 1, 12.94, 2.69, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LALANDE21185', 'PLANET', 'c', 'Lalande 21185 c', 2, 2946, 13.6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE887', 'STAR', 'a', 'Gliese 887', 0, 'M1.5V', 'CALM', 0.49);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE887', 'PLANET', 'b', 'Gliese 887 b', 1, 9.26, 3.9, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE887', 'PLANET', 'c', 'Gliese 887 c', 2, 21.78, 6.5, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE887', 'PLANET', 'd', 'Gliese 887 d', 3, 50.77, 6.1, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ1061', 'STAR', 'a', 'GJ 1061', 0, 'M5.5V', 'CALM', 0.11);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1061', 'PLANET', 'b', 'GJ 1061 b', 1, 3.2, 1.37, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1061', 'PLANET', 'c', 'GJ 1061 c', 2, 6.69, 1.74, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1061', 'PLANET', 'd', 'GJ 1061 d', 3, 13.03, 1.64, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GROOMBRIDGE34', 'STAR', 'a', 'Groombridge 34', 0, 'M1.5V', 'CALM', 0.38);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GROOMBRIDGE34', 'PLANET', 'b', 'Groombridge 34 b', 1, 11.44, 3.03, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GROOMBRIDGE34', 'PLANET', 'c', 'Groombridge 34 c', 2, 7600, 36, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('EPSILON_INDI', 'STAR', 'a', 'Epsilon Indi', 0, 'K5V', NULL, 0.76);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('EPSILON_INDI', 'PLANET', 'b', 'Epsilon Indi b', 1, 63400, 2005, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('YZ_CETI', 'STAR', 'a', 'YZ Ceti', 0, 'M4V', 'CALM', 0.13);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('YZ_CETI', 'PLANET', 'b', 'YZ Ceti b', 1, 2.02, 0.7, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('YZ_CETI', 'PLANET', 'c', 'YZ Ceti c', 2, 3.06, 1.14, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('YZ_CETI', 'PLANET', 'd', 'YZ Ceti d', 3, 4.66, 1.09, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('LUYTEN_STAR', 'STAR', 'a', 'Étoile de Luyten', 0, 'M3.5V', 'CALM', 0.29);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LUYTEN_STAR', 'PLANET', 'b', 'Luyten b', 1, 18.65, 2.89, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LUYTEN_STAR', 'PLANET', 'c', 'Luyten c', 2, 4.72, 1.18, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('TEEGARDEN', 'STAR', 'a', 'Étoile de Teegarden', 0, 'M7V', 'CALM', 0.08);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TEEGARDEN', 'PLANET', 'b', 'Teegarden b', 1, 4.91, 1.16, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TEEGARDEN', 'PLANET', 'c', 'Teegarden c', 2, 11.42, 1.05, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TEEGARDEN', 'PLANET', 'd', 'Teegarden d', 3, 26.13, 0.82, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('WOLF1061', 'STAR', 'a', 'Wolf 1061', 0, 'M3V', 'CALM', 0.25);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('WOLF1061', 'PLANET', 'b', 'Wolf 1061 b', 1, 4.89, 1.91, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('WOLF1061', 'PLANET', 'c', 'Wolf 1061 c', 2, 17.87, 3.41, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('WOLF1061', 'PLANET', 'd', 'Wolf 1061 d', 3, 217, 7.7, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE876', 'STAR', 'a', 'Gliese 876', 0, 'M4V', 'CALM', 0.33);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE876', 'PLANET', 'b', 'Gliese 876 b', 1, 61.1, 749, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE876', 'PLANET', 'c', 'Gliese 876 c', 2, 30.1, 235, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE876', 'PLANET', 'd', 'Gliese 876 d', 3, 1.94, 6.68, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE876', 'PLANET', 'e', 'Gliese 876 e', 4, 123.6, 16, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ1002', 'STAR', 'a', 'GJ 1002', 0, 'M5.5V', 'CALM', 0.12);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1002', 'PLANET', 'b', 'GJ 1002 b', 1, 10.35, 1.08, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1002', 'PLANET', 'c', 'GJ 1002 c', 2, 21.2, 1.36, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE832', 'STAR', 'a', 'Gliese 832', 0, 'M2V', 'CALM', 0.45);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE832', 'PLANET', 'b', 'Gliese 832 b', 1, 3853, 315, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE674', 'STAR', 'a', 'Gliese 674', 0, 'M3V', 'CALM', 0.35);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE674', 'PLANET', 'b', 'Gliese 674 b', 1, 4.69, 11.1, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE687', 'STAR', 'a', 'Gliese 687', 0, 'M3V', 'CALM', 0.41);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE687', 'PLANET', 'b', 'Gliese 687 b', 1, 38.14, 17.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE687', 'PLANET', 'c', 'Gliese 687 c', 2, 728, 16, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ3323', 'STAR', 'a', 'GJ 3323', 0, 'M4V', 'CALM', 0.16);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ3323', 'PLANET', 'b', 'GJ 3323 b', 1, 5.36, 2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ3323', 'PLANET', 'c', 'GJ 3323 c', 2, 40.5, 2.3, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE251', 'STAR', 'a', 'Gliese 251', 0, 'M3V', 'CALM', 0.37);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE251', 'PLANET', 'b', 'Gliese 251 b', 1, 14.24, 3.85, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE251', 'PLANET', 'c', 'Gliese 251 c', 2, 53.65, 3.84, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('82_ERIDANI', 'STAR', 'a', '82 G. Eridani', 0, 'G6V', NULL, 0.79);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('82_ERIDANI', 'PLANET', 'b', '82 Eridani b', 1, 18.3, 2.15, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('82_ERIDANI', 'PLANET', 'c', '82 Eridani c', 2, 89.7, 2.98, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('82_ERIDANI', 'PLANET', 'd', '82 Eridani d', 3, 648, 5.82, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE581', 'STAR', 'a', 'Gliese 581', 0, 'M3V', 'ACTIVE', 0.3);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE581', 'PLANET', 'b', 'Gliese 581 b', 1, 5.37, 20.5, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE581', 'PLANET', 'c', 'Gliese 581 c', 2, 12.9, 6.8, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE581', 'PLANET', 'e', 'Gliese 581 e', 3, 3.15, 2.5, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HD219134', 'STAR', 'a', 'HD 219134', 0, 'K3V', NULL, 0.78);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD219134', 'PLANET', 'b', 'HD 219134 b', 1, 3.09, 4.7, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD219134', 'PLANET', 'c', 'HD 219134 c', 2, 6.77, 4.4, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD219134', 'PLANET', 'f', 'HD 219134 f', 3, 22.7, 7.3, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD219134', 'PLANET', 'd', 'HD 219134 d', 4, 46.9, 16, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE625', 'STAR', 'a', 'Gliese 625', 0, 'M2V', 'CALM', 0.3);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE625', 'PLANET', 'b', 'Gliese 625 b', 1, 14.6, 2.8, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('LTT1445', 'STAR', 'a', 'LTT 1445', 0, 'M3V', 'CALM', 0.26);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LTT1445', 'PLANET', 'b', 'LTT 1445 b', 1, 5.36, 2.87, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LTT1445', 'PLANET', 'c', 'LTT 1445 c', 2, 3.12, 1.54, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE393', 'STAR', 'a', 'Gliese 393', 0, 'M2.5V', 'CALM', 0.41);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE393', 'PLANET', 'b', 'Gliese 393 b', 1, 7.03, 1.71, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('61_VIRGINIS', 'STAR', 'a', '61 Virginis', 0, 'G5V', NULL, 0.95);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('61_VIRGINIS', 'PLANET', 'b', '61 Virginis b', 1, 4.22, 6.1, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('61_VIRGINIS', 'PLANET', 'c', '61 Virginis c', 2, 38.1, 17.9, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('61_VIRGINIS', 'PLANET', 'd', '61 Virginis d', 3, 123, 10.5, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE785', 'STAR', 'a', 'Gliese 785', 0, 'K2V', NULL, 0.78);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE785', 'PLANET', 'b', 'Gliese 785 b', 1, 75, 17, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE785', 'PLANET', 'c', 'Gliese 785 c', 2, 530, 24, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE433', 'STAR', 'a', 'Gliese 433', 0, 'M2V', 'CALM', 0.48);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE433', 'PLANET', 'b', 'Gliese 433 b', 1, 7.37, 6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE433', 'PLANET', 'd', 'Gliese 433 d', 2, 36.1, 5.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE433', 'PLANET', 'c', 'Gliese 433 c', 3, 5090, 32, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE357', 'STAR', 'a', 'Gliese 357', 0, 'M2.5V', 'CALM', 0.34);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE357', 'PLANET', 'b', 'Gliese 357 b', 1, 3.93, 6.1, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE357', 'PLANET', 'c', 'Gliese 357 c', 2, 9.13, 3.6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE357', 'PLANET', 'd', 'Gliese 357 d', 3, 55.7, 7.7, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE367', 'STAR', 'a', 'Gliese 367', 0, 'M1V', 'CALM', 0.45);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE367', 'PLANET', 'b', 'Gliese 367 b', 1, 0.32, 0.63, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE367', 'PLANET', 'c', 'Gliese 367 c', 2, 11.5, 4.1, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE367', 'PLANET', 'd', 'Gliese 367 d', 3, 34.4, 6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('WOLF1069', 'STAR', 'a', 'Wolf 1069', 0, 'M5V', 'CALM', 0.17);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('WOLF1069', 'PLANET', 'b', 'Wolf 1069 b', 1, 15.56, 1.26, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('AU_MICROSCOPII', 'STAR', 'a', 'AU Microscopii', 0, 'M1V', 'ACTIVE', 0.5);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('AU_MICROSCOPII', 'PLANET', 'b', 'AU Mic b', 1, 8.46, 6.3, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('AU_MICROSCOPII', 'PLANET', 'c', 'AU Mic c', 2, 18.86, 11.3, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE436', 'STAR', 'a', 'Gliese 436', 0, 'M2.5V', 'CALM', 0.41);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE436', 'PLANET', 'b', 'Gliese 436 b', 1, 2.64, 21.4, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HD260655', 'STAR', 'a', 'HD 260655', 0, 'M0V', 'CALM', 0.44);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD260655', 'PLANET', 'b', 'HD 260655 b', 1, 2.78, 2.14, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD260655', 'PLANET', 'c', 'HD 260655 c', 2, 5.71, 3.09, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('TRAPPIST1', 'STAR', 'a', 'TRAPPIST-1', 0, 'M8V', 'ACTIVE', 0.09);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TRAPPIST1', 'PLANET', 'b', 'TRAPPIST-1 b', 1, 1.51, 1.02, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TRAPPIST1', 'PLANET', 'c', 'TRAPPIST-1 c', 2, 2.42, 1.16, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TRAPPIST1', 'PLANET', 'd', 'TRAPPIST-1 d', 3, 4.05, 0.3, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TRAPPIST1', 'PLANET', 'e', 'TRAPPIST-1 e', 4, 6.1, 0.62, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TRAPPIST1', 'PLANET', 'f', 'TRAPPIST-1 f', 5, 9.21, 0.68, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TRAPPIST1', 'PLANET', 'g', 'TRAPPIST-1 g', 6, 12.35, 1.34, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TRAPPIST1', 'PLANET', 'h', 'TRAPPIST-1 h', 7, 18.77, 0.33, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('55_CANCRI', 'STAR', 'a', '55 Cancri', 0, 'G8V', NULL, 0.91);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('55_CANCRI', 'PLANET', 'e', '55 Cancri e', 1, 0.74, 8.6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('55_CANCRI', 'PLANET', 'b', '55 Cancri b', 2, 14.7, 265, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('55_CANCRI', 'PLANET', 'c', '55 Cancri c', 3, 44.4, 54, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('55_CANCRI', 'PLANET', 'f', '55 Cancri f', 4, 260, 46, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('55_CANCRI', 'PLANET', 'd', '55 Cancri d', 5, 5218, 1140, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HD40307', 'STAR', 'a', 'HD 40307', 0, 'K2.5V', NULL, 0.77);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD40307', 'PLANET', 'b', 'HD 40307 b', 1, 4.31, 4.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD40307', 'PLANET', 'c', 'HD 40307 c', 2, 9.62, 6.9, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD40307', 'PLANET', 'd', 'HD 40307 d', 3, 20.4, 9.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD40307', 'PLANET', 'e', 'HD 40307 e', 4, 34.6, 4.6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD40307', 'PLANET', 'f', 'HD 40307 f', 5, 51.6, 6.9, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD40307', 'PLANET', 'g', 'HD 40307 g', 6, 197.8, 7.1, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HD189733', 'STAR', 'a', 'HD 189733', 0, 'K2V', NULL, 0.82);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD189733', 'PLANET', 'b', 'HD 189733 b', 1, 2.22, 356, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('KEPLER90', 'STAR', 'a', 'Kepler-90', 0, 'G0V', NULL, 1.13);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER90', 'PLANET', 'b', 'Kepler-90 b', 1, 7.05, 2.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER90', 'PLANET', 'c', 'Kepler-90 c', 2, 8.72, 1.7, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER90', 'PLANET', 'i', 'Kepler-90 i', 3, 14.45, 2.5, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER90', 'PLANET', 'd', 'Kepler-90 d', 4, 59.7, 3, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER90', 'PLANET', 'e', 'Kepler-90 e', 5, 91.9, 2.7, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER90', 'PLANET', 'f', 'Kepler-90 f', 6, 124.9, 2.9, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER90', 'PLANET', 'g', 'Kepler-90 g', 7, 210.6, 254, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER90', 'PLANET', 'h', 'Kepler-90 h', 8, 331.6, 330, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('KEPLER452', 'STAR', 'a', 'Kepler-452', 0, 'G2V', NULL, 1.04);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER452', 'PLANET', 'b', 'Kepler-452 b', 1, 384.8, 5, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE176', 'STAR', 'a', 'Gliese 176', 0, 'M2.5V', 'CALM', 0.45);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE176', 'PLANET', 'b', 'Gliese 176 b', 1, 8.77, 8, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE514', 'STAR', 'a', 'Gliese 514', 0, 'M1V', 'CALM', 0.53);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE514', 'PLANET', 'b', 'Gliese 514 b', 1, 140, 5.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE486', 'STAR', 'a', 'Gliese 486', 0, 'M3.5V', 'CALM', 0.32);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE486', 'PLANET', 'b', 'Gliese 486 b', 1, 1.47, 2.8, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE686', 'STAR', 'a', 'Gliese 686', 0, 'M1.5V', 'CALM', 0.42);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE686', 'PLANET', 'b', 'Gliese 686 b', 1, 15.5, 7.1, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HN_LIBRAE', 'STAR', 'a', 'HN Librae', 0, 'M3V', 'CALM', 0.29);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HN_LIBRAE', 'PLANET', 'b', 'HN Librae b', 1, 36.1, 5.5, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE849', 'STAR', 'a', 'Gliese 849', 0, 'M3.5V', 'CALM', 0.49);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE849', 'PLANET', 'b', 'Gliese 849 b', 1, 1910, 270, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE849', 'PLANET', 'c', 'Gliese 849 c', 2, 5520, 300, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE752', 'STAR', 'a', 'Gliese 752 A', 0, 'M2.5V', 'CALM', 0.46);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE752', 'PLANET', 'b', 'Gliese 752 b', 1, 106, 12.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ3988', 'STAR', 'a', 'GJ 3988', 0, 'M5V', 'CALM', 0.18);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ3988', 'PLANET', 'b', 'GJ 3988 b', 1, 6.94, 3.7, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE49', 'STAR', 'a', 'Gliese 49', 0, 'K7V', NULL, 0.57);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE49', 'PLANET', 'b', 'Gliese 49 b', 1, 17.3, 16.4, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ1151', 'STAR', 'a', 'GJ 1151', 0, 'M4.5V', 'CALM', 0.16);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1151', 'PLANET', 'c', 'GJ 1151 c', 1, 390, 10.6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ1289', 'STAR', 'a', 'GJ 1289', 0, 'M4V', 'CALM', 0.21);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1289', 'PLANET', 'b', 'GJ 1289 b', 1, 112, 6.3, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('TZ_ARietis', 'STAR', 'a', 'TZ Arietis', 0, 'M4.5V', 'CALM', 0.14);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TZ_ARietis', 'PLANET', 'b', 'TZ Arietis b', 1, 771, 67, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('EQ_PEGASI', 'STAR', 'a', 'EQ Pegasi A', 0, 'M3.5V', 'CALM', 0.44);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('EQ_PEGASI', 'PLANET', 'b', 'EQ Pegasi b', 1, 284, 718, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE338', 'STAR', 'a', 'Gliese 338 B', 0, 'M0V', 'CALM', 0.64);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE338', 'PLANET', 'b', 'Gliese 338 B b', 1, 24.5, 10.3, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE725A', 'STAR', 'a', 'Gliese 725 A', 0, 'M3V', 'CALM', 0.33);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GLIESE725A', 'PLANET', 'b', 'Gliese 725 A b', 1, 11.22, 2.78, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ3512', 'STAR', 'a', 'GJ 3512', 0, 'M5.5V', 'ACTIVE', 0.12);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ3512', 'PLANET', 'b', 'GJ 3512 b', 1, 204, 147, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ3512', 'PLANET', 'c', 'GJ 3512 c', 2, 2350, 143, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('WOLF359', 'STAR', 'a', 'Wolf 359', 0, 'M6V', 'CALM', 0.09);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('LACAILLE9352', 'STAR', 'a', 'Lacaille 9352', 0, 'M0.5V', 'CALM', 0.5);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LACAILLE9352', 'PLANET', 'b', 'Lacaille 9352 b', 1, 9.26, 4.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LACAILLE9352', 'PLANET', 'c', 'Lacaille 9352 c', 2, 21.8, 7.6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('LHS288', 'STAR', 'a', 'LHS 288', 0, 'M5V', 'CALM', 0.11);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE205', 'STAR', 'a', 'Gliese 205', 0, 'M1.5V', 'CALM', 0.63);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE229', 'STAR', 'a', 'Gliese 229', 0, 'M1V', 'CALM', 0.58);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('40_ERIDANI', 'STAR', 'a', '40 Eridani', 0, 'K1V', NULL, 0.78);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('VAN_MAANEN2', 'STAR', 'a', 'Van Maanen 2', 0, 'DZ7', NULL, 0.68);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ4026', 'STAR', 'a', 'GJ 4026', 0, 'M4V', 'CALM', 0.22);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE526', 'STAR', 'a', 'Gliese 526', 0, 'M1V', 'CALM', 0.48);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE754', 'STAR', 'a', 'Gliese 754', 0, 'M4.5V', 'CALM', 0.18);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('K2_18', 'STAR', 'a', 'K2-18', 0, 'M2.5V', 'CALM', 0.36);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('K2_18', 'PLANET', 'b', 'K2-18 b', 1, 32.9, 8.6, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('TOI700', 'STAR', 'a', 'TOI-700', 0, 'M2V', 'CALM', 0.42);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TOI700', 'PLANET', 'b', 'TOI-700 b', 1, 9.98, 1, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TOI700', 'PLANET', 'c', 'TOI-700 c', 2, 16.05, 2.6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TOI700', 'PLANET', 'd', 'TOI-700 d', 3, 37.4, 1.7, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TOI700', 'PLANET', 'e', 'TOI-700 e', 4, 27.8, 0.95, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ1214', 'STAR', 'a', 'Gliese 1214', 0, 'M4.5V', 'CALM', 0.16);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1214', 'PLANET', 'b', 'GJ 1214 b', 1, 1.58, 6.3, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ1132', 'STAR', 'a', 'Gliese 1132', 0, 'M4V', 'CALM', 0.18);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1132', 'PLANET', 'b', 'GJ 1132 b', 1, 1.63, 1.66, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ1132', 'PLANET', 'c', 'GJ 1132 c', 2, 8.93, 2.6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('K2_72', 'STAR', 'a', 'K2-72', 0, 'M2V', 'CALM', 0.27);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('K2_72', 'PLANET', 'b', 'K2-72 b', 1, 5.58, 2.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('K2_72', 'PLANET', 'c', 'K2-72 c', 2, 15.2, 1.8, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('K2_72', 'PLANET', 'd', 'K2-72 d', 3, 24.2, 2.1, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('K2_72', 'PLANET', 'e', 'K2-72 e', 4, 7, 2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('LHS3844', 'STAR', 'a', 'LHS 3844', 0, 'M5V', 'CALM', 0.15);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LHS3844', 'PLANET', 'b', 'LHS 3844 b', 1, 0.46, 2.3, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HD97658', 'STAR', 'a', 'HD 97658', 0, 'K1V', NULL, 0.85);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD97658', 'PLANET', 'b', 'HD 97658 b', 1, 9.5, 7.6, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HD85512', 'STAR', 'a', 'HD 85512', 0, 'K5V', NULL, 0.69);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD85512', 'PLANET', 'b', 'HD 85512 b', 1, 58.4, 3.6, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('LHS1140', 'STAR', 'a', 'LHS 1140', 0, 'M4.5V', 'CALM', 0.18);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LHS1140', 'PLANET', 'b', 'LHS 1140 b', 1, 24.7, 6.4, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('LHS1140', 'PLANET', 'c', 'LHS 1140 c', 2, 3.78, 1.8, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('WOLF424', 'STAR', 'a', 'Wolf 424', 0, 'M5.5V', 'CALM', 0.14);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ412', 'STAR', 'a', 'GJ 412', 0, 'M1V', 'CALM', 0.48);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE445', 'STAR', 'a', 'Gliese 445', 0, 'M3.5V', 'CALM', 0.27);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE83', 'STAR', 'a', 'Gliese 83.1', 0, 'M4.5V', 'CALM', 0.18);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ1245', 'STAR', 'a', 'GJ 1245', 0, 'M5.5V', 'CALM', 0.12);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ1068', 'STAR', 'a', 'GJ 1068', 0, 'M4V', 'CALM', 0.2);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ1128', 'STAR', 'a', 'GJ 1128', 0, 'M4V', 'CALM', 0.21);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GLIESE392', 'STAR', 'a', 'Gliese 392', 0, 'M2V', 'CALM', 0.42);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('GJ3021', 'STAR', 'a', 'GJ 3021', 0, 'G6V', NULL, 0.9);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('GJ3021', 'PLANET', 'b', 'GJ 3021 b', 1, 133.7, 1100, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HD69830', 'STAR', 'a', 'HD 69830', 0, 'K0V', NULL, 0.86);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD69830', 'PLANET', 'b', 'HD 69830 b', 1, 8.67, 10.2, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD69830', 'PLANET', 'c', 'HD 69830 c', 2, 31.6, 11.8, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD69830', 'PLANET', 'd', 'HD 69830 d', 3, 197, 18.1, true, 'INTERNAL');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('UPSILON_ANDROMEDAE', 'STAR', 'a', 'Upsilon Andromedae', 0, 'F8V', NULL, 1.27);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('UPSILON_ANDROMEDAE', 'PLANET', 'b', 'Upsilon And b', 1, 4.62, 240, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('UPSILON_ANDROMEDAE', 'PLANET', 'c', 'Upsilon And c', 2, 241.3, 600, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('UPSILON_ANDROMEDAE', 'PLANET', 'd', 'Upsilon And d', 3, 1284, 1055, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('UPSILON_ANDROMEDAE', 'PLANET', 'e', 'Upsilon And e', 4, 3848, 1320, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('TAU_BOOTIS', 'STAR', 'a', 'Tau Boötis', 0, 'F7V', NULL, 1.34);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('TAU_BOOTIS', 'PLANET', 'b', 'Tau Boötis b', 1, 3.31, 1160, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HD209458', 'STAR', 'a', 'HD 209458', 0, 'G0V', NULL, 1.15);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD209458', 'PLANET', 'b', 'HD 209458 b', 1, 3.52, 220, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('HD147506', 'STAR', 'a', 'HAT-P-2', 0, 'F8V', NULL, 1.36);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('HD147506', 'PLANET', 'b', 'HAT-P-2 b', 1, 5.63, 2700, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('KEPLER186', 'STAR', 'a', 'Kepler-186', 0, 'M1V', 'CALM', 0.48);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER186', 'PLANET', 'b', 'Kepler-186 b', 1, 3.89, 1.9, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER186', 'PLANET', 'c', 'Kepler-186 c', 2, 7.27, 2.4, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER186', 'PLANET', 'd', 'Kepler-186 d', 3, 13.3, 2.1, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER186', 'PLANET', 'e', 'Kepler-186 e', 4, 22.4, 1.5, false, NULL);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER186', 'PLANET', 'f', 'Kepler-186 f', 5, 129.9, 1.4, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('KEPLER442', 'STAR', 'a', 'Kepler-442', 0, 'K5V', NULL, 0.61);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER442', 'PLANET', 'b', 'Kepler-442 b', 1, 112.3, 2.3, true, 'TEMPERATE');
INSERT INTO system_objects (system_id, type, designation, name, sort_order, spectral_type, stellar_activity, mass_stellar) VALUES ('KEPLER438', 'STAR', 'a', 'Kepler-438', 0, 'M1V', 'CALM', 0.54);
INSERT INTO system_objects (system_id, type, designation, name, sort_order, orbital_period_days, mass_earth, in_habitable_zone, habitable_zone_type) VALUES ('KEPLER438', 'PLANET', 'b', 'Kepler-438 b', 1, 35.2, 1.5, true, 'TEMPERATE');

