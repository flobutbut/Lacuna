# 18 mars 2025 — Audit fonctions hors composables

Audit des fonctions définies dans `<script setup>` des composants et vues (`src/components/`, `src/views/`) qui ne manipulent pas directement le DOM ou le template, ne dépendent pas de refs locales au composant (ou pourraient recevoir leurs données en arguments), et pourraient être déplacées dans un composable (`src/composables/`) ou dans `src/lib/`. Mode lecture seule — aucune modification des fichiers source.

---

## FICHIER : src/components/SkyCanvas.vue

- → ✅ Fonction : `distanceToSegment(px, py, x1, y1, x2, y2)` — calcul pur (distance point–segment), pas de refs ni DOM — appartient à **lib/** (ex. `lib/geometry.js` ou `lib/mathUtils.js`)
- → ✅ Fonction : `lerpAngle(a, b, t)` — calcul pur (interpolation d’angle en degrés), pas de refs — appartient à **lib/** (ex. `lib/formatUtils.js` ou `lib/mathUtils.js`)

---

## FICHIER : src/components/SystemView.vue

- → ✅ Fonction : `ringSizeForPlanet(diameterPx)` — calcul pur (rayon, stroke, size des anneaux à partir du diamètre), pas de refs — appartient à **lib/** (ex. `lib/ringUtils.js` ou `lib/orbitalUtils.js`)
- → ✅ Fonction : `getSpectralLetter(obj)` — logique dérivée de `lib/starClassification.getSpectralLetter` (qui prend une chaîne) ; variante prenant un objet (type, spectral_type) — réutiliser ou étendre **lib/starClassification.js**
- → ✅ Fonction : `distanceAuToPx(distanceAu)` — logique pure si les bornes et largeur de piste sont passées en arguments (orbitStartPx, minDistanceAu, maxDistance, largeur) — pourrait être **lib/orbitalUtils.js** ou **lib/systemObjectConverters.js**

---

## FICHIER : src/components/carte/CarteMapView.vue

- → ✅ Fonction : `getStarIconUrl(node)` — si on passait en argument la map `stellarBySystemId` (ou `spectralType`), calcul pur (node + stellar → URL) — logique partageable dans **lib/** (ex. avec `getStarSvgPath`) ou **composable** pour la carte

---

## FICHIER : src/components/carte/CarteOrbitalView.vue

- → ✅ Fonction : `orbitEase(t)` — calcul pur (ease-out cubique : `1 - (1 - t)^3`), pas de refs — appartient à **lib/** (ex. `lib/animationUtils.js` ou `lib/formatUtils.js`)
- → ✅ Fonction : `radiusToDiameterPx(radiusEarth)` — logique pure si `minBodyRadius`, `maxBodyRadius` et constantes sont passés en arguments — pourrait être **lib/bodyRadius.js** ou **lib/orbitalUtils.js**
- → Fonction : `distanceAuToPx(distanceAu)` — idem SystemView : logique pure avec paramètres explicites — **lib/orbitalUtils.js**

---

## FICHIER : src/components/SideLeft.vue

- → Fonction : `supportLabel(support)` — mapping pur (GRAVITATIONNEL → "Grav", etc.), pas de refs — appartient à **lib/formatUtils.js** ou **constants/** (ex. libellés des supports de signal)

---

## FICHIER : src/components/ObservatoirePanel.vue

- → Fonction : `getBodyDisplayName(body)` — nom d’affichage à partir de `body` et du nom du système ; si le nom système est passé en argument, logique pure — appartient à un **composable** (ex. `useBodyDisplay`) ou **lib**
- → Fonction : `getStarOnlyBody(star)` — construction d’un corps synthétique pour l’étoile seule, logique pure — **lib/** ou **composable**
- → Fonction : `addObservationPayload(body)` — construction du payload observation (utilise store pour niveau) ; variante avec paramètres explicites partageable avec PageCarte — **composable** (ex. `useObservationPayload`)

---

## FICHIER : src/views/PageCarte.vue

- → Fonction : `planetTypeLabel(obj)` — mapping type DB → libellé affichage (PLANET → PLANETE, etc.), calcul pur — appartient à **lib/** (ex. `constants/objectTypes.js` ou `lib/formatUtils.js`)
- → Fonction : `formatCoordinates(stellar)` — formatage coordonnées (ra/dec ou x,y,z) en chaîne, calcul pur — **lib/formatUtils.js** ou **lib/stellarCoordinates.js**
- → Fonction : `addObservationPayload(body, systemName, systemId, distance)` — même logique que ObservatoirePanel, partageable — **composable** ou **lib**

---

## FICHIER : src/components/lab/LabReportMagneto.vue

- → Fonction : `interpolateCyanAmber(t)` — calcul pur (t → couleur RGB cyan→amber), pas de refs — appartient à **lib/** (ex. `lib/labColors.js` ou `lib/formatUtils.js`) ; à mutualiser avec LabReportMorpho et LabReportVolumetrique
- → Fonction : `formatB(n)` — formatage champ magnétique (nT / µT), calcul pur — **lib/formatUtils.js** ou **lib/magnetoData.js**

---

## FICHIER : src/components/lab/LabReportMorpho.vue

- → Fonction : `interpolateCyanAmber(t)` — idem LabReportMagneto, calcul pur couleur — **lib/** (mutualiser)
- → Fonction : `getShapePath(shape)` — construction path SVG à partir de l’objet shape (elongated, faceted, etc.), calcul pur — **lib/morphoData.js** ou **lib/** dédié lab

---

## FICHIER : src/components/lab/LabReportVolumetrique.vue

- → Fonction : `interpolateCyanAmber(t)` — idem Magneto/Morpho, calcul pur — **lib/** (mutualiser)

---

## FICHIER : src/components/lab/LabReportStructureTemporelle.vue

- → Fonction : `downsample(data, maxPoints)` — sous-échantillonnage de tableau (calcul pur), pas de refs — **lib/** (ex. `lib/spectrogramData.js` ou `lib/arrayUtils.js`)

---

## FICHIER : src/components/illustrations/StarSvgInline.vue

- → Fonction : `getLetter(st)` — dérive la lettre spectrale depuis une chaîne ; duplication de la logique de **lib/starClassification.getSpectralLetter** — utiliser **lib/starClassification.js**

---

## FICHIER : src/views/PagePopulation.vue

- → ✅ Fonction : `formatEffectifTrend(trend)` — mapping pur ('up'|'down'|'stable' → symbole), pas de refs — **lib/formatUtils.js**

---

## FICHIER : src/views/PageSystemes.vue

- → Fonction : `formatNum(n)` — formatage nombre (Intl fr-FR), calcul pur — **lib/formatUtils.js** (cohérent avec `formatDate`, `formatRelativeTime`)

---

## FICHIER : src/views/PageArtefacts.vue

- → Fonction : `getTraceIcon(type)` — mapping type trace → icône (utilisation de TRACE_ICONS), calcul pur — **constants/** ou **lib/** (ex. exposé depuis `constants/menus.js` ou module dédié)

---

## FICHIER : src/views/PageLaboratoire.vue

- → Fonction : `getGraphName(instrumentId)` — mapping pur instrumentId → libellé graphique, pas de refs — **lib/** ou **constants/**
- → Fonction : `getAnalysisConclusion(obs, reportCount)` — logique pure (structure/support → conclusion texte), pas de refs — **lib/** (ex. module conclusions ou laboratoire)
- → Fonction : `getObsFilterType(obs)` — mapping type observation → type filtre (STAR→ETOILE, etc.), calcul pur — **lib/** ou **constants/**
- → Fonction : `getObservationIcon(obs)` — obs → `{ type, value }` pour icône, calcul pur — **lib/** ou **composable** partagé

---

## FICHIER : src/components/SignalModal.vue

- → Fonction : `signalToObsPayload(s)` — construction du payload observation à partir d’un signal ; utilise `obsStore.NIVEAUX` pour le niveau — logique partageable dans un **composable** (ex. `useObservationPayload`) ou **lib** avec constantes en paramètre

---

## FICHIER : src/components/AppSelect.vue

- → Fonction : `getValue(opt)` / `getLabel(opt)` — si on passait `valueKey` / `labelKey` et `opt` en arguments, calcul pur (extraction de clé d’option) — pourrait être **lib/** (ex. `lib/optionUtils.js`) pour réutilisation dans d’autres selects

---

*Fichiers parcourus : tous les .vue de src/components/ (54 fichiers) et src/views/ (9 fichiers). Seuls les fichiers contenant au moins une fonction éligible sont listés ci-dessus. Les fonctions de rendu (render, draw), gestion d’événements (handleClick, onDocumentClick), et celles qui dépendent fortement de refs template ou de stores sans forme injectable n’ont pas été retenues.*
