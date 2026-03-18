# Diagnostic — Moteur de rendu des étoiles et filtrage en base

Analyse du flux de données : chargement filtré en base (RPC + passes), store, composables, puis rendu 2D (Observatoire) et 3D (conception).

---

## 1. Filtrage en base de données

### 1.1 RPC `get_visible_systems`

**Rôle** : retourner les systèmes stellaires **visibles depuis la position du vaisseau**, avec une limite de magnitude apparente, **sans charger toute la table** d’un coup.

**Paramètres** (migration `00019_paginate_visible_systems.sql`) :

| Paramètre | Rôle |
|-----------|------|
| `p_viewer_system_id` | Système où se trouve le vaisseau (origine du calcul de magnitude apparente). |
| `p_magnitude_limit` | Magnitude apparente max (ex. 6.5 ou 18). Seuls les systèmes avec `m_app ≤ limite` sont retournés. |
| `p_magnitude_min` | Optionnel. Si renseigné, exclut les étoiles avec `m_app ≤ p_magnitude_min` (pour pagination par tranche de magnitude). |
| `p_limit` | Nombre max de lignes retournées (ex. 6000, 10000). |
| `p_offset` | Décalage pour pagination. |

**Logique côté SQL** :

1. **Exclusion du viewer** : `WHERE ss.id != p_viewer_system_id` — le système courant n’est jamais dans le résultat (règle “on ne voit pas son étoile”).
2. **Coordonnées viewer** : lecture de `stellar_systems.coordinates` (x,y,z ou ra/dec→xyz) pour le système `p_viewer_system_id`.
3. **Magnitude apparente** : pour chaque autre système, calcul de la distance 3D au viewer puis `m_app` (soit `apparent_magnitude` HYG, soit formule M_abs + 5*log10(d/10)).
4. **Filtres appliqués** :  
   `d3d >= 0.01` (éviter doublons à l’origine),  
   `m_app <= p_magnitude_limit`,  
   `(p_magnitude_min IS NULL OR m_app > p_magnitude_min)`.
5. **Tri** : `ORDER BY m_app` (les plus brillantes en premier).
6. **Pagination** : `LIMIT p_limit OFFSET p_offset`.

Donc **toute la sélection et le tri sont faits en base** : seules les lignes utiles sont renvoyées, par pages.

---

## 2. Chargement côté front : trois passes (`fetchVisibleForSky`)

**Fichier** : `src/stores/stellarSystems.js`.

Le store **ne fait jamais** un `SELECT * FROM stellar_systems`. Il remplit `visibleForSky` en **trois passes** :

### Passe 1 — Ciel “réel” (magnitude ≤ 6,5)

- **Appel** : `get_visible_systems(viewerId, 6.5, null, 6000, 0)`.
- **Objectif** : étoiles les plus brillantes (visibles à l’œil nu / petit instrument).
- **Résultat** : stocké dans `visibleForSky` (remplace toute valeur précédente).

### Passe 2 — Systèmes proches (≤ 100 al, mag > 6,5)

- **Appel** : requête **directe** sur `stellar_systems` (pas le RPC) :  
  `distance ≤ 100`, `id ≠ viewer`, `apparent_magnitude > 6.5`, tri par distance.
- **Objectif** : cibles de voyage proches, même si peu brillantes.
- **Résultat** : **fusionné** dans `visibleForSky` sans doublons (`_mergeWithoutDuplicates`).

### Passe 3 — Ciel profond (magnitude 6,5 → 18, paginé)

- **Appel** : boucle `get_visible_systems(viewerId, magnitudeLimit, 6.5, 10000, offset)` avec `offset` incrémenté de 10 000 à chaque itération, et délai 100 ms entre les pages.
- **Objectif** : remplir le ciel jusqu’à la magnitude 18 (défaut), par blocs de 10k pour limiter mémoire et temps de réponse.
- **Résultat** : chaque page est fusionnée dans `visibleForSky`. La boucle s’arrête quand une page retourne moins de 10k lignes ou vide.

**Indicateurs** : `skyLoadingPass1`, `skyLoadingPass2`, `skyLoadingPass3`, `skyFullyLoaded` permettent à l’UI d’afficher un état de chargement (ex. “Catalogue en cours…”).

**Fallback** : si Supabase n’est pas configuré, `visibleForSky` reste vide ; le store utilise alors `list` (chargé par `fetch()` : un seul `SELECT` complet sur `stellar_systems`, sans filtre magnitude). En production avec Supabase, `list` sert surtout pour la recherche et le détail système, pas pour le ciel.

---

## 3. Source unique pour le ciel : `forSky()`

**Fichier** : `src/stores/stellarSystems.js`.

```text
base = (visibleForSky.length > 0) ? visibleForSky : list
```

- Si au moins une passe a rempli `visibleForSky`, **toutes les vues ciel** (2D et 3D) partent de `visibleForSky`.
- Sinon (pas de Supabase ou RPC non appelé), base = `list`.

**Exclusion du système courant (viewer)** :

- `forSky(excludeSol, options)` accepte `options.excludeSystemId`.
- Si `excludeSystemId` est défini (ex. Observatoire), le système correspondant est retiré de la liste retournée.
- En Vue 3D conception, `excludeSystemId` est `null` pour inclure le viewer (et on l’ajoute manuellement s’il manque, car le RPC ne le renvoie pas).

**Naines brunes (L/T/Y)** : fusionnées depuis `list` dans `base` si elles ne sont pas déjà présentes (pour le filtre spectral IR), puis exclusion éventuelle du viewer appliquée.

---

## 4. Pipeline “étoiles prêtes à dessiner” : `useSkyStars` et `buildStarsFromDb`

**Fichier** : `src/composables/useSkyStars.js`.

Entrées :

- `viewerCoords` : position du “observateur” (pour projection 3D → dx, dy, dz et ra, dec).
- Contexte : Observatoire (`includeViewerSystem = false`) ou Vue 3D (`includeViewerSystem = true`).

Étapes :

1. **Liste brute** : `raw = forSky(...)` selon le contexte (avec ou sans exclusion du viewer).
2. **Rattrapage viewer** : en Vue 3D, si le viewer n’est pas dans `raw` (car absent du RPC), il est ajouté depuis `list`.
3. **Filtre bande spectrale** : `getPoolForBandFilters(raw)` — garde les étoiles avec magnitude (ou mag IR pour L/T/Y) ≤ 15. Réduit encore le nombre d’étoiles “actives” par bande (visible, IR, UV, R).
4. **Params par étoile** : `getStarBandParamsOrZero(star, band)` → opacité, luminosité, couleur (ou opacity 0 si hors bande).
5. **Filtre exoplanètes** : si le filtre “Exoplanètes” est actif, restriction aux systèmes présents dans `systemObjectsStore` (hasExoplanets).
6. **Projection** : `projectStarsFromDb(entries, viewerCoords, visitedIds, options)` → calcul des coordonnées relatives (dx, dy, dz), ra/dec, taille, etc. ; exclusion éventuelle du viewer en Observatoire (option `excludeSystemId` / `includeViewerSystem`).
7. **Fallback** : si la liste projetée est vide, `initStars(viewerCoords)` (procédural).

En sortie : un tableau d’objets “étoile projetée” (id, dx, dy, dz, ra, dec, star, opacity, etc.) utilisé tel quel par le rendu 2D et transformé en `points` pour le rendu 3D.

---

## 5. Rendu 2D (Observatoire) — `SkyCanvas.vue`

- **Données** : `stars = buildStarsFromDb(getViewerCoords())` avec `useSkyStars(spectralFilter, exoplanetFilter)` **sans** `includeViewerSystem` → le système courant est exclu par la politique viewer.
- **Déclenchement** : `rebuildStars()` est appelé quand `visibleForSky.length` change (watch) ou quand les filtres (spectral, exoplanètes) changent. À chaque passe de `fetchVisibleForSky`, le ciel se met à jour progressivement.
- **Dessin** : projection 2D (ra/dec → écran) dans un canvas, avec constellations optionnelles et signaux.

Le moteur 2D **ne charge jamais toute la base** : il ne voit que ce qui est déjà dans `visibleForSky` (ou `list` en fallback), puis applique les filtres bande + exoplanètes en mémoire.

---

## 6. Rendu 3D (Vue conception) — `useStars3DConception` + `Stars3DCanvas.vue`

- **Données** : même `buildStarsFromDb(barycentre)` que l’Observatoire, mais avec `includeViewerSystem: true` → le système courant est inclus (et ajouté depuis `list` si absent de `visibleForSky`).
- **Barycentre** : calculé à partir de `forSky(true, { excludeSystemId: viewerId })` (toutes les étoiles “ciel” sauf le viewer) pour garder une origine stable.
- **Pipeline 3D** :  
  `points` (computed) = liste d’objets { id, x, y, z, r, g, b, size, name, spectral, star }.  
  Ces points sont groupés par **lettre spectrale** (O, B, A, …) ; un maillage `THREE.Points` par lettre, avec texture SVG par type. Pas de rechargement DB ici : tout part de `visibleForSky` / `list` déjà en mémoire.

Donc la Vue 3D **réutilise exactement le même système de filtrage en base** (trois passes, RPC paginé) ; elle ne fait qu’autoriser le système courant dans la liste et changer l’origine (barycentre) et le rendu (Three.js).

---

## 7. Synthèse du flux

```text
[Base] stellar_systems
        ↓
[RPC] get_visible_systems(viewer, mag_limit, mag_min, limit, offset)
        → exclusion viewer, filtre magnitude, tri m_app, LIMIT/OFFSET
        ↓
[Store] fetchVisibleForSky(viewer, 18)
        → Passe 1 : RPC mag≤6.5, 6k
        → Passe 2 : SELECT proches ≤100 al
        → Passe 3 : RPC 6.5–18 par pages 10k (délai 100 ms)
        → visibleForSky (fusion sans doublons)
        ↓
[Store] forSky(excludeSol, { excludeSystemId })
        → base = visibleForSky ou list
        → + naines brunes L/T/Y depuis list
        → − excludeSystemId si défini
        ↓
[Composable] useSkyStars.buildStarsFromDb(viewerCoords)
        → raw = forSky(...)
        → (+ viewer depuis list si Vue 3D et manquant)
        → getPoolForBandFilters(raw)  [mag ≤ 15 par bande]
        → filtre exoplanètes si actif
        → projectStarsFromDb(...)
        ↓
[Rendu 2D] SkyCanvas : stars → projection ra/dec → canvas
[Rendu 3D] points → groupement par lettre → THREE.Points (textures SVG)
```

**En résumé** : le moteur de rendu actuel **ne charge pas toutes les étoiles d’un coup**. Le filtrage (magnitude, position viewer, pagination) est fait **en base** ; le front ne fait que trois passes ciblées et des filtres légers en mémoire (bande spectrale, exoplanètes, politique viewer). Observatoire et Vue 3D partagent la même source de vérité (`visibleForSky` / `forSky` + `buildStarsFromDb`).

---

## 8. Proposition — Source dédiée 3D (plus ou toutes les étoiles)

On peut envisager une **deuxième méthode dédiée au rendu 3D** qui charge plus d’étoiles (voire toutes), sans changer le comportement de l’Observatoire. Cela implique : (1) un **nouveau filtre en base**, (2) un **chemin de données parallèle** côté store/composable, (3) un **outil parallèle à `buildStarsFromDb`** pour produire les points 3D à partir de cette source.

### 8.1 Nouveau script / RPC en base

**Objectif** : fournir une liste d’étoiles pour la Vue 3D **sans** (ou avec un filtre magnitude très large), éventuellement paginée.

Options possibles :

| Option | Description | Avantage | Inconvénient |
|--------|-------------|----------|--------------|
| **A** | Nouvelle RPC `get_systems_for_conception(p_limit, p_offset)` : pas de filtre magnitude ni exclusion viewer, uniquement `WHERE coordinates IS NOT NULL`, tri par `id` ou `distance`, `LIMIT`/`OFFSET`. | Simple, prévisible, charge par pages (ex. 20k). | Deux RPC à maintenir. |
| **B** | Réutiliser `get_visible_systems` avec une limite très haute (ex. `p_magnitude_limit = 25`) et un viewer fixe (ex. SOL) pour avoir un ordre cohérent, pagination par offset. | Un seul RPC. | Sémantique “visible” peu pertinente pour une vue “toutes étoiles”. |
| **C** | Requête directe côté front : `SELECT id, name, spectral_type, distance, coordinates, ... FROM stellar_systems WHERE coordinates IS NOT NULL ORDER BY distance LIMIT p_limit OFFSET p_offset`. | Pas de nouvelle RPC, pagination simple. | Pas de logique serveur dédiée ; charge réseau si très gros volume. |

Recommandation : **Option A** — une RPC dédiée `get_systems_for_conception` (ou nom équivalent) avec seulement pagination et filtre “a des coordonnées”, sans magnitude ni viewer. Permet d’ajuster plus tard (ex. filtre optionnel par magnitude max, par secteur, etc.) sans toucher à `get_visible_systems`.

### 8.2 Store : source parallèle pour la 3D

- **Nouvelle ref** dans le store (ex. `conceptionForSky` ou `allSystemsForConception`) remplie uniquement quand la Vue 3D demande “plus / toutes les étoiles”.
- **Nouvelle méthode** du store, ex. `fetchConceptionStars(options)` :
  - `options.mode`: `'visible'` | `'full'` (ou `'paginated'`).
  - En mode `'visible'` : ne rien faire (ou vider la ref) — la 3D continue d’utiliser `visibleForSky` comme aujourd’hui.
  - En mode `'full'` : appeler la nouvelle RPC (ou la requête directe) par pages, fusionner dans `conceptionForSky`, avec indicateur de chargement (ex. `conceptionLoading`, `conceptionFullyLoaded`).
- L’Observatoire et le reste de l’app ne touchent pas à cette ref ; ils restent sur `visibleForSky` + `forSky()`.

### 8.3 Composable / outil parallèle à `buildStarsFromDb`

- **Option 1** : même `useSkyStars` avec une option du type `source: 'visible' | 'conception'`. En `'conception'`, `buildStarsFromDb` (ou une branche dédiée) lit `conceptionForSky` au lieu de `forSky()`, et n’applique éventuellement pas le filtre bande stricte (mag ≤ 15) pour garder toutes les étoiles en 3D, ou applique un filtre plus large.
- **Option 2** : **nouveau composable** ex. `useStars3DConceptionFull()` qui :
  - S’appuie sur le store pour `conceptionForSky` (rempli par `fetchConceptionStars('full')`).
  - Expose une fonction **du type** `buildStarsForConception(viewerCoords, options)` (parallèle à `buildStarsFromDb`) : prend la liste brute depuis `conceptionForSky`, applique la projection 3D (même logique que `projectStarsFromDb`), filtres optionnels (bande, exoplanètes) si besoin, et retourne la liste de points 3D.
  - Réutilise au maximum les helpers existants (`projectStarsFromDb`, `computeBarycentre`, `getPoolForBandFilters` ou une variante “large”) pour ne pas dupliquer la logique de projection.

En pratique, un **outil parallèle** (ex. `buildStarsForConception`) qui lit une **source dédiée** (`conceptionForSky`) et réutilise la projection / barycentre permet de garder un seul pipeline de rendu 3D (groupement par lettre, textures, etc.) tout en changeant uniquement la source des étoiles.

### 8.4 Intégration Vue 3D

- La page Vue 3D (ex. `PageConceptionEtoiles`) ou un réglage utilisateur pourrait choisir :
  - **Source “Observatoire”** (actuel) : `visibleForSky` → `forSky()` → `buildStarsFromDb` → même nombre d’étoiles que l’Observatoire, cohérent avec le reste du jeu.
  - **Source “Plein ciel” / “Toutes”** : `fetchConceptionStars('full')` puis `buildStarsForConception` (ou équivalent) → plus d’étoiles voire toute la base, avec chargement progressif et indicateur dédié.

Résumé : **oui, on peut envisager** une deuxième méthode dédiée au rendu 3D avec (1) un **nouveau filtre en base** (RPC dédiée ou requête paginée), (2) une **source parallèle** dans le store (`conceptionForSky` + `fetchConceptionStars`), et (3) un **outil parallèle** à `buildStarsFromDb` (ex. `buildStarsForConception`) alimentant le même moteur de rendu 3D (points, lettres spectrales, textures).

---

## 9. Recommandation — Vue 3D « vue d’ensemble » et conception de scénarios

**Objectif** : la Vue 3D doit donner une **vue d’ensemble du catalogue d’étoiles** et permettre à terme de **sélectionner des étoiles selon leurs paramètres** (type spectral, distance, exoplanètes, etc.) pour concevoir les scénarios.

### 9.1 Recommandation globale

- **Mettre en place la source dédiée 3D** (RPC + ref store + `buildStarsForConception`) et en faire **la source par défaut** de la Vue 3D conception, plutôt qu’un mode optionnel.
- **Garder l’Observatoire** sur le flux actuel (magnitude depuis le viewer, trois passes) pour rester cohérent avec le jeu “en situation”.
- **Filtres de conception** (spectral, exoplanètes, puis plus tard distance, anomalie, zone habitable, etc.) : les faire **côté client** sur la liste chargée pour la 3D, pour pouvoir composer des critères sans multiplier les appels base. Si le catalogue dépasse très largement 100k lignes, on pourra ajouter des paramètres optionnels à la RPC conception (filtres serveur) plus tard.

### 9.2 Choix concrets

| Point | Recommandation | Raison |
|-------|----------------|--------|
| **RPC en base** | Nouvelle RPC dédiée `get_systems_for_conception(p_limit, p_offset)` (pas de magnitude, pas d’exclusion viewer, uniquement coordonnées + pagination). | Vue 3D = vue catalogue, pas “ciel depuis le vaisseau”. Une RPC dédiée garde une sémantique claire et laisse la place à des filtres optionnels futurs (secteur, magnitude max, etc.) sans compliquer `get_visible_systems`. |
| **Quand charger** | Au montage de la page Vue 3D (ou au premier affichage de l’onglet), lancer `fetchConceptionStars('full')` en arrière-plan, par pages (ex. 10k–20k), avec indicateur “Catalogue en cours…”. | L’utilisateur voit d’abord le jeu d’étoiles “Observatoire” si déjà en mémoire, puis la vue se complète progressivement ; à terme la 3D repose sur le catalogue complet. |
| **Source par défaut 3D** | Utiliser `conceptionForSky` (rempli par la RPC conception) comme source des points 3D dès qu’il est disponible ; fallback sur `visibleForSky` / `forSky()` tant que le chargement conception n’a pas démarré ou est vide. | Vue d’ensemble = maximum d’étoiles pertinentes dans la 3D ; la sélection par paramètres s’appuie sur ce même ensemble. |
| **Outil parallèle** | `buildStarsForConception(viewerCoords, options)` qui lit `conceptionForSky`, réutilise `projectStarsFromDb` (et barycentre), applique les filtres bande spectrale + exoplanètes (et plus tard distance, anomalie, etc.) en mémoire. | Un seul pipeline de rendu 3D (maillage par lettre, textures), deux sources possibles ; les critères “scénario” restent des filtres sur une grosse liste déjà chargée. |
| **Filtres scénario** | À terme : en plus du filtre spectral et exoplanètes, exposer des filtres (distance min/max, anomaly_level, habitable_zone, etc.) dans l’UI Vue 3D ; tous appliqués en mémoire sur la liste `conceptionForSky` avant projection. | Conception = itération sur critères ; garder tout en mémoire évite des allers-retours base et permet des combinaisons complexes. Si le catalogue devient énorme, on pourra ajouter des paramètres de filtre à la RPC conception. |

### 9.3 Synthèse

- **Base** : une RPC dédiée “conception” (pagination, pas de filtre magnitude/viewer).
- **Store** : une ref dédiée + chargement paginé au montage (ou à la demande) de la Vue 3D.
- **Rendu 3D** : un outil parallèle à `buildStarsFromDb` qui part de cette ref et applique les filtres (spectral, exoplanètes, puis paramètres scénario) en mémoire.
- **Résultat** : vue d’ensemble du système d’étoiles dans la 3D, puis sélection par paramètres pour concevoir les scénarios, sans dégrader l’Observatoire ni multiplier les scripts de filtre en base au départ.
