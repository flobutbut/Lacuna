# 18 mars 2025 — Audit imports inutilisés

Audit des imports, variables/refs/fonctions et props déclarés mais jamais utilisés dans `src/` (composants, composables, stores, lib, constants, views). Mode lecture seule — aucune modification des fichiers source.

---

## FICHIER : src/components/SystemView.vue

- → Variable inutilisée : `luminosity` (computed dérivé de `luminosityAndHz.value.luminosity`, jamais lue dans le template ni le script)
- → Variable inutilisée : `scrollContentWidthPx` (computed déclaré, jamais utilisée dans le template ni le script)

---

## FICHIER : src/components/ObservatoireSpectralFilters.vue

- → Variable inutilisée : `searchMatches` (destructurée de `useStellarSearch`, jamais utilisée dans le fichier)
- → Variable inutilisée : `currentMatchIndex` (destructurée de `useStellarSearch`, jamais utilisée dans le fichier)

---

*Fichiers parcourus : main.js, App.vue, router/index.js, composants (SkyCanvas, AppHeader, Reticule, TravelWidget, SystemView, StarAutocompleteMenu, StarTooltip, ObservatoireViewTabs, SideLeft, SideRight, AppSelect, InstrumentsBar, ObservatoireSpectralFilters, ObservatoirePanel, ObservatoireTooltip, ObservationCard, AppModal, ProgressBar, InstrumentButton, NavTabButton, NavMenuItem, ModalCell, Divider, CarteMapView, CarteMap3D, CarteOrbitalView, CarteSystemCard, Stars3DCanvas), vues (PageCarte, PageObservatoire, PageConceptionEtoiles), composables (useStellarSearch, useCameraFocusAnimation, useStarHighlight, useCarteMapPanZoom, useCarteMapProjection, useSkyStars, useStars3DConception, useStarTooltipData), lib (skyRenderers, starSpriteTexture, formatUtils), stores (counter), assets/illustrations/stars/index.js. Les autres fichiers de src/ n’ont pas été listés ci‑dessus lorsqu’aucune anomalie n’a été détectée.*
