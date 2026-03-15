*Dernière modification : 2026-03-14 15:11*

# Diagnostic — PROXIMA n'apparaît pas dans le ciel

## 1. RPC get_visible_systems — PROXIMA dans le résultat ?

**À exécuter dans Supabase SQL Editor :**

```sql
SELECT * FROM get_visible_systems('SOL', 18) 
WHERE id = 'PROXIMA' OR LOWER(name) LIKE '%proxima%';
```

**Résultat attendu :** Une ligne si PROXIMA passe le filtre (magnitude ≤ 18, distance 3D ≥ 0.01).

---

## 2. Calcul pas à pas (si PROXIMA absent du résultat)

### Données PROXIMA (seed / HYG)
- `id` : PROXIMA
- `spectral_type` : M5.5V (seed) — vérifier en base
- `distance` : 4.24 al
- `coordinates` : après migration 00018/00023 → x, y, z ; sinon ra=217.5, dec=-62.7

### Étape 2a — Position viewer (SOL)
SOL a `distance = 0`, `coordinates` sans x/y/z (ra=0, dec=0).
- `ra_dec_distance_to_xyz(0, 0, 0)` → v_x=0, v_y=0, v_z=0

### Étape 2b — Position PROXIMA (target)
Si PROXIMA a x/y/z :
- tx, ty, tz = coordonnées directes

Si PROXIMA a ra/dec :
- `ra_dec_distance_to_xyz(217.5, -62.7, 4.24)` →
  - x = 4.24 * cos(-62.7°) * cos(217.5°) ≈ -1.54
  - y = 4.24 * cos(-62.7°) * sin(217.5°) ≈ -1.18
  - z = 4.24 * sin(-62.7°) ≈ -3.75

### Étape 2c — Distance 3D
```
d3d = sqrt((tx - v_x)² + (ty - v_y)² + (tz - v_z)²)
    = sqrt((-1.54)² + (-1.18)² + (-3.75)²)
    ≈ sqrt(2.37 + 1.39 + 14.06) ≈ 4.22 al
```

### Étape 2d — Magnitude absolue (spectral_type_to_absolute_magnitude)
Pour M5.5V :
- letter = 'M', subtype = 5.5
- M: m0=9.0, m5=12.0, m9=16.0
- subtype 5.5 > 5 → m5 + (m9-m5)*((5.5-5)/4) = 12 + 4*0.125 = **12.5**

À vérifier en SQL :
```sql
SELECT spectral_type_to_absolute_magnitude('M5.5V');
-- et si différent en base :
SELECT spectral_type_to_absolute_magnitude((SELECT spectral_type FROM stellar_systems WHERE id = 'PROXIMA'));
```

### Étape 2e — m_calc (formule RPC 00019)
```
d_pc = d3d_ly / 3.26156 = 4.22 / 3.26156 ≈ 1.29 pc
m_calc = M_abs + 5 * log10(d_pc / 10)
       = 12.5 + 5 * log10(0.129)
       = 12.5 + 5 * (-0.89)
       ≈ 12.5 - 4.45 ≈ 8.05
```

### Étape 2f — Magnitude apparente finale
```
m_app = COALESCE(apparent_magnitude, m_calc)
```
Si `apparent_magnitude` = 11.01 en base → m_app = 11.01.

### Étape 2g — Filtre
- `d3d >= 0.01` ✓
- `m_app <= 18` ✓ (11.01 < 18)
- Passe 1 (mag ≤ 8) : PROXIMA en mag 11 → **exclue** (mag > 8)
- Passe 2 (mag 8–18, p_magnitude_min=8) : PROXIMA **incluse**

**Requête de vérification pas à pas :**
```sql
WITH sol_coord AS (
  SELECT 0::numeric AS vx, 0::numeric AS vy, 0::numeric AS vz
),
prox AS (
  SELECT id, name, spectral_type, distance, coordinates, apparent_magnitude,
    (SELECT x FROM ra_dec_distance_to_xyz(
      COALESCE((coordinates->>'ra')::numeric, 217.5),
      COALESCE((coordinates->>'dec')::numeric, -62.7),
      COALESCE(distance::numeric, 4.24)
    ) LIMIT 1) AS tx,
    (SELECT y FROM ra_dec_distance_to_xyz(
      COALESCE((coordinates->>'ra')::numeric, 217.5),
      COALESCE((coordinates->>'dec')::numeric, -62.7),
      COALESCE(distance::numeric, 4.24)
    ) LIMIT 1) AS ty,
    (SELECT z FROM ra_dec_distance_to_xyz(
      COALESCE((coordinates->>'ra')::numeric, 217.5),
      COALESCE((coordinates->>'dec')::numeric, -62.7),
      COALESCE(distance::numeric, 4.24)
    ) LIMIT 1) AS tz
  FROM stellar_systems WHERE id = 'PROXIMA'
)
SELECT 
  prox.id,
  prox.spectral_type,
  prox.distance,
  prox.apparent_magnitude,
  SQRT(POWER(prox.tx - s.vx, 2) + POWER(prox.ty - s.vy, 2) + POWER(prox.tz - s.vz, 2)) AS d3d_ly,
  spectral_type_to_absolute_magnitude(prox.spectral_type) AS m_abs,
  COALESCE(prox.apparent_magnitude,
    spectral_type_to_absolute_magnitude(prox.spectral_type) +
    5 * LOG(10, GREATEST(
      SQRT(POWER(prox.tx - s.vx, 2) + POWER(prox.ty - s.vy, 2) + POWER(prox.tz - s.vz, 2)) / 3.26156 / 10,
      0.001
    ))
  ) AS m_app,
  CASE WHEN COALESCE(prox.apparent_magnitude,
    spectral_type_to_absolute_magnitude(prox.spectral_type) +
    5 * LOG(10, GREATEST(
      SQRT(POWER(prox.tx - s.vx, 2) + POWER(prox.ty - s.vy, 2) + POWER(prox.tz - s.vz, 2)) / 3.26156 / 10,
      0.001
    ))
  ) <= 18 THEN 'INCLUS' ELSE 'EXCLU' END AS statut_vs_limit_18
FROM prox, sol_coord s;
```

---

## 3. Frontend — fetchVisibleForSky et visibleForSky

### Flux
1. `fetchVisibleForSky('SOL', 18)` appelle la RPC deux fois :
   - Passe 1 : `p_magnitude_limit=8`, `p_magnitude_min=null` → étoiles mag ≤ 8
   - Passe 2 : `p_magnitude_limit=18`, `p_magnitude_min=8` → étoiles mag 8–18 par pages de 5000

2. PROXIMA (mag ~11) est dans la **passe 2**.

3. `visibleForSky` = concaténation des deux passes.

### Vérification dans la console navigateur
Ouvrir les DevTools (F12) → Console, puis :

```javascript
// Après chargement de l'Observatoire
const store = (await import('/src/stores/stellarSystems.js')).useStellarSystemsStore()
const vs = store()
const proxima = vs.visibleForSky.find(s => s.id === 'PROXIMA')
console.log('PROXIMA dans visibleForSky:', !!proxima, proxima)
```

### Chaîne d'affichage
- `forSky()` : base = `visibleForSky` si non vide, sinon `list`
- `getPoolForBandFilters(raw)` : filtre mag ≤ 15 (ou mIR ≤ 15 pour L/T/Y)
- `filterBySpectralBand(raw, band)` : pour bande `visible`, mag > 12 → opacity 0 (exclu du rendu)

PROXIMA mag ~11 < 12 → devrait passer `getStarBandParamsOrZero` en bande visible.

---

## 4. Message « Trop loin »

**Source :** `src/components/ObservatoireSpectralFilters.vue` ligne 91

**Condition d'affichage :**
```javascript
const raw = stellarStore.forSky().filter((s) => s.id !== 'SOL')
const filtered = filterBySpectralBand(raw, band)
if (!filtered.some((f) => f.star?.id === match.id)) {
  ui.showNotification('Trop loin pour voir cette étoile — vue centrée sur la zone', 4000)
}
```

**Interprétation :** Le message s'affiche quand l'étoile recherchée (ex. Proxima) **n'est pas dans la liste filtrée par bande spectrale** (`filterBySpectralBand`). Ce n'est pas une question de distance physique mais de :
- étoile absente de `forSky()` (donc pas dans visibleForSky ni list), ou
- étoile filtrée par `getStarBandParams` (opacity 0) : mag > 12 en visible/uv/r, ou type spectral exclu de la bande.

Pour PROXIMA (M5.5V, mag ~11) en bande visible : mag 11 < 12 → devrait passer. Si le message apparaît, PROXIMA est soit absente de `forSky()`, soit `filterBySpectralBand` la retire pour une autre raison.

---

## 5. Synthèse des points de défaillance possibles

| Étape | Vérification | Si échec |
|-------|--------------|----------|
| RPC   | PROXIMA dans get_visible_systems('SOL', 18) | Coordonnées, magnitude, ou filtre RPC |
| Passe 2 | PROXIMA dans résultat passe 2 (mag 8–18) | Limite 5000, offset pagination |
| forSky | PROXIMA dans visibleForSky | fetchVisibleForSky, Supabase |
| Pool  | PROXIMA dans getPoolForBandFilters (mag ≤ 15) | Magnitude estimée front |
| Band  | getStarBandParams opacity > 0 (mag ≤ 12 visible) | Filtre spectral |
| Projection | projectStarInFov ne retourne pas null | Vue direction, FOV 60° |
| Viewer | getViewerCoords() a x,y,z pour SOL | SOL à (0,0,0) |

---

## 6. Requêtes SQL à exécuter (résumé)

```sql
-- 1. PROXIMA dans get_visible_systems ?
SELECT * FROM get_visible_systems('SOL', 18) 
WHERE id = 'PROXIMA' OR LOWER(name) LIKE '%proxima%';

-- 2. Données brutes PROXIMA
SELECT id, name, spectral_type, distance, coordinates, apparent_magnitude 
FROM stellar_systems WHERE id = 'PROXIMA';

-- 3. Calcul pas à pas (voir requête détaillée §2)
```
