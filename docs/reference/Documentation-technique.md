*Dernière modification : 2026-03-15 15:11*

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
│   │   │   └── PageObservatoire.vue   # Ciel + exploration
│   │   ├── PageCarte.vue
│   │   ├── PageArtefacts.vue
│   │   ├── PageJournal.vue
│   │   ├── PageDrake.vue
│   │   ├── PagePopulation.vue
│   │   ├── PageConceptionEtoiles.vue   # Vue 3D étoiles (conception, /conception-etoiles)
│   │   └── ...
│   ├── stores/
│   │   ├── supabase.js      # Store Supabase
│   │   ├── stellarSystems.js # Systèmes stellaires (ciel Observatoire)
│   │   ├── systemObjects.js  # Objets des systèmes (étoiles, planètes, disques)
│   │   ├── ship.js           # Vaisseau (ARCA, current_system_id, systems, fuel)
│   │   └── counter.js       # Store exemple
│   ├── components/          # Composants Vue
│   │   ├── AppHeader.vue
│   │   ├── SkyCanvas.vue
│   │   ├── InstrumentsBar.vue
│   │   ├── SideLeft.vue, SideRight.vue
│   │   ├── Reticule.vue, ObservatoireTooltip.vue, StarTooltip.vue, SignalTooltip.vue
│   │   ├── ObservationCard.vue (cards signaux Observatoire + observations Laboratoire)
│   │   ├── NavMenuItem.vue (menu Systèmes, Population — items pleine largeur ; grille Artefacts)
│   │   ├── NavTabButton.vue (barre navigation — onglets modules)
│   │   ├── InstrumentButton.vue (grille boutons carrés — Laboratoire, réutilisable)
│   │   ├── TravelWidget.vue, NotificationToast.vue
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
│   │   │   └── LabReportAtmosphere.vue        # Profil moléculaire (spectromètre atmosphérique)
│   │   └── panels/          # (legacy — contenu migré vers views/)
│   ├── composables/         # Logique réutilisable (Vue)
│   │   ├── useSkyStars.js   # Construction liste étoiles (DB / fallback) — Observatoire, projection x/y/z → ra/dec
│   │   ├── useStars3DConception.js  # Vue 3D conception — barycentre, points 3D
│   │   ├── useStellarSearch.js      # Recherche systèmes/constellations/signaux — Observatoire + Vue 3D conception
│   │   ├── useStarTooltipData.js    # Données tooltip étoile (distance, exoplanètes, etc.) — StarTooltip
│   │   ├── useStarSelection.js     # Sélection étoile (recherche + clic) — Observatoire et Vue 3D
│   │   └── useStoreReady.js # ensureStoresLoaded() — chargement stores au montage
│   ├── constants/           # Constantes partagées
│   │   ├── objectTypes.js   # OBJECT_TYPE_LABELS (affichage Observatoire, Laboratoire)
│   │   ├── starDisplay.js   # Couleurs highlight (HIGHLIGHT_CYAN_*, HIGHLIGHT_3D_SIZE_MULT) — design system
│   │   └── menus.js         # SYSTEMS_MENU_ITEMS, POPULATION_MENU_ITEMS, INSTRUMENTS, TRACE_ICONS
│   ├── lib/
│   │   ├── supabase.js      # Client Supabase
│   │   ├── formatUtils.js   # Formatage (barWidth, formatDate, formatRelativeTime, barClass, valClass, formatRaDec)
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
│   │   └── atmosphereData.js    # Profil moléculaire (spectromètre atmosphérique)
│   ├── router/
│   │   └── index.js         # Routes Vue Router
│   └── assets/
│       ├── main.css         # Styles globaux
│       ├── tokens.css       # Design tokens (couleurs, typo, espacements)
│       ├── base.css
│       ├── layers.css
│       ├── animations.css
│       ├── utilities.css
│       └── components/      # CSS modulaires (artifact, bar, journal, panel...)
├── supabase/
│   ├── config.toml          # Config Supabase CLI
│   ├── migrations/
│   │   └── 00001_initial_schema.sql
│   └── seed.sql             # Données initiales (traces immuables + systèmes prototype)
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
│   ├── populate_constellations.py  # 88 constellations + constellation_lines (IAU shapes)
│   ├── check_systems.py     # Vérifier champs stellar_systems
│   ├── check_duplicate_systems.py # Détecte doublons HYG/LACUNA
│   ├── diagnose_names.py    # Diagnostique mapping noms
│   ├── diagnose_nasa_planets.py   # Diagnostique planètes NASA
│   ├── supabase_client.py   # Client Supabase (.env)
│   └── report.py            # Rapport final (import_report.md)
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

**Règle impérative :** Tous les fichiers CSS sont importés **directement dans `main.js`**. Ne jamais utiliser `@import` dans un fichier CSS pour importer d'autres CSS — Vite ignore les changements et le HMR ne fonctionne pas.

| Fichier | Rôle |
|---------|------|
| `tokens.css` | Variables `:root` (couleurs, typo, espacements, layout) |
| `base.css` | Reset, fonts, styles de base |
| `app-modal.css` | AppModal, ModalCell |
| `components/*.css` | Styles par composant (widget, panel, header, etc.) |

**Pour ajouter un nouveau fichier CSS :** l'ajouter dans `main.js` après les imports existants.

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

**URL importante :** Toujours utiliser `http://localhost:5173/` (racine). La maquette `docs/assets/lacuna_interface.html` est redirigée vers `/` — elle a ses propres styles et ne charge pas l'app Vue.

## Import stellaires (stellar_import)

Import HYG + NASA + constellations vers Supabase. Voir **Documentation-backend.md §10** pour l'architecture complète.

```sh
cd stellar_import && python3 main.py                    # Import complet HYG + NASA
cd stellar_import && python3 main.py --nasa-only        # NASA uniquement
cd stellar_import && python3 main.py --fix-ids sirius proxima-centauri tau-ceti   # Réimport ciblé
cd stellar_import && python3 complete_hyg_fields.py     # Compléter coordinates, constellation_abbr, mag, lum
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
