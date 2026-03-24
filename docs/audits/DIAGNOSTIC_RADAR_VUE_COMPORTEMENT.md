# Diagnostic — Comportement de la vue Radar (compression vs défilement)

**Date** : 2025-03  
**Contexte** : L'utilisateur signale **aucun changement visible** — les graphiques se compressent au lieu de défiler vers la gauche. **Objectif** : défilement vers la gauche (nouveau à droite, ancien qui sort), **sans compression** des graphs.

---

## 1. État actuel du code (RadarView.vue)

### Structure Vue / CSS

- **Pas de contentWidthPx** dans le template
- **Pas de scroll DOM** (pas de scrollLeft, pas de conteneur scrollable)
- **Canvas** : largeur/hauteur définies **uniquement en JS** dans `initCanvases()` :
  - `specCanvas.width = containerRef.clientWidth` (ou 800 en fallback)
  - `specCanvas.height = spectrogramHeight`
- **CSS canvas** : `display: block; background` — **pas de width/height en CSS**
- **Structure DOM** :

```
.radar-view (position: absolute, inset: 0, flex column, padding-top)
  └── .radar-view__charts (flex: 1, min-height: 0, flex column, padding)
        ├── .radar-view__spectrogram (flex: 2, min-height: 0)
        │     └── canvas.radar-view__canvas
        └── .radar-view__intensity (flex: 1, min-height: 0)
              └── canvas.radar-view__canvas
```

### Logique drawViewport()

- `innerW` = `specCanvas.width - margin.left - margin.right`
- `srcW` = `min(innerW, totalCols, HISTORY_SIZE)` → jamais plus de colonnes que de pixels
- `srcX` = si `totalCols > innerW` : `((writeCol - innerW) + HISTORY_SIZE) % HISTORY_SIZE` (fenêtre glissante)
- Dessin 1:1 quand `srcW = innerW` ; étirement quand `totalCols < innerW` (début)
- **Côté dessin** : pas de compression (on ne dessine jamais plus de colonnes que de pixels)

---

## 2. Comportement attendu (défilement)

| Critère | Attendu |
|---------|---------|
| Viewport | Largeur fixe = conteneur |
| Rapport | 1 px = 1 colonne |
| Nouvelles données | À droite |
| Anciennes données | Sortent à gauche |
| Effet visuel | Ruban qui défile vers la gauche |

---

## 3. Causes possibles de la compression / absence de défilement

### A) Canvas affiché à une taille différente de son buffer (hypothèse principale)

- `display: block` sans largeur/hauteur CSS → le canvas prend sa taille intrinsèque (attributs width/height).
- **Mais** : si un ancêtre flex impose une contrainte (ex. `min-width: 0`), l'élément peut rétrécir.
- Le navigateur **scale** alors le contenu du canvas pour l'adapter.
- **Résultat** : buffer 1200 px affiché dans 800 px → compression visuelle.

### B) `display: block` et prise en charge du parent

- Un élément `display: block` prend par défaut 100 % de la largeur du conteneur.
- Si le conteneur est plus étroit que `canvas.width`, le canvas peut être affiché plus petit.
- Le contenu est alors scalé → compression.

### C) Différence containerRef vs largeur réelle du spectrogram

- `initCanvases()` utilise `containerRef.clientWidth` (= `.radar-view`).
- Le spectrogramme est dans `.radar-view__charts` qui a `padding: var(--space-4)`.
- La largeur utile peut être plus petite que `containerRef.clientWidth`.
- Si le canvas buffer = 1200 px mais l'affichage réel = 1100 px → scaling.

### D) ResizeObserver

- Le ResizeObserver modifie `specCanvas.width`/`height` quand le conteneur change.
- Recrée les offscreens et appelle `prefillOffscreens()`.
- Si les dimensions changent ou sont mal synchronisées → instabilité.

### E) Vitesse de défilement (perception)

- 1 tick = 1 colonne toutes les 100 ms.
- Viewport ~1150 px → renouvellement complet en ~115 s.
- Le défilement peut sembler quasi inexistant.

---

## 4. Chaîne de layout

| Élément | Propriétés | Rôle |
|--------|------------|------|
| `page-observatoire` | `position: fixed`, `overflow: auto` | Conteneur page |
| `RadarView` | `v-if="isRadarMode"` | Monté en mode Radar |
| `.radar-view` | `position: absolute`, `inset: 0`, `padding-top` | Remplit le parent |
| `.radar-view__charts` | `flex: 1`, `min-height: 0`, `padding` | Zone graphiques |
| `.radar-view__spectrogram` | `flex: 2`, `min-height: 0` | Conteneur spectrogramme |
| `canvas` | `display: block` | Peut être contraint par le flex |

**Points sensibles** :
- `.radar-view__spectrogram` a `min-height: 0` mais pas `min-width`.
- En flex column, la largeur (cross-axis) vient du parent. Pas de `min-width: 0` → pas de réduction forcée.
- Mais si un ancêtre a `min-width: 0`, la chaîne peut propager la contrainte.

---

## 5. Vérifications dans le navigateur (DevTools)

1. **Dimensions du canvas**
   - Inspecter `<canvas>`, noter `width` et `height` (attributs).
   - Comparer avec `getBoundingClientRect().width` et `.height`.
   - Si `canvas.width = 1200` mais `getBoundingClientRect().width = 800` → **compression**.

2. **ResizeObserver**
   - `console.log` dans le callback du ResizeObserver.
   - Vérifier fréquence et valeurs.

3. **Padding / largeur utile**
   - Mesurer la largeur de `.radar-view__spectrogram` et la comparer à `containerRef.clientWidth`.

---

## 6. Pistes de correction (défilement sans compression)

1. **Forcer la taille d'affichage du canvas**
   - Lier explicitement : `:style="{ width: canvasWidth + 'px', height: spectrogramHeight + 'px' }"` sur le canvas.
   - Ou `:width="canvasWidth"` et `:height="spectrogramHeight"` (attributs HTML) pour garder cohérence buffer/affichage.

2. **Protéger contre la réduction flex**
   - `flex-shrink: 0` sur `.radar-view__spectrogram` et `.radar-view__intensity`.
   - Ou wrapper le canvas dans une div avec `overflow: hidden` et dimensions explicites.

3. **Utiliser la largeur réelle du spectrogram**
   - Mesurer `.radar-view__spectrogram` ou son parent plutôt que `containerRef.clientWidth`.

4. **Test de défilement**
   - Réduire `TICK_MS` à 50 ms temporairement pour vérifier que le défilement est visible.
