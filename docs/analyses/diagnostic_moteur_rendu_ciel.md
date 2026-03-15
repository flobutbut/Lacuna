*Dernière modification : 2026-03-14 15:11*

# Diagnostic complet — Moteur de rendu du ciel (base de données → écran)

## Vue d'ensemble du pipeline

```
[Supabase] stellar_systems + RPC get_visible_systems
     ↓
[Store] stellarSystems.fetchVisibleForSky() → visibleForSky
     ↓
[Composable] useSkyStars.buildStarsFromDb() → forSky() → getPoolForBandFilters → projectStarsFromDb
     ↓
[Canvas] SkyCanvas.draw() → drawStars() → projectStarInFov()
     ↓
[Écran] Canvas 2D — cercles, halos, couleurs
```

---

## 1. BASE DE DONNÉES (Supabase)

### 1.1 Table `stellar_systems`

| Colonne | Type | Description |
|---------|------|-------------|
| id | TEXT PK | Identifiant (SOL, PROXIMA, HD1234...) |
| name | TEXT | Nom affiché |
| spectral_type | TEXT | Ex. M5.5V, G2V |
| distance | DECIMAL | Distance en années-lumière |
| coordinates | JSONB | **x, y, z** (al) ou **ra, dec** (degrés, legacy) |
| apparent_magnitude | NUMERIC | Magnitude vue depuis Sol (HYG) |
| luminosity | NUMERIC | L/L☉ (HYG) |
| color_index | NUMERIC | B-V (HYG) |
| ... | | age, planets, habitable_zone, anomaly_level |

**Format coordinates :**
- **Préféré** : `{"x": -1.54, "y": -1.18, "z": -3.75}` (référentiel galactique, Sol à l'origine)
- **Legacy** : `{"ra": 217.5, "dec": -62.7}` — nécessite `distance` pour conversion 3D

**Points de défaillance :**
- Systèmes seed sans x/y/z → projection front incorrecte sans fallback ra/dec
- SOL a `distance=0`, `coordinates` sans x/y/z → viewer à (0,0,0)

### 1.2 RPC `get_visible_systems`

**Signature (migration 00019) :**
```sql
get_visible_systems(
  p_viewer_system_id TEXT,
  p_magnitude_limit  NUMERIC DEFAULT 18,
  p_magnitude_min    NUMERIC DEFAULT NULL,
  p_limit            INT     DEFAULT 5000,
  p_offset           INT     DEFAULT 0
)
```

**Algorithme :**
1. Position viewer : `coordinates` (x,y,z) ou `ra_dec_distance_to_xyz(ra, dec, distance)`
2. Pour chaque cible (id ≠ viewer) : tx, ty, tz idem
3. Distance 3D : `d3d = sqrt((tx-vx)² + (ty-vy)² + (tz-vz)²)`
4. Magnitude : `m_app = COALESCE(apparent_magnitude, M_abs + 5*log10(d3d/3.26156/10))`
5. Filtres : `d3d >= 0.01` ET `m_app <= p_magnitude_limit` ET `(p_magnitude_min IS NULL OR m_app > p_magnitude_min)`
6. Tri par magnitude croissante, `LIMIT p_limit OFFSET p_offset`

**Formule magnitude :** d3d en al → conversion pc : d_pc = d3d/3.26156 → m = M_abs + 5*log10(d_pc/10)

**Points de défaillance :**
- Surcharge de fonctions (2 params vs 5 params) → ambiguïté d'appel (migration 00024 supprime l'ancienne)
- Viewer sans coordonnées valides → v_x=v_y=v_z=0
- Cible sans x/y/z et sans ra/dec → tx=ty=tz=0

---

## 2. STORE `stellarSystems` (Pinia)

### 2.1 Données

| Ref | Contenu |
|-----|---------|
| `list` | Tous les systèmes (`fetch()` → SELECT * stellar_systems) |
| `visibleForSky` | Systèmes filtrés par RPC (magnitude, distance) |

### 2.2 `fetchVisibleForSky(viewerSystemId, magnitudeLimit=18)`

**Passe 1 — étoiles brillantes (mag ≤ 8) :**
```javascript
supabase.rpc('get_visible_systems', {
  p_viewer_system_id: viewerSystemId,
  p_magnitude_limit: 8,
  p_magnitude_min: null,
  p_limit: 5000,
  p_offset: 0
})
```

**Passe 2 — reste (mag 8–18) par pages :**
```javascript
supabase.rpc('get_visible_systems', {
  p_viewer_system_id: viewerSystemId,
  p_magnitude_limit: 18,
  p_magnitude_min: 8,   // exclut mag ≤ 8
  p_limit: 5000,
  p_offset: 0, 5000, 10000...
})
```

**Résultat :** `visibleForSky = [...pass1, ...page1, ...page2, ...]`

**Points de défaillance :**
- Erreur RPC pass1 → visibleForSky = []
- Erreur RPC pass2 → boucle arrêtée, visibleForSky partiel
- PROXIMA mag ~11 → dans passe 2 uniquement

### 2.3 `forSky(excludeSol=true)`

- **Base** : `visibleForSky` si non vide, sinon `list`
- **Fusion** : ajoute les naines brunes (L/T/Y) de `list` non présentes
- **Exclusion** : filtre SOL si `excludeSol`

**Point de défaillance :** Si `visibleForSky` vide (Supabase non configuré, erreur RPC), fallback sur `list` — pas de filtre magnitude côté serveur.

---

## 3. COMPOSABLE `useSkyStars`

### 3.1 `buildStarsFromDb(viewerCoords)`

**Étapes :**
1. `raw = forSky().filter(s => s.id !== 'SOL')`
2. `pool = getPoolForBandFilters(raw)` — mag ≤ 15 (ou mIR ≤ 15 pour L/T/Y)
3. `entries = pool.map(star => ({ star, ...getStarBandParamsOrZero(star, band) }))`
4. Si filtre exoplanètes : `entries.filter(e => hasExoplanets(e.star.id))`
5. `projectStarsFromDb(entries, viewerCoords, visitedIds)`
6. Si résultat vide → `initStars()` (fallback procédural)

### 3.2 `getPoolForBandFilters(stars)` — spectralBands.js

Garde les étoiles avec :
- **OBAFGKM** : `mag ≤ 15` (apparent_magnitude ou calculée)
- **LTY** : `mIR ≤ 15`

**Point de défaillance :** mag > 15 → exclue du pool (ex. étoile très lointaine).

### 3.3 `getStarBandParamsOrZero(star, band)` — spectralBands.js

Par bande (visible, ir, uv, r) :
- **visible** : `mag > 12` OU `L/T/Y` → opacity 0
- **ir** : `mIR > 15` → opacity 0 ; L/T/Y favorisées
- **uv** : `mag > 12` → opacity 0 ; O/B/A favorisées
- **r** : `mag > 12` → opacity 0

**Point de défaillance :** mag > 12 en visible → opacity 0 (étoile masquée visuellement mais présente dans la liste).

### 3.4 `projectStarsFromDb(filteredEntries, viewerCoords, visitedIds)` — useSkyStars.js

Pour chaque entrée :
1. **Exclusion SOL** : `if (s.id === 'SOL') return null`
2. **Coordonnées** : si `coords.x == null && coords.ra != null` → conversion ra/dec/distance → x,y,z
3. **Vecteur relatif** : `dx = coords.x - viewerCoords.x` (idem y, z)
4. **Direction** : `xyzToRaDec(dx, dy, dz)` → ra, dec, dist
5. **Rayon visuel** : `rBase = max(1.2, 3.4 - dist/25)` × luminance × (anomaly ? 1.5 : 1)
6. **Objet projeté** : `{ id, ra, dec, r, brightness, star, opacityTarget, ... }`

**Points de défaillance :**
- `viewerCoords` sans x/y/z (ex. SOL avec ra/dec seul) → (0,0,0)
- Étoile sans x/y/z et sans ra/dec → dx=dy=dz=0 → dist=0 → direction dégénérée

---

## 4. PROJECTION `stellarProjection.js`

### 4.1 `xyzToRaDec(dx, dy, dz)`

- `dist = sqrt(dx²+dy²+dz²)`
- Si dist < 0.0001 → `{ ra: 0, dec: 0, dist: 0 }`
- Sinon : `ra = atan2(dy,dx)*180/π`, `dec = asin(dz/dist)*180/π`

### 4.2 `projectStarInFov(ra, dec, raView, decView, w, h)`

- S = vecteur unitaire (ra, dec)
- V = vecteur unitaire (raView, decView)
- **Angle** : `angleDeg = acos(S·V) / RAD`
- **Si angleDeg > 60 (FOV_HALF)** → `return null` (étoile hors champ, non dessinée)
- Projection stéréographique → coordonnées écran (x, y)

**Point de défaillance :** Vue (raView, decView) qui ne pointe pas vers l'étoile → angle > 60° → null → étoile invisible.

---

## 5. RENDU `skyRenderers.js` → `drawStars()`

Pour chaque étoile de `starList` :
1. `pos = projectStarInFov(s.ra, s.dec, raView, decView, w, h)`
2. Si `!pos` → **return** (ne dessine pas)
3. Transition d'opacité : `opacityCurrent += (opacityTarget - opacityCurrent) * 0.032`
4. Scintillement : `flicker = 0.92 + 0.08*sin(twinkle)`
5. `alpha = brightness * mult * flicker * opacity` (min 0.35 si opacityTarget > 0)
6. Couleur : `resolveStarColor(star, colorOverride)` → RGB
7. Dessin : halo (si r>1.2), cercle principal, cercles highlight si sélectionnée/visitée

**Ordre de dessin :** grille → Milky Way → nébuleuses (IR) → étoiles → signaux → bordure spectrale

---

## 6. SKYCANVAS — Orchestration

### 6.1 Montage (onMounted)

1. `ensureStoresLoaded(shipStore, stellarSystemsStore, nebulasStore, mapStore)` — charge `list` si besoin
2. `fetchVisibleForSky(shipStore.currentSystemId, 18)` — charge visibleForSky via RPC
3. `rebuildStars()` → `buildStarsFromDb(getViewerCoords())`
4. **Vue initiale** : si SOL et vue = (180, 0) → override vers (217.5, -62.7) (Proxima)
5. `draw(canvas, stars)` en boucle requestAnimationFrame

### 6.2 `getViewerCoords()`

```javascript
viewerSystem = list.find(s => s.id === shipStore.currentSystemId)
return viewerSystem?.coordinates ?? { x: 0, y: 0, z: 0 }
```

**Point de défaillance :** Si viewer (ex. SOL) a `coordinates = {ra: 0, dec: 0}` sans x/y/z, retourne cet objet. Les clés x, y, z sont absentes → `coords.x ?? 0` = 0. Viewer traité comme (0,0,0).

### 6.3 Watchers (déclenchent rebuildStars)

- `mapStore.nodes` (deep)
- `spectralFilter`
- `exoplanetFilter`
- `stellarSystemsStore.visibleForSky.length`
- `shipStore.currentSystemId` (refetch RPC + rebuild)

---

## 7. SYNTHÈSE — Points de défaillance par couche

| Couche | Condition d'échec | Conséquence |
|--------|-------------------|-------------|
| **DB** | coordinates sans x/y/z, pas de ra/dec | RPC peut calculer tx,ty,tz via ra_dec_distance_to_xyz |
| **DB** | distance NULL ou 0 pour cible | ra_dec_distance_to_xyz donne (0,0,0) |
| **RPC** | Surcharge 2 params vs 5 params | Appel ambigu (résolu par migration 00024) |
| **RPC** | m_app > 18 ou d3d < 0.01 | Exclu du résultat |
| **RPC** | PROXIMA mag ~11 | Passe 2 uniquement (pas pass1) |
| **Store** | visibleForSky vide | forSky() fallback sur list (pas de filtre mag) |
| **Pool** | mag > 15 | Exclu de getPoolForBandFilters |
| **Band** | mag > 12 (visible) ou type L/T/Y | opacity 0, étoile "invisible" mais dans la liste |
| **Projection** | coords sans x/y/z et sans ra/dec | dx=dy=dz=0, dist=0 |
| **Projection** | viewerCoords sans x/y/z | Idem, viewer à (0,0,0) |
| **FOV** | angle(étoile, vue) > 60° | projectStarInFov retourne null, pas dessiné |
| **Vue init** | ra=180, dec=0 (défaut) | Proxima à ~69° → hors FOV |

---

## 8. CHECKLIST DE DIAGNOSTIC

Pour une étoile donnée (ex. PROXIMA) absente de l'écran :

- [ ] **RPC** : `SELECT * FROM get_visible_systems('SOL', 18) WHERE id = 'PROXIMA'` → 1 ligne ?
- [ ] **visibleForSky** : `visibleForSky.find(s => s.id === 'PROXIMA')` dans la console après chargement ?
- [ ] **forSky** : PROXIMA dans `forSky()` ?
- [ ] **getPoolForBandFilters** : mag ≤ 15 ? (PROXIMA ~11 ✓)
- [ ] **getStarBandParamsOrZero** : bande visible, mag ≤ 12 ? opacity 1 ?
- [ ] **projectStarsFromDb** : coords x/y/z ou ra/dec + distance ? viewerCoords valides ?
- [ ] **projectStarInFov** : angle ≤ 60° ? (vue centrée sur Proxima si à SOL)
- [ ] **drawStars** : pos non null ? alpha > 0 ?

---

## 9. RECHERCHE ÉTOILE (OBSERVATOIRE)

La recherche interroge **directement Supabase** via `stellarSystems.searchSystems(q)` :
- **Champs** : `name` et `id` (case-insensitive, contains)
- **Source** : table `stellar_systems` — ne dépend ni de `list` ni de `visibleForSky`
- **Effet** : trouve toute étoile en base (ex. Polaris id=`polaris`) sans attendre le chargement des passes

Polaris (HYG slug `polaris`, name `Polaris`) est trouvable dès qu’elle est en base.

---

## 10. FICHIERS IMPLIQUÉS

| Fichier | Rôle |
|---------|------|
| `supabase/migrations/00019_paginate_visible_systems.sql` | RPC get_visible_systems |
| `supabase/migrations/00017_fix_visible_systems_rpc_xyz_magnitude.sql` | spectral_type_to_absolute_magnitude, ra_dec_distance_to_xyz |
| `src/stores/stellarSystems.js` | fetchVisibleForSky, forSky, **searchSystems** |
| `src/components/ObservatoireSpectralFilters.vue` | Recherche (searchStar → searchSystems) |
| `src/composables/useSkyStars.js` | buildStarsFromDb, projectStarsFromDb |
| `src/lib/spectralBands.js` | getPoolForBandFilters, getStarBandParamsOrZero |
| `src/lib/stellarProjection.js` | xyzToRaDec, projectStarInFov |
| `src/lib/skyRenderers.js` | drawStars |
| `src/components/SkyCanvas.vue` | Orchestration, getViewerCoords, boucle de rendu |
