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
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.lacuna-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  overflow: hidden;
  background: var(--color-bg);
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
