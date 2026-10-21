# LACUNA

Simulation d'exploration galactique persistante et asynchrone — Vue 3 + Vite + Supabase.

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier `.env.example` vers `.env`
3. Récupérer l'URL et la clé anon dans **Settings > API**
4. Appliquer le schéma SQL dans **SQL Editor** (dashboard Supabase) :
   - Exécuter **toutes** les migrations de `supabase/migrations/`, dans l'ordre des noms de fichiers (`00001_…` à `00039_…`)
   - Attention : `00012_*` et `00013_*` existent en double ; les appliquer dans l'ordre alphabétique (`00012_observations_structure` avant `00012_sol_system_objects_enrich`, `00013_composition_rings_satellites` avant `00013_lab_reports`)
   - Exécuter `supabase/seed.sql` pour les traces immuables (WOW, Oumuamua, Bennu)
   - Optionnel : `supabase/seed_extended_systems.sql` (~100 systèmes, régénérable avec `npm run seed:generate`)

> ⚠️ Les politiques RLS sont celles d'un prototype : la clé anon peut lire et écrire `signals`, `observations` et `lab_reports`. Ne pas exposer cette base publiquement en l'état.

## Installation

```sh
npm install
```

### Développement

```sh
npm run dev
```

### Build

```sh
npm run build
```

### Qualité

```sh
npm run lint        # ESLint (Vue + JS)
npm run lint:fix    # corrections automatiques
npm run test        # tests Vitest (src/**/*.test.js)
npm run format      # Prettier sur src/ (reformate les fichiers)
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

