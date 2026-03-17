# LACUNA — Vue 3D des étoiles (conception)

*Analyse de faisabilité et plan d'action — Mars 2026*

---

## 1. Objectif

Créer une **vue 3D de conception** de l'ensemble des étoiles, **hors interface de jeu**, accessible via une URL dédiée. Usage : conception, validation des données stellaires, exploration spatiale pour l'équipe.

### Fonctionnalités cibles (phase 1)

| Fonctionnalité | Description |
|----------------|-------------|
| **Vue 3D** | Affichage de toutes les étoiles en 3D |
| **Origine** | Centre géographique (barycentre) des étoiles comme origine de l'espace 3D |
| **Zoom / dézoom** | Contrôle de la caméra (molette, pinch) |
| **Recherche** | Recherche par nom ou id d'étoile + mise en évidence / focus |
| **Réutilisation** | Design system + composables existants (chargement, étoiles) |

---

## 2. Analyse de faisabilité

### 2.1 Données disponibles

| Élément | Source | Détail |
|---------|--------|--------|
| **Coordonnées** | `stellar_systems.coordinates` | `{ x, y, z }` en al (référentiel galactique, **Sol à l'origine**). Fallback `{ ra, dec }` converti en x/y/z via `useSkyStars` |
| **Liste étoiles** | `stellarSystemsStore.list` | Tous les systèmes après `fetch()` |
| **Étoiles visibles** | `stellarSystemsStore.visibleForSky` | Filtrées par magnitude depuis un point de vue (vaisseau) — **pas adapté** pour vue conception globale |
| **Recherche** | `stellarSystemsStore.searchSystems(q)` | Recherche par `name` ou `id` (ilike), retourne systèmes avec coordinates |
| **SOL** | — | Pas de coordinates x/y/z (origine référentiel) — à exclure ou gérer |

**Conclusion** : Les données sont disponibles. Pour la vue conception, il faut charger **tous les systèmes** (ou un sous-ensemble par magnitude) via `fetch()` ou une requête dédiée, puis convertir les coordonnées.

### 2.2 Centre géographique (barycentre)

**Définition** : Moyenne des positions (x, y, z) des étoiles ayant des coordonnées valides.

```
barycentre = {
  x: Σ xi / n,
  y: Σ yi / n,
  z: Σ zi / n
}
```

**Points d’attention** :
- Les étoiles avec uniquement `ra/dec` doivent être converties en x/y/z (distance requise).
- SOL est à l’origine (0,0,0) — à exclure du calcul du barycentre.
- Calcul côté client : O(n) sur la liste chargée, coût négligeable.

**Faisabilité** : ✅ Immédiate.

### 2.3 Composables et stores réutilisables

| Composable / Store | Réutilisation | Adaptation |
|--------------------|---------------|------------|
| `useStellarSystemsStore` | ✅ | `fetch()`, `list`, `searchSystems()` |
| `useStoreReady` / `ensureStoresLoaded` | ✅ | Charger `stellarSystemsStore` au montage |
| `useSkyStars` | ⚠️ Partielle | `buildStarsFromDb` utilise `viewerCoords` (position vaisseau). Il faudrait une variante ou un paramètre `viewerCoords = barycentre` et `skipExoplanetFilter` / options pour forcer toutes les étoiles |
| `stellarProjection.xyzToRaDec` | ✅ | Conversion direction depuis origine |
| `spectralBands` (luminosityToBaseBrightness, etc.) | ✅ | Couleur/taille des points selon type spectral |

**Recommandation** : Créer un composable dédié `useStars3DConception` qui :
- Calcule le barycentre à partir de `stellarSystemsStore.list`
- Fournit une liste de points 3D (x, y, z) centrés sur le barycentre
- Réutilise la logique de conversion ra/dec→xyz et les paramètres visuels (luminosité, couleur)

### 2.4 Stack 3D (Three.js)

| Élément | Statut |
|---------|--------|
| **Three.js** | ✅ Déjà dans `package.json` (^0.183.2) |
| **Utilisation actuelle** | ❌ Aucun composant Vue n’utilise Three.js dans `src/` |
| **OrbitControls** | À ajouter (inclus dans `three/examples/jsm/controls/OrbitControls`) |

**Rendu recommandé** : `THREE.Points` ou `THREE.InstancedMesh` pour afficher des milliers de points sans surcharger le GPU.

**Faisabilité** : ✅ Three.js est présent ; intégration Vue + Three.js standard.

### 2.5 Volume de données et performances

| Source | Ordre de grandeur |
|--------|-------------------|
| HYG (import) | ~50 000 étoiles (distance < 500 al) |
| `list` (après fetch) | Variable selon seed / import |
| `visibleForSky` | 10k–50k selon magnitude limite |

**Risques** :
- 50k points : acceptable avec `THREE.Points` (BufferGeometry) et pas d’instances individuelles.
- Option : filtrer par magnitude (ex. mag ≤ 12) pour réduire à ~5–10k si besoin.

**Faisabilité** : ✅ Géré par un nuage de points optimisé.

### 2.6 Design system

| Élément | Usage prévu |
|---------|-------------|
| `tokens.css` | Fond `--color-bg`, accents `--color-cyan`, texte `--color-white` / `--color-muted` |
| `.sw-row`, `.sw-key`, `.sw-val` | Panel infos étoile sélectionnée / résultats recherche |
| `AppModal` | Optionnel pour détails étoile |
| `.btn-primary`, `.btn-ghost` | Boutons recherche, reset vue |
| `--font-mono` | Données (coordonnées, distance) |
| Thématisation D3/Three | Même règle : pas de couleurs par défaut des librairies |

**Faisabilité** : ✅ Alignement direct avec le design system.

### 2.7 URL et routing

**Contraintes** :
- Vue **hors interface jeu** : pas de Header, InstrumentsBar, SideLeft, SideRight.
- URL dédiée, non exposée dans la navigation principale.

**Propositions d’URL** :
- `/conception-etoiles` — explicite, en français
- `/dev/stars-3d` — convention "dev" pour outils internes

**Layout** : Page fullscreen, canvas Three.js en plein écran, barre de recherche + contrôles en overlay (style design system).

**Faisabilité** : ✅ Route simple à ajouter ; layout conditionnel (meta ou composant wrapper).

---

## 3. Plan d’action

### Phase 1 — MVP (vue 3D + zoom + recherche)

| Étape | Tâche | Fichiers / composants |
|-------|-------|------------------------|
| **1.1** | Ajouter la route `/conception-etoiles` (ou `/dev/stars-3d`) | `src/router/index.js` |
| **1.2** | Créer `PageConceptionEtoiles.vue` — layout minimal (sans Header/InstrumentsBar) | `src/views/PageConceptionEtoiles.vue` |
| **1.3** | Configurer le layout conditionnel dans `App.vue` : si route conception, pas de Header ni InstrumentsBar | `src/App.vue` |
| **1.4** | Créer `Stars3DCanvas.vue` — initialisation Three.js (Scene, PerspectiveCamera, WebGLRenderer), OrbitControls, rendu loop | `src/components/conception/Stars3DCanvas.vue` |
| **1.5** | Créer `useStars3DConception` — chargement via `ensureStoresLoaded(stellarSystemsStore)`, calcul barycentre, liste points 3D centrés | `src/composables/useStars3DConception.js` |
| **1.6** | Intégrer les points dans `Stars3DCanvas` — `THREE.Points` avec BufferGeometry, couleurs/taille selon `spectralBands` | `Stars3DCanvas.vue` |
| **1.7** | Implémenter zoom/dézoom — OrbitControls (molette + drag) | `Stars3DCanvas.vue` |
| **1.8** | Barre de recherche — input + appel `searchSystems(q)`, affichage résultats (liste ou dropdown) | `PageConceptionEtoiles.vue` ou composant dédié |
| **1.9** | Focus sur étoile recherchée — déplacer la caméra vers la position de l’étoile, optionnellement surligner | `Stars3DCanvas.vue` + `useStars3DConception` |
| **1.10** | Thématisation design system — fond, couleurs des points, styles de l’overlay | `tokens.css` + CSS dédié |

### Phase 2 (optionnelle, hors périmètre initial)

- Lignes de constellations (réutiliser `constellationLines` du store)
- Tooltip au survol d’une étoile
- Filtres (magnitude, type spectral)
- Export / capture d’écran

---

## 4. Structure proposée des fichiers

```
src/
├── views/
│   └── PageConceptionEtoiles.vue     # Page fullscreen, layout minimal
├── components/
│   └── conception/
│       ├── Stars3DCanvas.vue         # Canvas Three.js + OrbitControls
│       └── Stars3DSearchBar.vue      # Barre recherche (optionnel, peut être inline)
├── composables/
│   └── useStars3DConception.js       # Barycentre, points 3D, focus
├── router/
│   └── index.js                      # + route /conception-etoiles
└── assets/
    └── components/
        └── conception.css            # Styles overlay (design system)
```

---

## 5. Dépendances et risques

| Risque | Mitigation |
|--------|------------|
| SOL sans coordinates | Exclure du calcul barycentre et de l’affichage |
| Étoiles sans x/y/z (ra/dec uniquement) | Convertir via formule existante dans `useSkyStars` (ra, dec, distance → x, y, z) |
| Performances avec 50k points | `THREE.Points` + `BufferGeometry` ; si besoin, filtre magnitude côté store |
| Accès non intentionnel | URL non liée dans la nav ; éventuellement garder pour usage interne |
| Layout App.vue | Condition `route.meta.conceptionLayout` ou `route.name === 'conception-etoiles'` pour masquer Header/InstrumentsBar |

---

## 6. Synthèse

| Critère | Verdict |
|---------|---------|
| **Faisabilité technique** | ✅ Élevée — données, stores, Three.js prêts |
| **Réutilisation** | ✅ Stores, composables, design system réutilisables |
| **Effort estimé** | 2–3 jours pour le MVP (vue 3D, zoom, recherche, focus) |
| **Risques** | Faibles, mitigés par les mesures ci-dessus |

La vue 3D de conception est **faisable** avec la stack actuelle. Le plan d’action permet une mise en place incrémentale et cohérente avec l’architecture existante.

---

## 7. Implémentation (Mars 2026)

**Statut** : MVP livré. Fichiers : PageConceptionEtoiles.vue, Stars3DCanvas.vue, useStars3DConception.js, conception.css. Route `/conception-etoiles`. URL : localhost:5173/conception-etoiles

*Document de référence — à mettre à jour au fur et à mesure de l’implémentation.*
