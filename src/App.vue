<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Analytics } from '@vercel/analytics/vue'
import AppHeader from '@/components/AppHeader.vue'
import InstrumentsBar from '@/components/InstrumentsBar.vue'
import NotificationToast from '@/components/NotificationToast.vue'

const route = useRoute()
const authStore = useAuthStore()
/** Mise en page sans header ni barre d'instruments (Vue 3D conception, pages d'authentification) */
const isBareLayout = computed(() => route.meta.bareLayout === true)

// Déconnexion (bouton, autre onglet, session expirée) : rechargement complet pour vider l'état des stores
watch(
  () => authStore.isAuthenticated,
  (now, before) => {
    if (before && !now) window.location.assign(authStore.accountDeleted ? '/connexion?compte=supprime' : '/connexion')
  }
)
</script>

<template>
  <div
    class="lacuna-app"
    :class="{
      'route-observatoire': route.name === 'observatoire',
      'route-bare': isBareLayout,
    }"
  >
    <AppHeader v-if="!isBareLayout" />
    <main class="lacuna-main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <InstrumentsBar v-if="!isBareLayout" />
    <NotificationToast />
    <Analytics />
  </div>
</template>

<style scoped>
.lacuna-app {
  display: grid;
  grid-template-rows: var(--header-height) 1fr var(--instruments-height);
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.lacuna-app.route-bare {
  grid-template-rows: 1fr;
}

.lacuna-main {
  min-height: 0;
  overflow: auto;
  position: relative;
  background: var(--color-bg);
}

/* Le contenu routé occupe strictement l'espace entre header et footer */
.lacuna-main > * {
  position: absolute;
  inset: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
