-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Naines brunes (IR-only) + nuages de gaz / nébuleuses (formes)
-- Réf. LACUNA_TRACES, données scientifiques réelles
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Étendre spectral_type_to_absolute_magnitude pour L, T, Y ──
-- En visible : M_abs ~ 22+ (invisibles). En IR (bande J) : ~14–18
CREATE OR REPLACE FUNCTION spectral_type_to_absolute_magnitude(st TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  letter TEXT;
  subtype NUMERIC;
  m0 NUMERIC;
  m5 NUMERIC;
  m9 NUMERIC;
BEGIN
  IF st IS NULL OR st = '' OR st ~ '^[Pp]ulsar|^[Nn]eutron|PSR' THEN
    RETURN 24;  -- pulsars invisibles en optique
  END IF;

  letter := UPPER(SUBSTRING(st FROM 1 FOR 1));

  -- Naines brunes L, T, Y : invisibles en visible (M_V ~ 20+), visibles en IR
  IF letter IN ('L', 'T', 'Y') THEN
    subtype := COALESCE(
      (regexp_match(st, '^[LTY]([0-9.]+)'))[1]::numeric,
      5
    );
    subtype := GREATEST(0, LEAST(9, subtype));
    -- M_V : L0 ~ 18, L5 ~ 20, T0 ~ 22, T5 ~ 24, Y0 ~ 26
    CASE letter
      WHEN 'L' THEN RETURN 18 + subtype * 0.4;
      WHEN 'T' THEN RETURN 22 + subtype * 0.4;
      WHEN 'Y' THEN RETURN 26 + subtype * 0.4;
      ELSE RETURN 22;
    END CASE;
  END IF;

  subtype := COALESCE(
    (regexp_match(st, '^[OBAGKMF]([0-9.]+)'))[1]::numeric,
    5
  );
  subtype := GREATEST(0, LEAST(9, subtype));

  CASE letter
    WHEN 'O' THEN m0 := -5.2; m5 := -5.8; m9 := -6.0;
    WHEN 'B' THEN m0 := -4.1; m5 := -1.1; m9 := 0.5;
    WHEN 'A' THEN m0 := 0.7;  m5 := 2.0;  m9 := 2.8;
    WHEN 'F' THEN m0 := 2.6;  m5 := 3.4;  m9 := 4.0;
    WHEN 'G' THEN m0 := 4.4;  m5 := 5.1;  m9 := 5.7;
    WHEN 'K' THEN m0 := 5.9;  m5 := 7.3;  m9 := 8.5;
    WHEN 'M' THEN m0 := 9.0;  m5 := 12.0; m9 := 16.0;
    ELSE RETURN 15;
  END CASE;

  IF subtype <= 5 THEN
    RETURN m0 + (m5 - m0) * (subtype / 5);
  ELSE
    RETURN m5 + (m9 - m5) * ((subtype - 5) / 4);
  END IF;
END;
$$;

-- ── 2. Table nebulas (nuages de gaz — formes étendues, visibles en IR) ──
CREATE TABLE nebulas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  designation TEXT,
  distance DECIMAL,
  coordinates JSONB NOT NULL,
  -- shape: ELLIPSE (semi_major_arcmin, semi_minor_arcmin, position_angle_deg)
  -- ou POLYGON (vertices: [{dra_arcmin, ddec_arcmin}...] relatif au centre)
  shape_type TEXT NOT NULL DEFAULT 'ELLIPSE' CHECK (shape_type IN ('ELLIPSE', 'POLYGON')),
  shape_params JSONB NOT NULL,
  -- visible uniquement en IR (pas en optique)
  ir_only BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nebulas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read nebulas" ON nebulas FOR SELECT USING (true);

COMMENT ON TABLE nebulas IS 'Nuages de gaz, nébuleuses — objets étendus visibles principalement en infrarouge. Formes : ellipse ou polygone.';

-- ── 3. Seed nébuleuses (IR-only) ──
-- shape_params ELLIPSE : { semi_major_arcmin, semi_minor_arcmin, position_angle_deg }
INSERT INTO nebulas (id, name, designation, distance, coordinates, shape_type, shape_params, ir_only)
VALUES
  ('BARNARDS_LOOP', 'Boucle de Barnard', 'Sh 2-276', 518, '{"ra": 81.9, "dec": -4.0}', 'ELLIPSE', '{"semi_major_arcmin": 300, "semi_minor_arcmin": 180, "position_angle_deg": 45}', true),
  ('ORION_NEBULA', 'Nébuleuse d''Orion', 'M42', 1344, '{"ra": 83.82, "dec": -5.39}', 'ELLIPSE', '{"semi_major_arcmin": 33, "semi_minor_arcmin": 28, "position_angle_deg": 0}', true),
  ('HORSEHEAD', 'Tête de Cheval', 'Barnard 33', 1375, '{"ra": 85.19, "dec": -2.47}', 'ELLIPSE', '{"semi_major_arcmin": 8, "semi_minor_arcmin": 6, "position_angle_deg": 0}', true),
  ('ROSETTE', 'Nébuleuse de la Rosette', 'NGC 2237', 5200, '{"ra": 98.0, "dec": 5.0}', 'ELLIPSE', '{"semi_major_arcmin": 80, "semi_minor_arcmin": 60, "position_angle_deg": 0}', true);
