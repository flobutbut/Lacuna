*Dernière modification : 2026-03-15*

# Diagnostic de faisabilité — Zoom dans l’Observatoire

## Contexte

Aujourd’hui l’Observatoire a un **FOV fixe de 120°** (demi-angle 60°) : toute la projection et le culling sont basés sur cette valeur. Ce document évalue ce qu’impliquerait l’ajout d’un **zoom** (réduire le champ pour « rapprocher » le ciel), sans proposer de code.

---

## 1. Architecture actuelle (rappel)

- **Projection** : `stellarProjection.js` — FOV 120° en constante (`FOV_DEG`, `FOV_HALF`). `projectStarInFov(ra, dec, raView, decView, w, h)` :
  - calcule l’angle entre la direction (ra, dec) et la vue (raView, decView) ;
  - si `angleDeg > 60` → `return null` (étoile hors champ) ;
  - sinon projection stéréographique avec `scale` dépendant de `FOV_HALF`.
- **Données** : `visibleForSky` (RPC `get_visible_systems` avec magnitude ≤ 18) → `forSky()` → `buildStarsFromDb` → liste d’étoiles déjà en mémoire. Aucun filtre côté client par angle.
- **Rendu** : `drawStars` appelle `projectStarInFov` pour chaque étoile ; les `null` ne sont pas dessinées. Constellations, nébuleuses et signaux s’appuient aussi sur cette projection (positions écran).

Donc : **qui est visible à l’écran** est déterminé uniquement dans la couche **projection** (FOV 120°), pas dans la base ni dans le chargement.

---

## 2. Zoom = FOV variable + réalité technique (télescope)

### 2.1 Réduction de champ (FOV)

- **Sémantique** : « Zoomer » = réduire le champ (ex. 60°, 30°, 15°) → on voit moins de ciel, les objets gardent la même taille angulaire donc apparaissent plus grands à l’écran.
- **Implémentation logique** : FOV variable (ex. [15° … 120°]), stocké dans le store UI.

### 2.2 Réalité technique : un télescope révèle plus d’étoiles

En pratique, quand on utilise un **télescope** (zoom / instrument plus puissant), on ne fait pas que « cadrer plus serré » : on **collecte plus de lumière** et on voit des étoiles **plus faibles** (magnitude limite plus profonde). À champ réduit, un instrument donné montre donc à la fois un champ plus étroit et, dans ce champ, davantage d’étoiles jusqu’à une magnitude plus faible.

Pour coller à cette réalité dans l’Observatoire :

- **Zoom = FOV + magnitude limite** : quand l’utilisateur « zoome » (réduit le FOV), on peut associer une **magnitude limite plus profonde** (ex. 18 → 20 → 22). Ainsi, en zoomant, on affiche non seulement le même ciel « en plus gros », mais **plus d’étoiles** (les plus faibles deviennent visibles), comme avec un télescope.
- **Conséquence données** : il faut alors **recharger ou compléter** la liste des étoiles avec un `p_magnitude_limit` plus élevé lorsque le zoom dépasse un certain seuil (ou par paliers). Le RPC `get_visible_systems` supporte déjà ce paramètre ; pas de changement de schéma DB, seulement des appels avec une limite plus profonde (et éventuellement fusion des résultats dans `visibleForSky`).
- **Conséquence volumétrie** : plus de magnitude = plus de lignes retournées par le RPC. Il peut être pertinent de charger le « ciel profond » (ex. mag 18–21) **à la demande** quand l’utilisateur zoome (ou par paliers de zoom), plutôt que de tout charger d’emblée à la magnitude max, pour limiter le volume et le temps de chargement.

---

## 3. Impact par couche

### 3.1 Étoiles visibles / non visibles

- **Sans lien zoom ↔ magnitude** (zoom = FOV seul) : la liste reste celle chargée à mag ≤ 18. Le culling par angle fait qu’en zoomant on dessine **moins** d’étoiles (hors cône). Comportement correct pour la géométrie, mais **irréaliste** par rapport à un télescope (en vrai, en zoomant on voit plus d’étoiles faibles).
- **Avec lien zoom ↔ magnitude** (réalité télescope) : quand le zoom dépasse un seuil (ex. FOV < 60°), on **complète ou recharge** avec une magnitude limite plus profonde (ex. 20 ou 21) via `get_visible_systems(p_magnitude_limit = 21)`. On fusionne les nouveaux systèmes dans `visibleForSky` (sans doublons). Ainsi, en zoomant, l’utilisateur voit **plus d’étoiles** (les faibles apparaissent), comme avec un instrument plus puissant.
- **Culling** : inchangé ; les étoiles hors FOV ne sont pas dessinées. La différence est que la **liste** elle-même s’enrichit quand on zoome (si on a choisi d’associer zoom et magnitude).
- **Stratégie de chargement** : déclencher un fetch « ciel profond » (mag 18–21) lorsque l’utilisateur zoome au-delà d’un certain niveau, ou par paliers (ex. FOV < 45° → mag 20, FOV < 30° → mag 21). Éviter de charger d’emblée toute la sphère à mag 22 pour limiter le volume et le temps de réponse.

### 3.2 Base de données

- **Zoom = FOV seul** : aucun impact ; même jeu de données, même RPC.
- **Zoom = FOV + magnitude (télescope)** : toujours **aucun changement de schéma**. On réutilise le même RPC `get_visible_systems` en passant un `p_magnitude_limit` plus élevé (ex. 20, 21) lorsque l’utilisateur zoome. La base contient déjà les magnitudes (ou le calcul M_abs + distance) ; on demande simplement plus d’étoiles (plus faibles). Attention au **volume** : un appel avec mag ≤ 21 peut retourner nettement plus de lignes qu’à 18 — pagination et chargement à la demande (au zoom) restent importants.

### 3.3 Spatialisation et projection

- **Formule actuelle** : `scale = (max(w,h)/2) / (2 * tan(FOV_HALF * RAD / 2))`, puis position écran via angle et projection stéréographique. Tout dépend de `FOV_HALF`.
- **Modification nécessaire** : `projectStarInFov` (et toute fonction qui en dépend) doit utiliser un **FOV passé en paramètre** (ou lu depuis un contexte/store) au lieu des constantes `FOV_DEG` / `FOV_HALF`.
- **Conséquences** :
  - **stellarProjection.js** : paramètre supplémentaire (ex. `fovDeg` ou `fovHalf`) dans `projectStarInFov`, et dans `projectNebulaShape` (qui appelle `projectStarInFov`). Les helpers type `getOffscreenStarAzimuth` utilisent aussi `FOV_HALF` → à alimenter avec le FOV courant.
  - **skyRenderers.js** : reçoit déjà (raView, decView, w, h) ; il faudra lui passer le FOV (ou le faire lire depuis le store) pour les appels à `projectStarInFov`.
  - **SkyCanvas** : lit le FOV (ou niveau de zoom) dans le store, le passe à `draw()`, puis à `drawStars`, `drawConstellationLines`, etc. Les positions projetées (constellations, tooltips, etc.) doivent toutes utiliser le **même** FOV pour rester cohérentes.

Aucune nouvelle spatialisation physique : on ne change pas les coordonnées 3D ni la formule de magnitude, seulement le **champ de vue** utilisé pour projeter sur l’écran.

### 3.4 Éléments du rendu


| Élément                              | Dépendance FOV                                    | Action                                                                                                                            |
| ------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Étoiles                              | `projectStarInFov`                                | Passer FOV variable, culling et scale adaptés automatiquement.                                                                    |
| Constellations                       | Positions projetées des étoiles (même projection) | Dès que les positions sont calculées avec le bon FOV, les segments suivent.                                                       |
| Nébuleuses                           | `projectNebulaShape` → `projectStarInFov`         | Idem : passer le FOV dans la chaîne d’appels.                                                                                     |
| Signaux                              | Projection (ra, dec) → écran                      | Utiliser le même FOV pour cohérence.                                                                                              |
| Grille / Voie lactée                 | Actuellement indépendantes du FOV                 | Optionnel : adapter l’échelle ou la densité au FOV pour un rendu plus naturel (sinon la grille peut paraître trop dense en zoom). |
| Bordure spectrale, réticule, azimuth | Écran ou direction uniquement                     | Pas d’impact direct.                                                                                                              |


### 3.5 UX et contrôle du zoom

- **Contrôle** : molette, pinch, ou boutons +/-. La valeur (FOV ou « niveau de zoom ») est stockée dans le store UI et éventuellement persistée (localStorage) comme les autres préférences Observatoire.
- **Limites** : borner le FOV (ex. min 15°, max 120°) pour éviter abus et problèmes numériques (tan très petit quand FOV → 0).

---

## 4. Synthèse faisabilité


| Thème                       | Zoom FOV seul                                | Zoom « télescope » (FOV + magnitude)                                                                                  |
| --------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Étoiles visibles            | Culling par angle ; même liste.              | Liste enrichie au zoom (fetch mag plus profonde) ; plus d’étoiles affichées dans le cône.                             |
| Base de données             | Aucun impact.                                | Pas de changement de schéma ; appels RPC avec `p_magnitude_limit` plus élevé.                                         |
| Chargement                  | Inchangé.                                    | Complément ou re-fetch quand zoom > seuil ; fusion dans `visibleForSky` ; attention au volume (pagination / paliers). |
| Spatialisation / projection | FOV paramétrable, propagé partout.           | Idem.                                                                                                                 |
| Rendu                       | FOV passé à tous les appels de projection.   | Idem.                                                                                                                 |
| Performance                 | Moins d’étoiles dessinées en zoom (culling). | Plus d’étoiles en mémoire et dessinées en zoom ; coût maîtrisé par chargement à la demande.                           |


**Conclusion** : l’intégration d’un zoom est **faisable** avec deux niveaux possibles :

1. **Zoom « vue seule »** (FOV variable) : pas de changement de données ni de RPC. On paramètre le FOV et on le propage à la projection. En zoomant on dessine moins d’étoiles (culling), en dézoomant elles réapparaissent.
2. **Zoom « télescope »** (FOV + magnitude) : en plus du FOV, on associe une **magnitude limite plus profonde** quand l’utilisateur zoome, et on (re)charge ou complète `visibleForSky` via `get_visible_systems` avec un `p_magnitude_limit` plus élevé. Ainsi on voit **plus d’étoiles** en zoomant, conformément à la réalité technique d’un instrument qui révèle les objets faibles. Le coût est un volume de données plus important et des appels RPC supplémentaires au zoom ; un chargement par paliers ou à la demande permet de maîtriser la charge.

