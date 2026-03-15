import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
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
export default defineConfig({
  plugins: [
    redirectMaquette(),
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
