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
| **3D / Canvas** | Three.js (prévu) |
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
│   ├── lib/
│   │   └── supabase.js      # Client Supabase
│   ├── stores/
│   │   ├── supabase.js      # Store Supabase
│   │   └── counter.js       # Store exemple
│   ├── components/          # Composants Vue
│   │   ├── AppHeader.vue
│   │   ├── SkyCanvas.vue
│   │   ├── InstrumentsBar.vue
│   │   ├── SideLeft.vue, SideRight.vue
│   │   ├── Reticule.vue, StarTooltip.vue
│   │   ├── TravelWidget.vue, NotificationToast.vue
│   │   └── panels/          # (legacy — contenu migré vers views/)
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
│   └── seed.sql             # Données initiales (traces immuables)
├── docs/
│   ├── Documentation-technique.md
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

## Base de données (Supabase)

### Tables principales

| Table | Description |
|-------|-------------|
| `stellar_systems` | Systèmes stellaires (génération procédurale) |
| `traces` | Traces collectables (signaux, artefacts, anomalies) |
| `ships` | Vaisseaux joueurs (1 par user) |
| `populations` | Population par vaisseau |
| `ship_traces` | Traces collectées par vaisseau |
| `interpretations` | Interprétations anonymes des traces |
| `logbook_entries` | Carnet de bord |
| `map_nodes` / `map_edges` | Carte explorée |
| `drake_equation` / `drake_history` | Équation de Drake globale |

### RLS (Row Level Security)

- **Vaisseaux, population, logbook, carte** : accès restreint au propriétaire (`auth.uid()`)
- **Traces, systèmes stellaires, Drake** : lecture publique
- **Interprétations** : insertion ouverte, lecture publique

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anon publique |

## Design system et CSS

**Règle impérative :** Tous les fichiers CSS sont importés **directement dans `main.js`**. Ne jamais utiliser `@import` dans un fichier CSS pour importer d'autres CSS — Vite ignore les changements et le HMR ne fonctionne pas.

| Fichier | Rôle |
|---------|------|
| `tokens.css` | Variables `:root` (couleurs, typo, espacements, layout) |
| `base.css` | Reset, fonts, styles de base |
| `components/*.css` | Styles par composant (widget, panel, header, etc.) |

**Pour ajouter un nouveau fichier CSS :** l'ajouter dans `main.js` après les imports existants.

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
