*Dernière modification : 2026-03-15*

# Diagnostic — Lenteur du chargement des étoiles (Observatoire)

## Contexte

L’ouverture de la vue Observatoire (ciel profond) peut sembler lente : l’utilisateur attend avant de voir les étoiles. Ce document analyse les causes et propose des pistes d’amélioration (sans implémentation), notamment une **stratégie de chargement progressif**.

---

## 1. Flux actuel (bloquant)

1. **SkyCanvas** se monte → `onMounted`
2. `ensureStoresLoaded(shipStore, stellarSystemsStore, nebulasStore, mapStore)` — charge les stores de base (dont `stellar_systems` si besoin).
3. **`Promise.all([ fetchVisibleForSky(currentSystemId, 18), fetchConstellationLines() ])`** — on attend que les deux soient terminés.
4. **`rebuildStars()`** puis premier **`draw()`**.

Jusqu’à la fin de l’étape 3, **aucune étoile n’est affichée**. Le goulot d’étranglement principal est là.

---

## 2. Détail de `fetchVisibleForSky` (store stellarSystems)

Le chargement se fait en **trois passes séquentielles** :

| Passe | Contenu | Requête | Blocage |
|-------|---------|---------|---------|
| **1** | Ciel « réel » (magnitude ≤ 6,5) | RPC `get_visible_systems` (mag ≤ 6,5) | Oui |
| **2** | Systèmes proches (≤ 100 al, mag > 6,5) | `select` sur `stellar_systems` | Oui |
| **3** | Ciel profond (mag 6,5 → 18) | RPC `get_visible_systems` par **pages de 10 000** avec **délai 100 ms** entre chaque page | Oui, jusqu’à dernière page |

- **Passe 3** peut faire plusieurs allers-retours réseau (10k par page) et durer longtemps si beaucoup de systèmes sont visibles.
- `visibleForSky` n’est mis à jour qu’à la fin de chaque passe ; le canvas ne peut pas s’afficher « au fil de l’eau ».

Parallèlement, **`fetchConstellationLines()`** charge tous les segments de constellation en une requête (en général rapide).

---

## 3. Causes principales de la lenteur

- **Attente de la fin complète de `fetchVisibleForSky`** avant tout affichage : l’utilisateur ne voit rien pendant toute la durée des 3 passes.
- **Passe 3** potentiellement lourde : volume important (magnitude jusqu’à 18), pagination 10k + délai 100 ms entre pages.
- **Aucun affichage intermédiaire** : pas de premier frame avec peu d’étoiles, pas d’indicateur de chargement spécifique au ciel.
- **Calcul après chargement** : `buildStarsFromDb` (projection, bande spectrale, etc.) s’exécute une fois toute la liste disponible ; pour des dizaines de milliers d’étoiles, le coût CPU est non négligeable mais reste secondaire par rapport au réseau.

---

## 4. Pistes d’amélioration (sans code)

### 4.1 Chargement progressif (recommandé)

- **Afficher le ciel dès que la passe 1 est disponible** (magnitude ≤ 6,5) : quelques centaines d’étoiles, rendu réaliste immédiat.
- Ensuite **mettre à jour** avec la passe 2 (proches ≤ 100 al), puis la passe 3 **par blocs** (ex. 10k par 10k), sans bloquer le premier rendu.
- À chaque nouvelle portion reçue : fusion dans `visibleForSky`, recalcul des étoiles à afficher (`rebuildStars` ou équivalent), redessin. L’utilisateur voit le ciel se remplir progressivement au lieu d’attendre un chargement complet.

Effet attendu : **temps jusqu’au premier affichage** fortement réduit ; l’attente perçue diminue même si le chargement total reste long.

### 4.2 Ne plus attendre la fin des 3 passes pour le premier frame

- Aujourd’hui : `await fetchVisibleForSky(...)` bloque jusqu’à `skyFullyLoaded`.
- Variante : lancer `fetchVisibleForSky` en tâche de fond et, **dès que la passe 1** (ou passe 1 + 2) est prête, mettre à jour `visibleForSky` avec ces seules données, appeler `rebuildStars()` et lancer le premier `draw()`.
- Les passes suivantes continuent en arrière-plan et mettent à jour `visibleForSky` par fusion ; à chaque mise à jour, on peut déclencher un nouveau `rebuildStars` + redessin pour un remplissage progressif (voir 4.1).

### 4.3 Découpler constellations et premier affichage

- Garder `fetchConstellationLines()` en parallèle (déjà dans `Promise.all`).
- Ne pas bloquer l’affichage des étoiles sur la fin de `fetchConstellationLines` : afficher les étoiles dès que la première portion de `visibleForSky` est prête ; les lignes de constellation apparaissent quand leur chargement est terminé (éventuellement avec un indicateur « constellations en cours de chargement » si utile).

### 4.4 Alléger la passe 3

- Réduire la magnitude limite (ex. 15 au lieu de 18) pour moins de données et moins de pages.
- Ou charger la passe 3 en **lazy** après le premier affichage (passe 1, voire 1+2) : l’utilisateur voit d’abord le ciel « principal », le ciel profond se charge ensuite.

### 4.5 Feedback visuel

- Indicateur « Chargement du ciel… » pendant la passe 1, puis « Ciel profond… » pendant la passe 3.
- Optionnel : afficher le nombre d’étoiles chargées (ex. « 2 341 étoiles ») pour rassurer et montrer la progression.

### 4.6 Cache / persistance

- Pour un même `currentSystemId`, réutiliser `visibleForSky` déjà chargé si l’utilisateur quitte puis revient sur l’Observatoire, avec invalidation au changement de système. Réduit les rechargements complets inutiles.

### 4.7 Calcul (secondaire)

- Si la liste devient très grande, envisager un **Web Worker** pour `buildStarsFromDb` / projection afin de ne pas bloquer le thread principal.
- Réduire les double calculs (ex. liste « constellations » avec `skipExoplanetFilter`) par cache ou recalcul différé si possible.

---

## 5. Synthèse

| Problème | Piste principale |
|----------|-------------------|
| Rien à l’écran avant la fin du chargement | **Chargement progressif** : afficher dès la passe 1, puis mettre à jour avec passes 2 et 3 |
| Attente perçue longue | Premier frame rapide + indicateur de chargement + optionnellement nombre d’étoiles |
| Passe 3 lourde | Réduire magnitude max et/ou charger passe 3 en lazy après premier affichage |
| Rechargements répétés | Cache de `visibleForSky` par système courant |

Une **stratégie de chargement progressif** (4.1 + 4.2) est la voie la plus efficace pour améliorer la réactivité perçue sans changer fondamentalement le modèle de données ni les RPC.

---

## 6. Implémentation (2026-03-15)

- **Chargement progressif** : SkyCanvas n’attend plus la fin de `fetchVisibleForSky`. Après `ensureStoresLoaded`, un premier `rebuildStars()` affiche tout de suite les étoiles (source `list` ou fallback procédural). Puis `fetchVisibleForSky()` et `fetchConstellationLines()` sont lancés en arrière-plan. À chaque mise à jour de `visibleForSky` (passe 1, 2, 3), le watch sur `visibleForSky.length` appelle `rebuildStars()` : le ciel se remplit progressivement.
- **Constellations découplées** : `fetchConstellationLines()` n’est plus dans un `await Promise.all`. Les étoiles s’affichent dès le premier frame ; les lignes de constellation apparaissent quand leur chargement est terminé.
- **Changement de système** : le watch sur `currentSystemId` lance `fetchVisibleForSky(newId, 18)` sans await ; le watch sur `visibleForSky.length` gère les `rebuildStars()` à chaque passe.
