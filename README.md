# LACUNA

Simulation d'exploration galactique persistante et asynchrone — Vue 3 + Vite + Supabase.

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier `.env.example` vers `.env`
3. Récupérer l'URL et la clé anon dans **Settings > API**
4. Appliquer le schéma SQL :
   - Ouvrir **SQL Editor** dans le dashboard Supabase
   - Exécuter le contenu de `supabase/migrations/00001_initial_schema.sql`
   - Exécuter `supabase/seed.sql` pour les traces immuables (WOW, Oumuamua, Bennu)

## Project Setup

```sh
yarn install
```

### Development

```sh
yarn dev
```

### Build

```sh
yarn build
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

