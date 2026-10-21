<script setup>
import { onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSignauxStore } from '@/stores/signaux'
import { useUIStore } from '@/stores/ui'
import RadarNoiseIcon from '@/components/icons/RadarNoiseIcon.vue'
import RadarMiniature from '@/components/RadarMiniature.vue'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

const signauxStore = useSignauxStore()
const ui = useUIStore()
const { radarNoiseEnabled } = storeToRefs(ui)

let expiryInterval = null
onMounted(async () => {
  await ensureStoresLoaded(signauxStore)
  signauxStore.removeExpired()
  expiryInterval = setInterval(() => signauxStore.removeExpired(), 60000)
})
onUnmounted(() => {
  if (expiryInterval) clearInterval(expiryInterval)
})
</script>

<template>
  <div class="side-left">
    <div v-if="ui.observatoireViewMode === 'sky'" class="side-widget">
      <div class="sw-title">Observatoire</div>
      <div class="sw-row">
        <div class="sw-key">Systèmes résolus</div>
        <div class="sw-val">3</div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Anomalies détectées</div>
        <div class="sw-val warn">2</div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Scan en cours</div>
        <div class="sw-val ok">ACTIF</div>
      </div>
    </div>

    <div v-if="ui.observatoireViewMode === 'sky' || ui.observatoireViewMode === 'radar'" class="side-widget side-widget--signaux">
      <div class="side-widget__header side-widget__header--radar">
        <div class="sw-title sw-title--inline">Radar</div>
        <button
          type="button"
          class="btn btn-secondary side-widget__btn--noise"
          :class="{ 'is-active': radarNoiseEnabled !== false }"
          :title="radarNoiseEnabled === false ? 'Activer le bruit de fond' : 'Couper le bruit de fond'"
          :aria-pressed="radarNoiseEnabled !== false"
          aria-label="Bruit de fond du spectrogramme"
          @click="ui.toggleRadarNoise"
        >
          <RadarNoiseIcon :off="radarNoiseEnabled === false" />
        </button>
      </div>
      <RadarMiniature />
    </div>
  </div>
</template>

<style scoped>
.side-widget__header--radar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: var(--border-width) solid var(--border-default);
}

.sw-title--inline {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

/* Même contrôle que ObservatoireRadarFilters (vue radar) */
.side-widget__btn--noise {
  pointer-events: auto;
  min-width: 2.25rem;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
  line-height: 0;
}

.side-widget__btn--noise :deep(.radar-noise-icon) {
  display: block;
}
</style>
