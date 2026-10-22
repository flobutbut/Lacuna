<script setup>
/**
 * SiteLayout — cadre du site public : ciel étoilé, en-tête, contenu défilant, pied de page.
 * Utilisé par la landing et les pages annexes (mentions légales, confidentialité, conditions, crédits).
 */
import '@/assets/components/site.css'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import SiteStarfield from '@/components/site/SiteStarfield.vue'

const authStore = useAuthStore()
const isPlayer = computed(() => authStore.isAuthenticated)

const scrollY = ref(0)
const year = new Date().getFullYear()

function onScroll(event) {
  scrollY.value = event.target.scrollTop
}
</script>

<template>
  <div class="site" @scroll.passive="onScroll">
    <SiteStarfield :scroll-y="scrollY" />
    <div class="site__veil" aria-hidden="true" />

    <div class="site__body">
      <header class="site-header" :class="{ 'is-scrolled': scrollY > 24 }">
        <RouterLink :to="{ name: 'accueil' }" class="site-logo" aria-label="LACUNA — accueil">
          LAC<span class="site-logo__accent">U</span>NA
        </RouterLink>
        <nav class="site-nav" aria-label="Navigation principale">
          <RouterLink v-if="isPlayer" :to="{ name: 'observatoire' }" class="site-cta site-cta--small">
            Retour au vaisseau
          </RouterLink>
          <template v-else>
            <RouterLink :to="{ name: 'connexion' }" class="site-nav__link site-nav__link--secondary">
              Se connecter
            </RouterLink>
            <RouterLink :to="{ name: 'inscription' }" class="site-cta site-cta--small">
              Embarquer
            </RouterLink>
          </template>
        </nav>
      </header>

      <!-- Le <main> de l'app (App.vue) contient déjà la page -->
      <div class="site__content">
        <slot />
      </div>

      <footer class="site-footer">
        <div>
          <RouterLink :to="{ name: 'accueil' }" class="site-logo">
            LAC<span class="site-logo__accent">U</span>NA
          </RouterLink>
          <p class="site-footer__tagline">Simulation d’exploration galactique. Sans fin, sans vérité absolue.</p>
        </div>
        <ul class="site-footer__links">
          <li><RouterLink :to="{ name: 'mentions-legales' }">Mentions légales</RouterLink></li>
          <li><RouterLink :to="{ name: 'confidentialite' }">Confidentialité</RouterLink></li>
          <li><RouterLink :to="{ name: 'conditions' }">Conditions d’utilisation</RouterLink></li>
          <li><RouterLink :to="{ name: 'credits' }">Crédits</RouterLink></li>
        </ul>
        <div class="site-footer__meta">
          <span>© {{ year }} LACUNA</span>
          <span class="site-footer__signal" title="La raie de l’hydrogène, fréquence du signal Wow!">1420,405 MHz · à l’écoute</span>
        </div>
      </footer>
    </div>
  </div>
</template>
