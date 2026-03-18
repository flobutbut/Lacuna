# 18 mars 2025 — Audit doublons

Audit de l’ensemble de `src/` pour repérer les fonctions ou blocs de logique qui font la même chose dans plusieurs fichiers — même logique, noms différents, ou copier-coller légèrement modifié. Mode lecture seule — aucune modification des fichiers source.

---

## DOUBLON détecté

- → **src/lib/starClassification.js** : `getSpectralLetter(spectralType)` — lettre spectrale depuis une chaîne (PSR/PULSAR → 'PULSAR', sinon première lettre OBAFGKM…)
- → **src/components/illustrations/StarSvgInline.vue** : `getLetter(st)` — logique identique (st string → PSR/PULSAR ou première lettre)
- **Recommandation :** supprimer `getLetter` dans StarSvgInline et utiliser `getSpectralLetter` depuis `lib/starClassification.js`.

---

## DOUBLON détecté

- → **src/lib/starClassification.js** : `getSpectralLetter(spectralType)` — accepte une chaîne
- → **src/components/SystemView.vue** : `getSpectralLetter(obj)` — variante qui accepte un objet (`obj.type === 'PULSAR'`, `obj.spectral_type`), même sortie lettre
- **Recommandation :** faire appeler par SystemView la lib en passant `obj.spectral_type` (et gérer PULSAR via `obj.type`) ou ajouter dans la lib une helper `getSpectralLetterFromObject(obj)` qui centralise la logique.

---

## DOUBLON détecté

- → **src/components/lab/LabReportMagneto.vue** : `interpolateCyanAmber(t)` — gradient RGB cyan (0,180,200) → amber (232,160,32), même formule
- → **src/components/lab/LabReportMorpho.vue** : `interpolateCyanAmber(t)` — code identique (copier-coller)
- → **src/components/lab/LabReportVolumetrique.vue** : `interpolateCyanAmber(t)` — code identique (copier-coller)
- **Recommandation :** consolider dans **lib/** (ex. `lib/labColors.js` ou `lib/formatUtils.js`) et importer dans les trois composants.

---

## DOUBLON détecté

- → **src/components/SystemView.vue** : `distanceAuToPx(distanceAu)` — échelle log (log10(1+d)), normalisation entre min/max, retour `orbitStartPx + t * ORBITAL_TRACK_WIDTH_PX`
- → **src/components/carte/CarteOrbitalView.vue** : `distanceAuToPx(distanceAu)` — même formule (log10(1+d), logMin/logMax, `orbitStartPx + t * orbitTrackWidth`)
- **Recommandation :** extraire une fonction pure dans **lib/orbitalUtils.js** (ou **lib/systemObjectConverters.js**) prenant `(distanceAu, orbitStartPx, minDistanceAu, maxDistanceAu, trackWidthPx)` et réutiliser dans les deux composants.

---

## DOUBLON détecté

- → **src/components/ObservatoirePanel.vue** : `addObservationPayload(body)` — construit `{ name, type, system, system_id, distance, coords, niveau }` avec `needsOrbit` (ATMOSPHERE / PLANETE avec has_atmosphere)
- → **src/views/PageCarte.vue** : `addObservationPayload(body, systemName, systemId, distance)` — même structure et même logique `needsOrbit`, commentaire « aligné sur ObservatoirePanel »
- **Recommandation :** consolider dans un **composable** (ex. `useObservationPayload`) ou dans **lib/** avec signature unique recevant (body, systemName, systemId, distance, obsStore.NIVEAUX).

---

## DOUBLON détecté

- → **src/stores/observations.js** (ligne ~82) : `.select('id, type, system_id, system_display, name, state, niveau, coords, distance, support, structure, duration_sec, date, anomalous')` pour le fetch
- → **src/stores/observations.js** (ligne ~159) : même chaîne `.select(...)` après un `.insert(...)`
- **Recommandation :** définir une constante (ex. `OBSERVATIONS_SELECT_COLUMNS`) dans le store et réutiliser pour les deux appels.

---

## DOUBLON détecté

- → **src/components/SignalModal.vue** : `signalToObsPayload(s)` — construit `name = \`${s.frequency} · azimut ${s.azimuth}°\``
- → **src/stores/observations.js** : `findObservationForSignal(signal)` — compare avec `expectedName = \`${signal.frequency} · azimut ${signal.azimuth}°\``
- **Recommandation :** extraire la construction du nom signal dans une fonction partagée (ex. **lib/formatUtils.js** ou **constants**) : `formatSignalObservationName(signal)` et l’utiliser dans SignalModal et dans le store pour garantir cohérence.

---

## DOUBLON détecté

- → **src/components/SideLeft.vue** : `SUPPORT_LABELS` + `supportLabel(support)` — mapping GRAVITATIONNEL → 'Grav', GAMMA_X → 'γ/X', EM_RADIO → 'EM'
- → **src/views/PageLaboratoire.vue** : `SIGNAL_SUPPORTS` — mapping des mêmes clés avec libellés plus longs (EM_RADIO → 'EM radio', etc.)
- **Recommandation :** centraliser les libellés des supports de signal dans **constants/** (ex. `constants/signaux.js` ou dans un module dédié) avec éventuellement court/long, et réutiliser partout.

---

## DOUBLON détecté

- → **src/lib/starClassification.js** : `formatDistanceLy(distanceLy)` — formate en « X al » avec arrondi (toFixed 2/1/0 selon grandeur)
- → **src/views/PageCarte.vue** / **src/views/PageConceptionEtoiles.vue** : affichage inline `{{ selectedStellar?.distance ?? '—' }} al` sans arrondi ni fonction
- **Recommandation :** utiliser `formatDistanceLy` partout pour l’affichage des distances en années-lumière (cohérence et un seul lieu de règle d’arrondi).

---

## DOUBLON détecté

- → **src/views/PageSystemes.vue** : `formatNum(n)` — `new Intl.NumberFormat('fr-FR').format(n)`
- → **src/views/PageConceptionEtoiles.vue** : `.toLocaleString('fr-FR')` pour un nombre
- → **src/views/PagePopulation.vue** : `.toLocaleString('fr-FR')` pour effectif
- **Recommandation :** ajouter une fonction générique dans **lib/formatUtils.js** (ex. `formatNumber(n, options)`) et l’utiliser dans les vues pour unifier le format nombre français.

---

*Périmètre : parcours de l’ensemble de src/ (composants, composables, stores, lib, constants, views). Seuls les doublons explicites identifiés sont listés ci-dessus.*
