/* Tous les CSS en imports directs — Vite ignore les changements dans les fichiers @import */
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
import './assets/components/journal.css'
import './assets/components/artifact.css'
import './assets/components/population.css'
import './assets/components/systems.css'
import './assets/components/lab.css'
import './assets/components/carte.css'
import './assets/components/conception.css'
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
