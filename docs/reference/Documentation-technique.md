*Dernière modification : 2026-03-15*

# LACUNA — Documentation technique

*Dernière mise à jour : Mars 2026*

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| **Framework** | Vue 3 (Composition API) |
| **Build** | Vite 7 |
| **Routing** | Vue Router 5 |
| **State** | Pinia |
| **Backend** | Supabase (PostgreSQL, Auth, Realtime) |
| **3D / Canvas** | Three.js |
| **Visualisation données** | D3.js, spectrogram-js (rapports Laboratoire) |
| **Animations** | GSAP, @vueuse/core |
| **Typographie** | Share Tech Mono, Syne (Google Fonts) |

## Structure du projet

```
Lacuna/
├── src/
│   ├── main.js              # Point d'entrée
│   ├── App.vue              # Layout racine (Header, InstrumentsBar, RouterView)
│   ├── views/               # Pages (une par module)
│   │   ├── observatoire/
│   │   │   ├── PageObservatoire.vue   # Ciel + exploration
│   │   │   ├── RadarView.vue          # Spectrogramme temps réel + courbe d'intensité
│   │   │   └── SystemView.vue         # Vue système (étoile + planètes, mode Observatoire)
│   │   ├── PageCarte.vue
│   │   ├── PageArtefacts.vue
│   │   ├── PageJournal.vue
│   │   ├── PageDrake.vue
│   │   ├── PagePopulation.vue
│   │   ├── PageConceptionEtoiles.vue   # Vue 3D étoiles (conception, /conception-etoiles)
│   │   ├── auth/            # PageConnexion, PageInscription, PageMotDePasseOublie, PageNouveauMotDePasse, PageBienvenue (création de partie) — AuthPanel + AppTextField
│   │   └── ...
│   ├── stores/
│   │   ├── supabase.js      # Store Supabase
│   │   ├── stellarSystems.js # Systèmes stellaires (ciel Observatoire)
│   │   ├── systemObjects.js  # Objets des systèmes (étoiles, planètes, disques)
│   │   ├── ship.js           # Vaisseau (ARCA, current_system_id, systems, fuel)
│   │   ├── observations.js  # File d'observations Laboratoire (persisté Supabase ou mémoire)
│   │   ├── observatoire.js  # Sélection/survol (étoile, corps, signal, constellation), réticule, vue, filtres ciel, recherche
│   │   ├── radar.js         # Réglages Radar (bande, pause, sélection, échelle temps, seuil, fréquences, son, bruit)
│   │   ├── transit.js       # Widget de voyage, cap en attente, confirmation de départ
│   │   ├── notifications.js # Toast global, pastilles Laboratoire / Carte
│   │   ├── auth.js          # Session Supabase du joueur : inscription, connexion, mot de passe, déconnexion ; profil (pseudo, rôle), hasShip, isAdmin, startNewGame, updatePseudo
│   │   ├── mapNodes.js      # Nœuds et arêtes carte (map_nodes, map_edges)
│   │   ├── signaux.js       # Signaux captés (récepteur Observatoire), table signals
│   │   ├── labReports.js    # Rapports d'analyse Laboratoire (lab_reports)
│   │   ├── nebulas.js       # Nébuleuses (nuages IR)
│   │   ├── drake.js         # Équation de Drake (drake_equation)
│   │   └── traces.js        # Traces immuables + traces joueur, interprétations (Artefacts)
│   ├── components/          # Composants Vue
│   │   ├── AppHeader.vue
│   │   ├── SkyCanvas.vue
│   │   ├── InstrumentsBar.vue
│   │   ├── SideLeft.vue, SideRight.vue
│   │   ├── Reticule.vue, StarTooltip.vue, SignalTooltip.vue
│   │   ├── ObservationCard.vue (cards signaux Observatoire + observations Laboratoire)
│   │   ├── NavMenuItem.vue (menu Systèmes, Population — items pleine largeur ; grille Artefacts)
│   │   ├── NavTabButton.vue (barre navigation — onglets modules)
│   │   ├── InstrumentButton.vue (grille boutons carrés — Laboratoire, réutilisable)
│   │   ├── TravelWidget.vue, NotificationToast.vue
│   │   ├── observatoire/          # Composants Observatoire (panel, filtres, tooltip)
│   │   │   ├── ObservatoirePanel.vue, ObservatoireViewTabs.vue, ObservatoireTooltip.vue
│   │   │   ├── ObservatoireSpectralFilters.vue, ObservatoireRadarFilters.vue, ObservatoireAzimuth.vue
│   │   ├── conception/
│   │   │   └── Stars3DCanvas.vue       # Vue 3D Three.js (conception)
│   │   ├── lab/
│   │   │   ├── LabReportSpectrogram.vue       # Sortie spectrogramme (analyseur spectral)
│   │   │   ├── LabReportStructureTemporelle.vue  # Forme d'onde + autocorrélation (structure temporelle)
│   │   │   ├── LabReportPolarisation.vue      # Ellipse de polarisation + Stokes (polarisation)
│   │   │   ├── LabReportSpectreEnergetique.vue   # Spectre énergétique (gamma/X)
│   │   │   ├── LabReportGravimetrique.vue     # Modèle sources + résidus (gravimétrique)
│   │   │   ├── LabReportSpectreStellaire.vue  # Spectre + courbe de lumière
│   │   │   ├── LabReportOrbital.vue           # Diagramme orbital + paramètres (a, e, i, P)
│   │   │   ├── LabReportAtmosphere.vue        # Profil moléculaire (spectromètre atmosphérique)
│   │   │   ├── LabReportMagneto.vue          # Champ magnétique (magnétomètre)
│   │   │   ├── LabReportMorpho.vue           # Scanner morphologique (formes)
│   │   │   └── LabReportVolumetrique.vue     # Analyse volumétrique
│   ├── composables/         # Logique réutilisable (Vue)
│   │   ├── useCameraFocusAnimation.js  # Animation caméra/OrbitControls vers position cible — Stars3DCanvas, CarteMap3D
│   │   ├── useSkyStars.js   # Construction liste étoiles (DB / fallback) — Observatoire, projection x/y/z → ra/dec
│   │   ├── useStars3DConception.js  # Vue 3D conception — barycentre, points 3D
│   │   ├── useStellarSearch.js      # Recherche systèmes/constellations/signaux — Observatoire + Vue 3D conception
│   │   ├── useStarHighlight.js     # Sprite highlight étoile (taille, scale) — Observatoire 3D
│   │   ├── useStarTooltipData.js    # Données tooltip étoile (distance, exoplanètes, etc.) — StarTooltip
│   │   ├── useStarSelection.js     # Sélection étoile (recherche + clic) — Observatoire et Vue 3D
│   │   ├── useStarSvgTexture.js    # Texture SVG par type spectral — Carte 3D
│   │   ├── useTransitLines3d.js   # Lignes de transit 3D (LineSegments, opacité) — CarteMap3D, Stars3DCanvas
│   │   ├── useStoreReady.js # ensureStoresLoaded() — chargement stores au montage
│   │   ├── useDepartureConfirmation.js # Données vue confirmation départ (durée, générations, phrases) — DepartureConfirmation.vue
│   │   ├── useRadarSpectrogram.js  # Spectrogramme Radar — buffer circulaire, tickCount, appendColumn — RadarView
│   │   ├── useThreeStarScene.js    # Scène Three.js partagée (caméra, contrôles, picking, focus, nettoyage) — CarteMap3D, Stars3DCanvas
│   │   └── useViewerSystemPolicy.js # Système courant (viewer) + exclusion ciel/recherche selon contexte (observatoire vs conception3d)
│   ├── constants/           # Constantes partagées
│   │   ├── objectTypes.js   # OBJECT_TYPE_LABELS (affichage Observatoire, Laboratoire)
│   │   ├── starDisplay.js   # Couleurs highlight (HIGHLIGHT_CYAN_*, HIGHLIGHT_3D_SIZE_MULT) — design system
│   │   └── menus.js         # SYSTEMS_MENU_ITEMS, POPULATION_MENU_ITEMS, INSTRUMENTS, TRACE_ICONS
│   ├── lib/
│   │   ├── supabase.js      # Client Supabase
│   │   ├── formatUtils.js   # Formatage (barWidth, formatDate, formatNumber, formatRelativeTime, barClass, valClass, formatRaDec, formatSignalObservationName)
│   │   ├── observationPayload.js  # Payload observation (buildObservationPayload, getBodyDisplayName, getStarOnlyBody, signalToObsPayload) — ObservatoirePanel, PageCarte, SignalModal
│   │   ├── astroConstants.js   # Constantes astronomiques (R⊕, M⊕, UA, R☉/R⊕, etc.)
│   │   ├── systemObjectConverters.js  # Conversion DB → physiques (km, kg) / visuels (px) — couche unique sortie base
│   │   ├── bodyRadius.js    # Rayon en R⊕ (depuis mass_earth / mass_stellar)
│   │   ├── orbitalUtils.js  # Kepler 3 : période (jours) → UA
│   │   ├── ringUtils.js     # Anneaux planétaires (km → px)
│   │   ├── habitableZone.js # Zone habitable (Kopparapu)
│   │   ├── stellarProjection.js  # Projection stéréographique FOV 120° (ra/dec ↔ écran), xyzToRaDec (x/y/z → direction céleste)
│   │   ├── stellarCoordinates.js # parseCoordinates(), getSystemXyz() — parse chaîne → ra/dec, coords xyz
│   │   ├── starSpriteTexture.js  # createCircleSpriteTexture(), getCircleSpriteTexture() — sprites circulaires 3D
│   │   ├── constellationSegments.js # getVisibleConstellationSegments() — filtrage segments (2D/3D)
│   │   ├── skyRenderers.js  # Rendu canvas ciel (Milky Way, grille, nébuleuses, étoiles, signaux) — utilise starDisplay
│   │   ├── labLineChart.js     # Utilitaire D3 partagé (courbes temps×amplitude)
│   │   ├── spectrogramData.js  # Génération données spectrogramme / structure temporelle
│   │   ├── spectreEnergetiqueData.js  # Spectre énergétique (gamma/X)
│   │   ├── polarisationData.js # Paramètres polarisation (Stokes, ellipse)
│   │   ├── gravimetriqueData.js  # Modèle sources + résidus (analyseur gravimétrique)
│   │   ├── spectreStellaireData.js  # Spectre stellaire + courbe de lumière
│   │   ├── orbitalData.js       # Données orbites (analyseur orbital, résonances)
│   │   ├── atmosphereData.js    # Profil moléculaire (spectromètre atmosphérique)
│   │   ├── radarSpectrum.js  # Radar : index buffer de colonnes, bornes de fréquence, injection pulsars, échelle dB, libellés temps
│   │   ├── random.js        # seededRandom (mulberry32) — données Laboratoire et Radar
│   │   └── cssVars.js       # getCssVar — tokens CSS pour canvas / Three.js
│   ├── router/
│   │   ├── index.js         # Routes Vue Router + garde d'authentification (beforeEach)
│   │   └── authGuard.js     # Décisions de redirection (meta.public, meta.guestOnly, meta.onboarding, meta.requiresAdmin) — fonctions pures testées
│   └── assets/
│       ├── main.css         # Convention uniquement (non importé ; styles réels : tokens, base, etc.)
│       ├── tokens.css       # Design tokens (couleurs, typo, espacements)
│       ├── base.css
│       ├── layers.css
│       ├── animations.css
│       ├── utilities.css
│       └── components/      # CSS modulaires (artifact, bar, journal, panel...)
├── supabase/
│   ├── config.toml          # Config Supabase CLI
│   ├── migrations/          # Nombreux fichiers (*.sql, 00001 à 00031…), liste à jour dans Documentation-backend.md
│   ├── dumps_critiques/     # Exports PostgreSQL critiques (voir README)
│   └── seed.sql             # Données du monde (systèmes, traces immuables, objets) + signaux modèles ; pas de vaisseau (start_new_game)
├── scripts/                 # Scripts Node/shell (hors stellar_import)
│   ├── generateExtendedSeed.js   # Génère seed étendu (yarn seed:generate)
│   ├── backup-db.sh, pg_dump_critiques.sh
├── docs/
│   ├── reference/           # Documentation principale
│   │   ├── Documentation-technique.md
│   │   ├── Documentation-backend.md   # Schéma DB, migrations, RLS, seed
│   │   ├── Documentation-status.md
│   │   └── Documentation-fonctionnelle.md
│   ├── design/              # Design et UI
│   │   ├── Design-system.md
│   │   └── LACUNA_UI.md
│   ├── conception/          # Vision, GDD, hypothèses
│   │   ├── LACUNA_GDD.md
│   │   ├── LACUNA_vision_v01.md
│   │   ├── LACUNA_HYPOTHESES.md
│   │   └── LACUNA_ARCS.md
│   ├── features/            # Spécifications fonctionnelles
│   │   └── LACUNA_LABORATOIRE_INSTRUMENTS.md
│   ├── config/              # Configuration (i18n, traces)
│   │   ├── LACUNA_I18N_SETTINGS.md
│   │   └── LACUNA_TRACES.md
│   ├── procedural/          # Génération procédurale (modèle, planètes, traces)
│   │   ├── LACUNA_PROCEDURAL_DATA_MODEL.md
│   │   ├── LACUNA_PROCEDURAL_PLANETS.md
│   │   └── LACUNA_PROCEDURAL_TRACES.md
│   ├── analyses/            # Analyses et diagnostics
│   ├── architecture/        # Schémas et architecture
│   └── assets/              # Ressources (SVG, maquettes)
│       └── lacuna_interface.html # Maquette UI de référence
├── stellar_import/          # Import HYG + NASA + constellations → Supabase
│   ├── main.py              # Orchestrateur (--fix-ids, --nasa-only)
│   ├── parse_hyg.py         # Lecture HYG (dist < 500 al), build_system_id
│   ├── parse_nasa.py        # API NASA Exoplanet Archive TAP
│   ├── upsert_systems.py    # Upsert stellar_systems
│   ├── upsert_objects.py    # Upsert system_objects (planètes)
│   ├── complete_hyg_fields.py   # Complète coordinates, constellation_abbr, mag, lum
│   ├── hyg_patch.py            # Patch HYG : constellation_abbr, luminosity, color_index + field_sources
│   ├── nasa_age_patch.py       # Patch NASA : age (Ga) depuis Exoplanet Archive
│   ├── populate_constellations.py  # 88 constellations + constellation_lines (IAU shapes)
│   ├── check_systems.py     # Vérifier champs stellar_systems
│   ├── check_duplicate_systems.py # Détecte doublons HYG/LACUNA
│   ├── diagnose_names.py    # Diagnostique mapping noms
│   ├── diagnose_nasa_planets.py   # Diagnostique planètes NASA
│   ├── supabase_client.py   # Client Supabase (.env)
│   ├── report.py            # Rapport final (import_report.md dans stellar_import/)
│   └── import_report.md     # Généré par main.py
├── Ressources/
│   ├── hyg_v42.csv          # HYG Database (étoiles)
│   └── constellation.shapes.iau.txt  # Paires HR pour segments constellations (IAU)
├── .env                     # Variables Supabase (gitignored)
├── .env.example
├── vite.config.js
└── package.json
```

## Base de données

**Documentation complète** : `docs/reference/Documentation-backend.md` — schéma détaillé, migrations, RLS, seed, mapping stores.

Résumé : Supabase (PostgreSQL). Tables principales : `stellar_systems`, `system_objects`, `constellations`, `constellation_lines`, `traces`, `observations`, `ships`, `populations`, `interpretations`, `map_nodes`/`map_edges`, `drake_equation`.

## Design system et CSS

**Documentation complète** : `docs/design/Design-system.md` — tokens, composants (AppModal, ModalCell, NavMenuItem, NavTabButton, InstrumentButton), utilitaires (sw-row, sw-key, sw-val), règles d'usage.

**Règle impérative :** Les fichiers CSS partagés sont importés directement dans `main.js`. Les CSS propres à une page (`lab`, `carte`, `population`, `journal`, `artifact`, `systems`) sont importés en tête du `<script setup>` de leur vue et chargés avec la route. Ne jamais utiliser `@import` dans un fichier CSS pour importer d'autres **fichiers CSS locaux** — Vite ignore les changements et le HMR ne fonctionne pas. Les `@import` vers des URLs externes (ex. polices Google dans `base.css`) sont admis.

| Fichier | Rôle |
|---------|------|
| `tokens.css` | Variables `:root` (couleurs, typo, espacements, layout) |
| `base.css` | Reset, fonts, styles de base |
| `animations.css` | Animations keyframes |
| `layers.css` | Z-index / couches |
| `utilities.css` | Classes utilitaires (marges, couleurs texte, etc.) |
| `app-modal.css` | AppModal, ModalCell |
| `components/*.css` | Styles par composant (widget, panel, header, etc.) |

**Pour ajouter un nouveau fichier CSS :** partagé → l'ajouter dans `main.js` après les imports existants ; propre à une page → l'importer dans la vue, à condition que **toutes** ses règles soient préfixées par la page (un CSS de route reste actif après navigation : une règle globale changerait l'apparence des autres pages selon l'historique).

## Visualisation — Laboratoire

Stack pour les rendus visuels des instruments (spectrogrammes, spectres, courbes, diagrammes) :

| Lib | Usage |
|-----|-------|
| **D3.js** | Spectres, courbes de lumière, diagrammes orbitaux, polarisation, heatmaps |
| **spectrogram-js** | Spectrogrammes (Analyseur spectral) |
| **Three.js** | Modèles 3D, diagrammes orbitaux, Scanner morphologique |

**Thématisation** — Toutes les visualisations doivent utiliser les tokens LACUNA (`tokens.css`) :
- Fond : `--color-bg` (#03060d)
- Données / axes : `--color-cyan`
- Anomalies / alertes : `--color-amber`
- Texte : `--color-white`, `--color-muted`
- Police : `--font-mono` (Share Tech Mono) pour axes et labels
- Pas de couleurs par défaut des librairies — override systématique

Voir `docs/features/LACUNA_LABORATOIRE_INSTRUMENTS.md` §5 (formats de sortie) et § Annexe.

## Vue Radar (Observatoire)

Composant `RadarView.vue` — spectrogramme temps réel + courbe d'intensité, comportement type Twitch (LIVE / PAUSE + SCROLL / RETOUR AU LIVE).

| Élément | Description |
|---------|-------------|
| **Acquisition** | `useRadarSpectrogram` (PageObservatoire) — échantillons à 250 Hz, `tick()` toutes les 100 ms, `tickCount` (signal réactif). `start()` reprend l'horloge là où elle s'était arrêtée |
| **Signal** | `useRadarNoise` — signal temporel à 250 Hz : bruit thermique + synchrotron (AR(1)) ramené à un écart-type propre à la bande (P ≈ 0,3, L ≈ 0,18, X ≈ 0,07, γ ≈ 0,014, latitude galactique comprise ; raie à 12,5 Hz en bande L ; coupé par `radarNoiseEnabled`), plus les impulsions des pulsars |
| **Pulsars** | `signaux.activePulsarSignals` — pulsars de la **bande active** seulement (L et γ en ont, P et X non). `addPulsarPulses` ajoute au signal, **avant la FFT**, une impulsion gaussienne brève (σ = 2 ms) par période, d'amplitude `PULSAR_PULSE_AMPLITUDE × flux^0,6` (400 écarts-types du bruit L) : même niveau absolu dans toutes les bandes, donc peu visible en P, très visible en γ. Phase propre à chaque pulsar (`pulsarPhaseOffset`). Un pulsar lent (période ≥ ~0,25 s) donne une **barre verticale** par impulsion ; un pulsar rapide, une raie à sa fréquence de rotation et ses harmoniques ; un pulsar milliseconde est filtré par l'échantillonnage |
| **Colonnes** | `useRadarColumnBuffer` — buffer circulaire partagé (`HISTORY_SIZE` = 7 200 colonnes = 12 min), créé une fois, jamais vidé ; champ `count` (colonnes écrites). RadarView écrit **une colonne par tick** (`watch(tickCount)` → `catchUpColumns()`, une fenêtre d'échantillons par tick, injection des pulsars), même masquée ; RadarMiniature lit. Les colonnes gardent les magnitudes brutes : FFT de 256 points sur les 64 derniers échantillons (`RADAR_FFT_WINDOW`, 256 ms, fenêtre de Hann, complétés par des zéros), fréquences croissantes |
| **Échelle de couleur** | En dB, **recalculée sur la fenêtre visible** (temps et zoom fréquentiel) : plancher 10 dB sous le bruit médian, plafond au maximum de la fenêtre, au moins 40 dB d'étendue (`dbDisplayScale`, `dbToLevel`). Même échelle dans la miniature |
| **Échelle de temps** | ms par pixel : 10 ms = zoom ×10 (une colonne de 100 ms sur 10 px), 100 ms = une colonne par pixel, 1 s / 10 s = **maximum** de 10 / 100 colonnes par pixel (`ticksPerPixel`, `ageAtPx`) |
| **Intensité et seuil INT.** | Intensité d'un pixel = niveau moyen (0–1, échelle dB) de la plage de fréquences affichée : une raie continue ne la sature pas, une impulsion large bande la fait monter. Le seuil INT. masque les pixels dont l'intensité reste en dessous ; ligne de seuil sur la même échelle |
| **Rendu** | `drawViewport()` — spectrogramme écrit en pixels (`ImageData`, palette Viridis précalculée), intensité, seuil, repères de temps (`ageLabelInterval`), axes, sélection, réticule ; rien n'est dessiné au-delà de l'historique disponible |
| **Boucle rAF** | `frame()` tourne **seulement quand la vue Radar est affichée** et ne redessine que si `needsDraw` (nouvelle colonne, réglage, pointeur, défilement) |
| **Taille** | `resizeCanvases()` (ResizeObserver) — ajuste les canvas sans toucher aux données |
| **Pause** | `radarStore.radarPaused` — plus de nouvelles colonnes affichées, molette et sélection actives |
| **Reprise** | `watch(radarPaused)` → `catchUpColumns()` rejoue les ticks acquis pendant la pause, retour au live |
| **Scroll** | En pause : `onWheel` modifie `targetScrollOffset`, borné à l'historique disponible |
| **Sélection** | Zone (colonnes × bins) en pause — fréquences via `binAtY` / `binsToYRange` (haut = aigu, zoom fréquentiel compris) — `emit('signal-selected', { startCol, endCol, startBin, endBin, lowHz, highHz })` (bins croissants) |
| **Bouton LIVE** | Affiché quand `currentScrollOffset > LIVE_THRESHOLD` — clic → `targetScrollOffset = 0`, easing vers live |

**Calculs partagés** : `lib/radarSpectrum.js` (index de colonnes, bornes de fréquence, injection pulsars, échelle dB, libellés de temps, correspondance fréquence ↔ hauteur), testés. **Dépendances** : `spectrogramData.js` (`computeSpectrogramColumn`), D3 (`interpolateViridis`), stores `radar`, `observatoire`, `signaux`.

**Mesures (21/10/2026)** : un dessin complet coûte 2 à 4 ms (51 ms auparavant) ; la vue ciel reste à ~9 ms par image avec le radar actif (53 ms auparavant, la vue radar masquée se redessinant en continu).

**URL importante :** Toujours utiliser `http://localhost:5173/` (racine). La maquette `docs/assets/lacuna_interface.html` est redirigée vers `/` — elle a ses propres styles et ne charge pas l'app Vue.

## Import stellaires (stellar_import)

Import HYG + NASA + constellations vers Supabase. Voir **Documentation-backend.md §10** pour l'architecture complète.

```sh
cd stellar_import && python3 main.py                    # Import complet HYG + NASA
cd stellar_import && python3 main.py --nasa-only        # NASA uniquement
cd stellar_import && python3 main.py --fix-ids sirius proxima-centauri tau-ceti   # Réimport ciblé
cd stellar_import && python3 complete_hyg_fields.py     # Compléter coordinates, constellation_abbr, mag, lum
cd stellar_import && python3 hyg_patch.py [--apply]     # Patch champs manquants (con, lum, ci) + field_sources
cd stellar_import && python3 nasa_age_patch.py [--apply] # Patch age (Ga) depuis NASA
cd stellar_import && python3 populate_constellations.py # 88 constellations + segments (--truncate pour vider)
cd stellar_import && python3 check_systems.py           # Vérifier champs stellar_systems
```

**Champs NULL après import initial** — Les colonnes `luminosity`, `color_index`, `apparent_magnitude` et `coordinates` (x/y/z) ont été ajoutées en migration 00016. Les systèmes importés avant cette migration ou insérés via seed (SOL, PROXIMA, etc.) avec `ra/dec` n'ont pas ces champs. Utiliser `--fix-ids` pour forcer la mise à jour depuis HYG. SOL reste volontairement sans x/y/z (origine référentiel).

**Doublons HYG/LACUNA** — L'import HYG utilise `LACUNA_ID_MAP` pour fusionner les ids (ex. gl-gl-71 → TAU_CETI). Si un import antérieur a créé les deux (avant le mapping), un doublon existe : recherche "tau" pointe correctement mais le tooltip affiche "Gliese Gl 71". Scripts : `diagnose_names.py`, `check_duplicate_systems.py`. Migration 00021 supprime gl-gl-71.

## Alias et configuration

- **`@/`** → `./src/` (Vite + jsconfig)
- **Node** : ^20.19.0 ou >=22.12.0
- **Gestionnaire** : Yarn

### Paramètres de transit (temps joueur)

Le temps joueur d'un voyage est calculé côté client à partir de la courbe physique (`LACUNA_PHYSICS.md`) et d'un facteur d'échelle :

- **`VITE_TRANSIT_TIME_SCALE`** (optionnel, côté Vite) :
  - `1` → respecte les durées documents (Proxima ≈ 1h joueur, bord opposé ≈ 90 jours),
  - `0.00138889` (valeur par défaut dans `.env.example`) → **mode test** (Proxima ≈ 5s joueur, même courbe comprimée),
  - toute autre valeur > 0 applique la même loi puissance en la contractant ou l'étirant.

En l'absence de variable d'environnement, le client utilise la valeur de test `5 / 3600` pour faciliter le prototypage.

## Commandes

```sh
yarn install      # Installer les dépendances
yarn dev          # Serveur de développement (port 5173)
yarn build        # Build production
yarn preview      # Prévisualiser le build
```

## Références

- [Documentation Supabase](https://supabase.com/docs)
- [Vue 3](https://vuejs.org/)
- [Vite](https://vite.dev/)
- [Pinia](https://pinia.vuejs.org/)
