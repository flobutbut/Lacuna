-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Données composition et anneaux pour le système solaire
-- Mars 2026 — Réf. NASA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Planètes telluriques
UPDATE system_objects SET composition = 'TERESTRIAL' WHERE system_id = 'SOL' AND designation IN ('b', 'c', 'd', 'e');

-- Géantes gazeuses
UPDATE system_objects SET composition = 'GAS_GIANT' WHERE system_id = 'SOL' AND designation IN ('f', 'g');

-- Géantes de glace
UPDATE system_objects SET composition = 'ICE_GIANT' WHERE system_id = 'SOL' AND designation IN ('h', 'i');

-- Anneaux
UPDATE system_objects SET has_rings = true, rings_inner_radius_km = 92200, rings_outer_radius_km = 136200, rings_notes = 'Anneaux de Jupiter, ténus'
WHERE system_id = 'SOL' AND designation = 'f';

UPDATE system_objects SET has_rings = true, rings_inner_radius_km = 66900, rings_outer_radius_km = 480000, rings_notes = 'Anneaux de Saturne, système majeur'
WHERE system_id = 'SOL' AND designation = 'g';

UPDATE system_objects SET has_rings = true, rings_inner_radius_km = 38000, rings_outer_radius_km = 51140, rings_notes = 'Anneaux d''Uranus, 13 anneaux'
WHERE system_id = 'SOL' AND designation = 'h';

UPDATE system_objects SET has_rings = true, rings_inner_radius_km = 41000, rings_outer_radius_km = 63000, rings_notes = 'Anneaux de Neptune, 5 anneaux principaux'
WHERE system_id = 'SOL' AND designation = 'i';
