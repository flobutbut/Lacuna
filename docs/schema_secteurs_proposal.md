# Proposition — Schéma table `sectors`

*Mars 2026 — Compatible schéma actuel Lacuna*

---

## 1. Table `sectors`

```sql
CREATE TABLE sectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  -- Définition spatiale : cône directionnel (ra/dec centre + rayon en degrés)
  -- Ex. WOW! : cone étroit ~0.1° ; GW LIGO : cone large 100+ deg²
  center_ra DECIMAL(8, 4) NOT NULL,      -- Ascension droite centre (0–360°)
  center_dec DECIMAL(8, 4) NOT NULL,     -- Déclinaison centre (-90 à 90°)
  radius_deg DECIMAL(6, 3) NOT NULL,     -- Rayon du cône en degrés (incertitude angulaire)
  -- Limites de distance optionnelles (en al) — pour signaux à distance inconnue
  distance_min_al DECIMAL(10, 2),
  distance_max_al DECIMAL(10, 2),
  -- Contexte galactique (optionnel, GDD : bras, bulbe, etc.)
  galaxy_region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sectors_coords ON sectors(center_ra, center_dec);
```

**Exemple de données :**

| id | name | center_ra | center_dec | radius_deg | distance_min_al | distance_max_al |
|----|------|-----------|------------|------------|-----------------|-----------------|
| SECTOR_WOW_1977 | Cône WOW! 1977 | 285.0 | -27.0 | 0.5 | 10 | 5000 |
| SECTOR_GRB_DEEP | Champ profond gamma | 120.0 | 15.0 | 15.0 | 1000 | 50000 |
| SECTOR_GW_2341 | Région GW-2341 | 200.0 | -35.0 | 25.0 | 100000 | 150000 |

---

## 2. Table de liaison `sector_systems`

Associe les systèmes stellaires aux secteurs dont ils font partie. Un système peut appartenir à plusieurs secteurs (ex. Proxima dans "Voisinage" et "Sagittarius lointain").

```sql
CREATE TABLE sector_systems (
  sector_id TEXT NOT NULL REFERENCES sectors(id) ON DELETE CASCADE,
  system_id TEXT NOT NULL REFERENCES stellar_systems(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (sector_id, system_id)
);

CREATE INDEX idx_sector_systems_sector ON sector_systems(sector_id);
CREATE INDEX idx_sector_systems_system ON sector_systems(system_id);
```

**Calcul des appartenances :** au seed ou à la génération procédurale, pour chaque secteur, insérer les `stellar_systems` dont `coordinates->>'ra'` et `coordinates->>'dec'` tombent dans le cône (distance angulaire ≤ radius_deg).

---

## 3. Modifications des tables existantes

### 3.1 `signals` — origine sectorielle

```sql
ALTER TABLE signals
  ADD COLUMN sector_id TEXT REFERENCES sectors(id) ON DELETE SET NULL;

-- source_type = 'UNKNOWN' → sector_id typiquement renseigné
-- source_type = 'OBJECT' | 'EVENT' → system_id connu via source
```

### 3.2 `observations` — observation sans système précis

```sql
ALTER TABLE observations
  ADD COLUMN sector_id TEXT REFERENCES sectors(id) ON DELETE SET NULL;

-- system_id NULL + sector_id renseigné = "signal du secteur X, système inconnu"
-- Ex. GRB-2341-X7 · Signal : system_id null, sector_id SECTOR_GRB_DEEP
```

### 3.3 `traces` — trace à origine sectorielle

```sql
ALTER TABLE traces
  ADD COLUMN sector_id TEXT REFERENCES sectors(id) ON DELETE SET NULL;

-- WOW! : system_id NULL, sector_id SECTOR_WOW_1977
-- PSR B1919+21 : system_id PSR_B1919 (connu), sector_id optionnel
```

---

## 4. RLS et policies

```sql
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sector_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sectors" ON sectors FOR SELECT USING (true);
CREATE POLICY "Public read sector_systems" ON sector_systems FOR SELECT USING (true);
```

---

## 5. Vue ou fonction utile

Récupérer les systèmes candidats pour un secteur :

```sql
-- Option A : via sector_systems (membre pré-calculé)
SELECT ss.system_id, ss.name
FROM sector_systems ss
JOIN stellar_systems s ON s.id = ss.system_id
WHERE ss.sector_id = 'SECTOR_WOW_1977';

-- Option B : fonction dynamique (si sector_systems non maintenu)
CREATE OR REPLACE FUNCTION get_systems_in_sector(p_sector_id TEXT)
RETURNS TABLE(system_id TEXT, name TEXT) AS $$
  SELECT s.id, s.name
  FROM stellar_systems s
  JOIN sectors sec ON sec.id = p_sector_id
  WHERE (
    (s.coordinates->>'ra')::decimal BETWEEN sec.center_ra - sec.radius_deg AND sec.center_ra + sec.radius_deg
    AND (s.coordinates->>'dec')::decimal BETWEEN sec.center_dec - sec.radius_deg AND sec.center_dec + sec.radius_deg
    -- Distance angulaire réelle (approximation petit angle) :
    AND SQRT(
      POWER(((s.coordinates->>'ra')::decimal - sec.center_ra) * COS(RADIANS(sec.center_dec)), 2) +
      POWER((s.coordinates->>'dec')::decimal - sec.center_dec, 2)
    ) <= sec.radius_deg
  );
$$ LANGUAGE sql STABLE;
```

---

## 6. Résumé des relations

```
sectors
  ├── sector_systems (sector_id) → stellar_systems
  ├── signals (sector_id) — origine incertaine
  ├── observations (sector_id) — "champ profond", système inconnu
  └── traces (sector_id) — trace à origine sectorielle
```

---

## 7. Alternative : secteurs définis par polygone

Si un cône circulaire ne suffit pas (ex. localisation LIGO en forme de banane) :

```sql
-- Remplacer center_ra, center_dec, radius_deg par :
boundary JSONB NOT NULL,  -- [[ra, dec], [ra, dec], ...] polygone fermé
```

La détection "point dans polygone" est plus coûteuse. Pour un premier jet, le cône circulaire couvre la plupart des cas (WOW!, GRB, GW approximatif).

---

*Réf. LACUNA_TRACES.md, LACUNA_GDD.md, Documentation-backend.md*
