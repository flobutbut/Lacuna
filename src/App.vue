<script setup>
import AppHeader from '@/components/AppHeader.vue'
import InstrumentsBar from '@/components/InstrumentsBar.vue'
import NotificationToast from '@/components/NotificationToast.vue'
</script>

<template>
  <div class="lacuna-app">
    <AppHeader />
    <main class="lacuna-main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <InstrumentsBar />
    <NotificationToast />
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
