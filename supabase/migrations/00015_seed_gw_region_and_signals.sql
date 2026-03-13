-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Données GW (système + signaux gravitationnels)
-- À appliquer si le seed complet n'a pas été exécuté (ex. base distante)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Système stellar GW_REGION_A
INSERT INTO stellar_systems (id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level, coordinates)
VALUES ('GW_REGION_A', 'Région GW-2341-A', NULL, 130, NULL, 0, false, 2, '{"ra": 200, "dec": -35}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  coordinates = EXCLUDED.coordinates;

-- 2. Objet BNS (émetteur gravitationnel)
INSERT INTO system_objects (system_id, type, designation, name, sort_order, emits_signals, emission_support, emission_pattern, emission_frequency_hz, emission_direction, confirmation_status)
SELECT 'GW_REGION_A', 'NEUTRON_STAR', NULL, 'BNS GW-2341', 0, true, 'GRAVITATIONNEL', 'BURST', 0.02, 'omni', 'CONFIRMED'
WHERE NOT EXISTS (SELECT 1 FROM system_objects WHERE system_id = 'GW_REGION_A' AND emits_signals = true);

-- 3. Événement GW
INSERT INTO signal_events (system_id, event_type, observed_at, duration_sec, attributes)
SELECT 'GW_REGION_A', 'GW', NOW() - INTERVAL '8 hours', 16, '{"designation": "GW-2341-A", "chirp_mass_solar": 1.2, "distance_mpc": 130}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM signal_events WHERE system_id = 'GW_REGION_A' AND event_type = 'GW');

-- 4. Signaux seed-demo (GW EVENT + GW OBJECT) — seulement si pas déjà présents
INSERT INTO signals (source_type, source_object_id, source_event_id, session_id, ship_id, frequency_hz, support, duration_sec, attributes)
SELECT 'EVENT', NULL, se.id, 'seed-demo', '11111111-1111-1111-1111-111111111111', 100, 'GRAVITATIONNEL', 16,
  '{"azimuth": 200, "elevation": -35, "receivedAt": "2341-04-10", "polarization": "—", "structure": "sursaut", "sourceName": "GW-2341-A"}'::jsonb
FROM signal_events se
WHERE se.event_type = 'GW' AND se.system_id = 'GW_REGION_A'
  AND NOT EXISTS (SELECT 1 FROM signals WHERE session_id = 'seed-demo' AND support = 'GRAVITATIONNEL' AND source_type = 'EVENT');

INSERT INTO signals (source_type, source_object_id, source_event_id, session_id, ship_id, frequency_hz, support, duration_sec, attributes)
SELECT 'OBJECT', so.id, NULL, 'seed-demo', '11111111-1111-1111-1111-111111111111', 100, 'GRAVITATIONNEL', 16,
  '{"azimuth": 200, "elevation": -35, "receivedAt": "2341-04-10", "polarization": "—", "structure": "sursaut", "sourceName": "BNS GW-2341"}'::jsonb
FROM system_objects so
WHERE so.system_id = 'GW_REGION_A' AND so.emits_signals = true
  AND NOT EXISTS (SELECT 1 FROM signals WHERE session_id = 'seed-demo' AND support = 'GRAVITATIONNEL' AND source_type = 'OBJECT');
