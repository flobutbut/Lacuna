-- ═══════════════════════════════════════════════════════════════════════════════
-- LACUNA — Filtre des systèmes visibles depuis un point (Observatoire)
-- Coordonnées : x,y,z en al (HYG) ou ra/dec (fallback legacy)
-- Magnitude : apparent_magnitude (HYG) ou M_abs + 5*log10(d/10) (fallback)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Magnitude absolue depuis spectral_type (séquence principale V) ──
-- Réf. Schmidt-Kaler, Pecaut & Mamajek ; fallback pour étoiles procédurales sans HYG
CREATE OR REPLACE FUNCTION spectral_type_to_absolute_magnitude(st TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  letter TEXT;
  subtype NUMERIC;
  m0 NUMERIC;  -- magnitude au sous-type 0
  m5 NUMERIC;  -- magnitude au sous-type 5
  m9 NUMERIC;  -- magnitude au sous-type 9
BEGIN
  IF st IS NULL OR st = '' OR st ~ '^[Pp]ulsar|^[Nn]eutron|PSR' THEN
    RETURN 24;  -- pulsars/néon invisibles en optique
  END IF;

  letter := UPPER(SUBSTRING(st FROM 1 FOR 1));
  BEGIN
    subtype := (regexp_match(st, '^[OBAGKMF]([0-9]+\.?[0-9]*)'))[1]::numeric;
  EXCEPTION WHEN OTHERS THEN
    subtype := 5;
  END;
  subtype := COALESCE(GREATEST(0, LEAST(9, subtype)), 5);

  -- Anchors par type (O5=-5.8, B0=-4.1…, M5=12, M8=16)
  CASE letter
    WHEN 'O' THEN m0 := -5.2; m5 := -5.8; m9 := -6.0;
    WHEN 'B' THEN m0 := -4.1; m5 := -1.1; m9 := 0.5;
    WHEN 'A' THEN m0 := 0.7;  m5 := 2.0;  m9 := 2.8;
    WHEN 'F' THEN m0 := 2.6;  m5 := 3.4;  m9 := 4.0;
    WHEN 'G' THEN m0 := 4.4;  m5 := 5.1;  m9 := 5.7;
    WHEN 'K' THEN m0 := 5.9;  m5 := 7.3;  m9 := 8.5;
    WHEN 'M' THEN m0 := 9.0;  m5 := 12.0; m9 := 16.0;
    ELSE RETURN 15;  -- inconnu : très faible
  END CASE;

  -- Interpolation linéaire par segment (0->5, 5->9)
  IF subtype <= 5 THEN
    RETURN m0 + (m5 - m0) * (subtype / 5);
  ELSE
    RETURN m5 + (m9 - m5) * ((subtype - 5) / 4);
  END IF;
END;
$$;

COMMENT ON FUNCTION spectral_type_to_absolute_magnitude IS 'Magnitude absolue visuelle estimée depuis spectral_type (seq. principale). Pulsars/NULL→24. Fallback pour étoiles sans apparent_magnitude HYG.';

-- ── 2. RA, Dec, distance → coordonnées cartésiennes 3D (al, Sol à l''origine) ──
-- Utilisé en fallback pour données legacy (ra/dec) ; HYG utilise x,y,z directement
CREATE OR REPLACE FUNCTION ra_dec_distance_to_xyz(
  ra_deg NUMERIC,
  dec_deg NUMERIC,
  dist_ly NUMERIC
)
RETURNS TABLE(x NUMERIC, y NUMERIC, z NUMERIC)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    dist_ly * COS(RADIANS(dec_deg)) * COS(RADIANS(ra_deg)),
    dist_ly * COS(RADIANS(dec_deg)) * SIN(RADIANS(ra_deg)),
    dist_ly * SIN(RADIANS(dec_deg))
$$;

-- ── 3. Systèmes visibles depuis un système donné ──
-- Coordonnées : x,y,z (HYG, al) prioritaire ; ra/dec (legacy) en fallback
-- Magnitude : apparent_magnitude (HYG vue depuis Sol) si dispo ; sinon M_abs + 5*log10(d/10)
CREATE OR REPLACE FUNCTION get_visible_systems(
  p_viewer_system_id TEXT,
  p_magnitude_limit NUMERIC DEFAULT 18
)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  spectral_type TEXT,
  distance NUMERIC,
  age NUMERIC,
  planets INT,
  habitable_zone BOOLEAN,
  anomaly_level INT,
  coordinates JSONB,
  apparent_magnitude NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_x NUMERIC;
  v_y NUMERIC;
  v_z NUMERIC;
  r RECORD;
  t_x NUMERIC;
  t_y NUMERIC;
  t_z NUMERIC;
  d_3d NUMERIC;
  m_abs NUMERIC;
  m_app NUMERIC;
  m_calc NUMERIC;
  coord JSONB;
  v_dist NUMERIC;
BEGIN
  -- Position 3D du viewer : x,y,z (HYG) ou ra_dec_distance_to_xyz (legacy)
  SELECT COALESCE(ss.coordinates, '{}'::jsonb), COALESCE(ss.distance::numeric, 0)
  INTO coord, v_dist
  FROM stellar_systems ss
  WHERE ss.id = p_viewer_system_id;

  IF coord ? 'x' AND coord ? 'y' AND coord ? 'z' THEN
    v_x := COALESCE((coord->>'x')::numeric, 0);
    v_y := COALESCE((coord->>'y')::numeric, 0);
    v_z := COALESCE((coord->>'z')::numeric, 0);
  ELSE
    SELECT x, y, z INTO v_x, v_y, v_z
    FROM ra_dec_distance_to_xyz(
      COALESCE((coord->>'ra')::numeric, 0),
      COALESCE((coord->>'dec')::numeric, 0),
      COALESCE(v_dist, 0)
    )
    LIMIT 1;
    v_x := COALESCE(v_x, 0);
    v_y := COALESCE(v_y, 0);
    v_z := COALESCE(v_z, 0);
  END IF;

  FOR r IN
    SELECT ss.id, ss.name, ss.spectral_type, ss.distance, ss.age, ss.planets,
           ss.habitable_zone, ss.anomaly_level, ss.coordinates, ss.apparent_magnitude
    FROM stellar_systems ss
    WHERE ss.id != p_viewer_system_id
  LOOP
    -- Position 3D cible : x,y,z (HYG) ou ra_dec_distance_to_xyz (legacy)
    coord := COALESCE(r.coordinates, '{}'::jsonb);
    IF coord ? 'x' AND coord ? 'y' AND coord ? 'z' THEN
      t_x := COALESCE((coord->>'x')::numeric, 0);
      t_y := COALESCE((coord->>'y')::numeric, 0);
      t_z := COALESCE((coord->>'z')::numeric, 0);
    ELSE
      SELECT x, y, z INTO t_x, t_y, t_z
      FROM ra_dec_distance_to_xyz(
        COALESCE((coord->>'ra')::numeric, 0),
        COALESCE((coord->>'dec')::numeric, 0),
        COALESCE(r.distance::numeric, 0)
      )
      LIMIT 1;
      t_x := COALESCE(t_x, 0);
      t_y := COALESCE(t_y, 0);
      t_z := COALESCE(t_z, 0);
    END IF;

    -- Distance 3D en al : sqrt((x2-x1)² + (y2-y1)² + (z2-z1)²)
    d_3d := SQRT(POWER(t_x - v_x, 2) + POWER(t_y - v_y, 2) + POWER(t_z - v_z, 2));
    IF d_3d < 0.01 THEN
      CONTINUE;  -- éviter division / log proche de 0
    END IF;

    -- Magnitude apparente : HYG si dispo, sinon calcul depuis spectral_type (M_abs + 5*log10(d/10))
    m_calc := spectral_type_to_absolute_magnitude(r.spectral_type) + 5 * LOG(10, GREATEST(d_3d / 10, 0.001));
    m_app := COALESCE(r.apparent_magnitude, m_calc);

    IF m_app <= p_magnitude_limit THEN
      id := r.id;
      name := r.name;
      spectral_type := r.spectral_type;
      distance := r.distance;
      age := r.age;
      planets := r.planets;
      habitable_zone := r.habitable_zone;
      anomaly_level := r.anomaly_level;
      coordinates := r.coordinates;
      apparent_magnitude := ROUND(m_app::numeric, 2);
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION get_visible_systems IS 'Systèmes stellaires visibles depuis p_viewer_system_id. Coordonnées x,y,z (HYG) ou ra/dec (legacy). Magnitude : COALESCE(apparent_magnitude, M_abs+5*log10(d/10)). Défaut limite 18 (configurable selon zoom).';
