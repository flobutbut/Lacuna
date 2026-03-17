# Diagnostic — Réutilisabilité Observatoire ↔ Vue 3D

*Analyse des éléments à extraire en composants et composables — Mars 2026*

---

## 1. Vue d'ensemble

### 1.1 Architecture actuelle

| Couche | Observatoire | Vue 3D conception |
|--------|--------------|-------------------|
| **Données étoiles** | `useSkyStars` + `buildStarsFromDb(viewerCoords)` | `useStars3DConception` → réutilise `useSkyStars` + barycentre |
| **Rendu étoiles** | `skyRenderers.drawStars` (Canvas 2D) | `Stars3DCanvas` (Three.js Points) |
| **Couleur étoile** | `spectralBands.resolveStarColor(star, colorOverride)` | Idem dans `useStars3DConception` |
| **Filtres + recherche** | `ObservatoireSpectralFilters` (uiStore) | Idem en mode `standalone` (v-model) |
| **Highlight sélection** | Dans `drawStars` : `isHighlighted = selectedStar \|\| searchedStarId` | `buildHighlightMesh` : point cyan séparé |
| **État sélection** | `ui.selectedStar`, `ui.searchedStarId` | `focusStarId` (ref local) |

### 1.2 Duplications identifiées

| Élément | Observatoire | Vue 3D | Problème |
|---------|--------------|--------|----------|
| Couleur highlight | `rgba(0,180,200,0.9)` dans skyRenderers | `0x00b4c8` dans Stars3DCanvas | Valeur cyan en dur × 2 |
| Logique couleur étoile | `resolveStarColor` via spectralBands | Idem | ✅ Déjà partagé |
| Taille étoile | `s.r` (luminosité, distance) dans useSkyStars | `(p.r ?? 1) * 0.4` dans useStars3DConception | Formules proches mais distinctes |
| Highlight visuel | Anneau cyan dans drawStars | Point cyan 4× plus gros | Rendu différent (2D vs 3D) mais sémantique identique |

---

## 2. Inventaire détaillé

### 2.1 Lib (déjà réutilisables)

| Fichier | Contenu | Utilisation |
|---------|---------|-------------|
| `spectralBands.js` | `resolveStarColor`, `getStarBandParamsOrZero`, `luminosityToBaseBrightness`, `luminosityToRadiusMultiplier`, `filterBySpectralBand` | Observatoire, Vue 3D |
| `stellarProjection.js` | `xyzToRaDec`, `raDecToVector`, `projectStarInFov`, `projectNebulaShape` | Observatoire (2D), — (Vue 3D utilise xyz directement) |
| `skyRenderers.js` | `drawStars`, `drawConstellationLines`, `drawSignals`, etc. | Observatoire uniquement (Canvas 2D) |

### 2.2 Composables

| Composable | Rôle | Réutilisé ? |
|------------|------|-------------|
| `useSkyStars` | Liste étoiles projetées (ra, dec, dx, dy, dz, star, colorOverride…), barycentre | ✅ Observatoire + Vue 3D |
| `useStars3DConception` | Points 3D depuis useSkyStars, barycentre, `getStarPositionById` | Vue 3D uniquement |
| `useStoreReady` | `ensureStoresLoaded` | Observatoire, Vue 3D |

### 2.3 Composants

| Composant | Rôle | Réutilisé ? |
|-----------|------|-------------|
| `ObservatoireSpectralFilters` | Filtres spectraux, exoplanètes, constellations, recherche | ✅ Observatoire + Vue 3D (standalone) |
| `ObservatoireTooltip` | Tooltip générique (titre, rows, status) | StarTooltip, SignalTooltip |
| `StarTooltip` | Données étoile (distance, spectral, voyage, exoplanètes) → ObservatoireTooltip | Observatoire uniquement |
| `Reticule` | Curseur croix (position via uiStore) | Observatoire uniquement |
| `TravelWidget` | Infos voyage (étoile sélectionnée) | Observatoire uniquement |

### 2.4 Logique dispersée (candidates extraction)

| Logique | Emplacement | Réutilisable vers |
|---------|-------------|-------------------|
| Parse coordonnées (ra, dec) | `ObservatoireSpectralFilters.parseCoordinates` | Lib `stellarUtils` ou `coordinates` |
| Conversion système → xyz | `ObservatoireSpectralFilters.getSystemXyz` | Lib ou useSkyStars (déjà partiel dans projectStarsFromDb) |
| Recherche systèmes + constellations + signaux | `ObservatoireSpectralFilters` (computeMatches, etc.) | Composable `useStellarSearch` |
| Données tooltip étoile | `StarTooltip` (rows, status, travelLabel) | Composable `useStarTooltipData` |
| Constantes highlight | skyRenderers, Stars3DCanvas | `constants/starHighlight.js` ou tokens |

---

## 3. Propositions de refactoring

### 3.1 Composables à créer

#### `useStellarSearch`
**Contenu** : logique de recherche (query, matches, prev/next, goTo)

- `searchQuery`, `searchMatches`, `currentMatchIndex`
- `computeMatches()`, `computeSignalMatches()`, `computeConstellationMatches()`
- `parseCoordinates(str)`
- `searchStar()`, `clearSearch()`, `prevMatch()`, `nextMatch()`
- `goToMatch(match, options)` — options : `{ onFocusStar?, onFocusConstellation?, onFocusCoords? }`

**Bénéfice** : `ObservatoireSpectralFilters` devient un composant de présentation qui appelle le composable ; la Vue 3D peut utiliser le même composable avec des callbacks différents.

#### `useStarTooltipData(starRef)`
**Contenu** : transformation étoile projetée → données tooltip

- `rows` : distance, type spectral, voyage estimé, exoplanètes
- `status` : ANOMALIE DÉTECTÉE, SYSTÈME VISITÉ, NON EXPLORÉ
- `actionLabel` : "[ CLIC POUR OBSERVER ]"

**Bénéfice** : `StarTooltip` simplifié ; possible réutilisation pour un tooltip 3D (affichage au survol d’un point).

### 3.2 Lib à créer ou étendre

#### `lib/stellarCoordinates.js` (nouveau)
- `parseCoordinates(str)` — extrait de ObservatoireSpectralFilters
- `getSystemXyz(system)` — conversion ra/dec/distance → x,y,z

#### `constants/starDisplay.js` (nouveau)
- `HIGHLIGHT_COLOR` : `#00b4c8` ou `0x00b4c8` (selon usage)
- `HIGHLIGHT_STROKE` : `rgba(0,180,200,0.9)` pour Canvas
- `STAR_DISPLAY` : tailles, opacités par contexte (2D, 3D)

### 3.3 Composants à créer ou adapter

#### Composant `StarHighlight` (abstrait)
Interface commune pour « mettre en évidence une étoile » :

- **Observatoire (2D)** : anneau cyan (déjà dans drawStars)
- **Vue 3D** : point cyan (déjà dans buildHighlightMesh)

→ Pas de nouveau composant nécessaire ; plutôt une **constante partagée** (`HIGHLIGHT_CYAN`) et une **doc** indiquant que les deux vues partagent la même sémantique.

#### Extraction logique highlight de `drawStars`
La fonction `drawStars` gère :
- rendu normal (couleur, halo, anomaly)
- highlight (selected / searched)
- visited (anneau discret)

Pour la Vue 3D, l’équivalent est un second mesh. La **logique « est-ce highlight ? »** pourrait venir d’un helper : `isStarHighlighted(star, selectedStar, searchedStarId)`.

---

## 4. Synthèse — Priorités

### Priorité haute (impact direct Observatoire + Vue 3D)

| Action | Fichiers | Effort |
|--------|----------|--------|
| Créer `constants/starDisplay.js` (HIGHLIGHT_CYAN, etc.) | Nouveau, skyRenderers, Stars3DCanvas | Faible |
| Extraire `parseCoordinates` et `getSystemXyz` vers `lib/stellarCoordinates.js` | Nouveau, ObservatoireSpectralFilters | Faible |

### Priorité moyenne (meilleure maintenabilité)

| Action | Fichiers | Effort |
|--------|----------|--------|
| Créer `useStellarSearch` | Nouveau, ObservatoireSpectralFilters | Moyen |
| Créer `useStarTooltipData` | Nouveau, StarTooltip | Faible |

### Priorité basse (évolutions futures)

| Action | Fichiers | Effort |
|--------|----------|--------|
| Tooltip au survol en Vue 3D (réutilisation useStarTooltipData) | Stars3DCanvas, nouveau composant | Moyen |
| Récupérer couleur depuis tokens CSS (--color-cyan) au lieu de constantes JS | starDisplay.js, etc. | Faible |

---

## 5. État actuel vs cible

### Actuel
```
ObservatoireSpectralFilters (350+ lignes)
  ├── parseCoordinates, getSystemXyz, computeMatches, goToMatch...
  └── Template (filtres + recherche)

skyRenderers.drawStars
  ├── resolveStarColor (spectralBands) ✓
  ├── Highlight : rgba(0,180,200) en dur
  └── Visited : rgba(0,180,200,0.3) en dur

Stars3DCanvas
  ├── resolveStarColor (spectralBands) ✓
  ├── HIGHLIGHT_COLOR = 0x00b4c8 en dur
  └── buildHighlightMesh
```

### Cible
```
constants/starDisplay.js
  └── HIGHLIGHT_CYAN, HIGHLIGHT_VISITED, etc.

lib/stellarCoordinates.js
  ├── parseCoordinates
  └── getSystemXyz

useStellarSearch (composable)
  ├── searchQuery, searchMatches, ...
  └── searchStar, goToMatch(options)

ObservatoireSpectralFilters
  └── utilise useStellarSearch + import stellarCoordinates

skyRenderers.drawStars
  └── import starDisplay pour couleurs

Stars3DCanvas
  └── import starDisplay pour HIGHLIGHT_COLOR
```

---

## 6. Références

- Design system : `docs/design/Design-system.md` — tokens `--color-cyan`
- Vue 3D conception : `docs/features/LACUNA_VUE_3D_ETOILES_CONCEPTION.md`
- Observatoire : `src/components/SkyCanvas.vue`, `src/lib/skyRenderers.js`
