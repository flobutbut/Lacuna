import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Redirige /docs/lacuna_interface.html vers / — la maquette HTML a ses propres
// styles et masquait l'app Vue (changements dans widget.css invisibles)
function redirectMaquette() {
  return {
    name: 'redirect-maquette',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/docs/lacuna_interface.html' || req.url === '/docs/assets/lacuna_interface.html' || req.url?.startsWith('/docs/lacuna_interface') || req.url?.includes('lacuna_interface')) {
          res.writeHead(302, { Location: '/' })
          res.end()
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vue DevTools désactivé par défaut (son bouton flottant masque l'interface) :
  // VUE_DEVTOOLS=true dans .env.local, ou `npm run dev:devtools`
  const env = loadEnv(mode, process.cwd(), '')
  const devtoolsEnabled = env.VUE_DEVTOOLS === 'true'

  return {
    plugins: [
      redirectMaquette(),
      vue(),
      devtoolsEnabled && vueDevTools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
