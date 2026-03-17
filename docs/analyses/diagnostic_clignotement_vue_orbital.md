# Diagnostic — Clignotement au chargement de la vue orbitale (Carte)

*Date : 2026-03*

## Symptôme

À chaque changement de système dans la vue Carte, la visualisation orbitale « saute » ou « clignote » une fois très rapidement puis se stabilise.

---

## Chaîne d’exécution au changement de système

### 1. PageCarte.vue

- L’utilisateur sélectionne un système → `selectedSystemId` change.
- `watch(selectedSystemId)` :
  - met `detailsLoading = true` ;
  - appelle `systemObjectsStore.fetchForSystem(systemId)` ;
  - dans `finally`, met `detailsLoading = false`.
- `CarteOrbitalView` reçoit : `systemId` (nouveau), `loading` (= `detailsLoading`).

### 2. CarteOrbitalView.vue — Template

- `v-if="!systemId"` → message « Sélectionnez un système ».
- `v-else-if="loading"` → **« Chargement… »** (div `.carte-orbital__empty`).
- `v-else` → bloc **play bar + SVG** (vue orbitale).

Dès que `loading` passe à `false`, le contenu du container `.carte-orbital` passe donc d’une simple div de texte à la structure play bar + SVG → **changement de structure DOM**.

### 3. CarteOrbitalView.vue — Watch (système + loading + planètes)

Déclenché quand `[props.systemId, props.loading, planetsWithSize.value.length]` change.

**Ordre actuel des opérations :**

1. Arrêt des animations, reset des phases (`orbitProgressEased = 0`, etc.).
2. Si `systemId && !loading && planetCount > 0` :
   - `await nextTick()` → on attend le prochain cycle de mise à jour du DOM.
   - Lecture de `containerRef.getBoundingClientRect()` et mise à jour de `size`.
   - `requestAnimationFrame(runOrbitAnimation)` → démarrage de l’animation au frame suivant.

**Problème :** Vue a déjà planifié un rendu avec les nouvelles conditions (`loading = false`, nouveau système). Ce rendu a lieu **avant** que le callback du watch n’ait exécuté `nextTick` et mis à jour `size`. Donc le **premier paint** du SVG utilise encore l’état précédent de `size`.

### 4. Valeur de `size`

- **Valeur initiale :** `size = ref(320)`.
- Mise à jour :
  - dans le watch (après `nextTick`) ;
  - dans `onMounted` + `ResizeObserver` (au resize du container).

Quand on bascule de « Chargement » au SVG, le **premier rendu** du SVG utilise donc `size = 320` (ou l’ancienne valeur). Le **viewBox** est alors `"0 0 320 320"`. Ensuite le watch met `size` à la taille réelle du container (ex. 400) → **viewBox** devient `"0 0 400 400"` → **changement d’échelle visible** = clignotement / saut.

### 5. Phase orbitale à 0

- On remet **`orbitProgressEased = 0`** de façon synchrone dans le watch.
- L’animation ne démarre que dans le **prochain** `requestAnimationFrame`.
- Donc on a **au moins une frame** avec les planètes à la position « départ » (phase 0), puis l’animation démarre. Si le navigateur peint cette frame, l’utilisateur peut percevoir un petit saut.

### 6. ResizeObserver

- Au montage, un `ResizeObserver` appelle `updateSize()` à chaque changement de taille du container.
- Quand le contenu passe de « Chargement » (une ligne) au bloc play bar + SVG (flex), la **hauteur utile** du container peut changer (play bar + zone carrée).
- Le ResizeObserver peut donc rappeler `updateSize()` après le premier affichage du SVG → **nouvelle mise à jour de `size`** → nouveau viewBox → possible **second saut**.

---

## Causes identifiées (résumé)

| # | Cause | Impact |
|---|--------|--------|
| 1 | **Premier paint du SVG avec `size` encore à 320** (ou ancienne valeur) | ViewBox incorrect au premier frame, puis correction au nextTick → **saut d’échelle** (principal clignotement). |
| 2 | **Changement de structure DOM** (Chargement → play bar + SVG) | Reflow ; le container peut changer de dimensions, ce qui interagit avec la cause 1. |
| 3 | **Phase à 0 pendant au moins un frame** avant le premier tick d’animation | Possible petit saut perçu au démarrage de l’animation. |
| 4 | **ResizeObserver** qui met à jour `size` après l’apparition du SVG | Risque de **deuxième** changement de viewBox si le layout final n’est pas le même qu’après nextTick. |

---

## Piste de correction retenue

- **Ne pas afficher le bloc orbital (play bar + SVG) tant que la taille n’est pas cohérente avec le container.**
- Introduire un flag **`orbitViewReady`** :
  - Quand le watch détecte `systemId && !loading && planetCount > 0`, il met `orbitViewReady = false`.
  - Puis `await nextTick()` et mise à jour de `size` à partir de `containerRef`.
  - Puis `orbitViewReady = true`.
- Dans le template : n’afficher le bloc orbital que si **`orbitViewReady`** est vrai (en plus des conditions actuelles). Tant que `orbitViewReady` est false, garder l’affichage « Chargement… » (ou un placeholder sans changer la structure du container si besoin).
- Ainsi, le **premier paint** du SVG utilise déjà la bonne valeur de `size` → plus de saut de viewBox au chargement.

Optionnel : pour limiter un éventuel effet de la cause 4, on peut ignorer une première mise à jour du ResizeObserver juste après avoir mis `orbitViewReady = true`, ou s’assurer que la taille lue dans le watch est déjà celle du container « final » (avec le même flex que lorsqu’on affiche le SVG).
