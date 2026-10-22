/* Tous les CSS en imports directs — Vite ignore les changements dans les fichiers @import */
/* Polices hébergées avec l'app (aucune requête vers Google Fonts) */
import '@fontsource/share-tech-mono/400.css'
import '@fontsource/syne/400.css'
import '@fontsource/syne/600.css'
import '@fontsource/syne/800.css'
import './assets/tokens.css'
import './assets/base.css'
import './assets/animations.css'
import './assets/layers.css'
import './assets/utilities.css'
import './assets/components/header.css'
import './assets/components/instruments.css'
import './assets/components/panel.css'
import './assets/components/page.css'
import './assets/components/widget.css'
import './assets/components/button.css'
import './assets/components/select.css'
import './assets/components/tooltip.css'
import './assets/components/notification.css'
import './assets/components/bar.css'
import './assets/components/observatoire.css'
import './assets/components/app-modal.css'
import './assets/components/divider.css'
import './assets/components/nav-menu-item.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
