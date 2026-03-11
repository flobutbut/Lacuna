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
│   │   ├── PageObservatoire.vue   # Ciel + exploration
│   │   ├── PageCarte.vue
│   │   ├── PageArtefacts.vue
│   │   ├── PageJournal.vue
│   │   ├── PageDrake.vue
│   │   ├── PagePopulation.vue
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
│   │   ├── Reticule.vue, StarTooltip.vue
│   │   ├── TravelWidget.vue, NotificationToast.vue
│   │   ├── lab/
│   │   │   ├── LabReportSpectrogram.vue       # Sortie spectrogramme (analyseur spectral)
│   │   │   └── LabReportStructureTemporelle.vue  # Forme d'onde + autocorrélation (structure temporelle)
│   │   └── panels/          # (legacy — contenu migré vers views/)
│   ├── lib/
│   │   ├── supabase.js      # Client Supabase
│   │   └── spectrogramData.js  # Génération données synthétiques pour spectrogramme
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
│   ├── Documentation-technique.md
│   ├── Documentation-backend.md   # Schéma DB, migrations, RLS, seed
│   ├── Documentation-status.md
│   ├── Documentation-fonctionnelle.md
│   ├── LACUNA_GDD.md        # Game Design Document
│   ├── LACUNA_vision_v01.md # Document de vision
│   └── lacuna_interface.html # Maquette UI de référence
├── .env                     # Variables Supabase (gitignored)
├── .env.example
├── vite.config.js
└── package.json
```

## Base de données

**Documentation complète** : `docs/Documentation-backend.md` — schéma détaillé, migrations, RLS, seed, mapping stores.

Résumé : Supabase (PostgreSQL). Tables principales : `stellar_systems`, `system_objects`, `traces`, `observations`, `ships`, `populations`, `interpretations`, `map_nodes`/`map_edges`, `drake_equation`.

## Design system et CSS

**Règle impérative :** Tous les fichiers CSS sont importés **directement dans `main.js`**. Ne jamais utiliser `@import` dans un fichier CSS pour importer d'autres CSS — Vite ignore les changements et le HMR ne fonctionne pas.

| Fichier | Rôle |
|---------|------|
| `tokens.css` | Variables `:root` (couleurs, typo, espacements, layout) |
| `base.css` | Reset, fonts, styles de base |
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

Voir `docs/LACUNA_LABORATOIRE_INSTRUMENTS.md` §5 (formats de sortie) et § Annexe.

**URL importante :** Toujours utiliser `http://localhost:5173/` (racine). La maquette `docs/lacuna_interface.html` est redirigée vers `/` — elle a ses propres styles et ne charge pas l'app Vue.

## Alias et configuration

- **`@/`** → `./src/` (Vite + jsconfig)
- **Node** : ^20.19.0 ou >=22.12.0
- **Gestionnaire** : Yarn

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
