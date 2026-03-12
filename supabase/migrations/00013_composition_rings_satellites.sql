-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Composition des planètes, anneaux, satellites
-- Mars 2026 — TERESTRIAL/GAS_GIANT/ICE_GIANT, anneaux planétaires, support lunes
-- ═══════════════════════════════════════════════════════════════════════════════

-- Type de composition (planètes, lunes)
CREATE TYPE composition_type AS ENUM ('TERESTRIAL', 'GAS_GIANT', 'ICE_GIANT', 'ICY');

COMMENT ON TYPE composition_type IS 'TERESTRIAL=rocheuse, GAS_GIANT=gazeuse, ICE_GIANT=géante de glace, ICY=lune/corps glacé';

-- Composition des planètes/lunes
ALTER TABLE system_objects ADD COLUMN IF NOT EXISTS composition composition_type;

-- Anneaux (planètes : Jupiter, Saturne, Uranus, Neptune)
ALTER TABLE system_objects ADD COLUMN IF NOT EXISTS has_rings BOOLEAN DEFAULT false;
ALTER TABLE system_objects ADD COLUMN IF NOT EXISTS rings_inner_radius_km DECIMAL;
ALTER TABLE system_objects ADD COLUMN IF NOT EXISTS rings_outer_radius_km DECIMAL;
ALTER TABLE system_objects ADD COLUMN IF NOT EXISTS rings_notes TEXT;

COMMENT ON COLUMN system_objects.composition IS 'Type physique : rocheuse, gazeuse, géante de glace, glacé (lunes)';
COMMENT ON COLUMN system_objects.has_rings IS 'Présence d''anneaux planétaires';
COMMENT ON COLUMN system_objects.rings_inner_radius_km IS 'Rayon interne des anneaux (km, centre planète)';
COMMENT ON COLUMN system_objects.rings_outer_radius_km IS 'Rayon externe des anneaux (km)';

-- Distance orbitale en km pour les lunes (optionnel, plus lisible que AU pour satellites)
ALTER TABLE system_objects ADD COLUMN IF NOT EXISTS orbital_semi_major_axis_km DECIMAL;

COMMENT ON COLUMN system_objects.orbital_semi_major_axis_km IS 'Demi-grand axe en km (lunes : distance au corps parent)';
