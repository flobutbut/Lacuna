<script setup>
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useShipStore } from '@/stores/ship'
import ObservatoireSpectralFilters from '@/components/ObservatoireSpectralFilters.vue'
import Stars3DCanvas from '@/components/conception/Stars3DCanvas.vue'

const stellarStore = useStellarSystemsStore()
const shipStore = useShipStore()
const loading = ref(true)
const focusStarId = ref(null)
const spectralFilter = ref('visible')
const exoplanetFilter = ref(false)
const constellationsEnabled = ref(false)

async function load() {
  loading.value = true
  await ensureStoresLoaded(stellarStore, shipStore)
  await stellarStore.fetchVisibleForSky(shipStore.currentSystemId ?? 'SOL', 18)
  await stellarStore.fetchConstellationLines()
  loading.value = false
}

function onFocusStar(star) {
  if (star?.id) focusStarId.value = star.id
}

load()
</script>

<template>
  <div class="page-conception-etoiles">
    <Stars3DCanvas
      v-if="!loading"
      :spectral-filter="spectralFilter"
      :exoplanet-filter="exoplanetFilter"
      :focus-star-id="focusStarId"
    />
    <div v-if="loading" class="conception-loading">
      Chargement des étoiles…
    </div>
    <div v-if="!loading" class="conception-overlay">
      <div class="conception-tabs">
        <ObservatoireSpectralFilters
          standalone
          :spectral-filter="spectralFilter"
          :exoplanet-filter="exoplanetFilter"
          :constellations-enabled="constellationsEnabled"
          class="conception-tabs__filters"
          @update:spectral-filter="spectralFilter = $event"
          @update:exoplanet-filter="exoplanetFilter = $event"
          @update:constellations-enabled="constellationsEnabled = $event"
          @focus-star="onFocusStar"
        />
        <RouterLink to="/" class="conception-back-link">← Retour</RouterLink>
      </div>
      <div class="conception-legend">
        <span class="conception-legend-text">Vue 3D — origine : barycentre des étoiles · Molette : zoom</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-conception-etoiles {
  position: absolute;
  inset: 0;
  background: var(--color-bg);
}

.conception-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: var(--text-md);
}

.conception-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.conception-overlay > * {
  pointer-events: auto;
}

.conception-tabs {
  position: absolute;
  top: var(--sidebar-offset);
  left: var(--sidebar-offset);
  right: var(--sidebar-offset);
  padding-left: var(--space-6);
  padding-right: var(--space-6);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  z-index: 20;
}

.conception-tabs__filters {
  flex-shrink: 0;
}

.conception-back-link {
  padding: var(--space-4) var(--space-6);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-muted);
  text-decoration: none;
  border: var(--border-width) solid var(--border-default);
  border-radius: var(--border-radius-sm);
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.conception-back-link:hover {
  color: var(--color-cyan);
  border-color: var(--color-cyan);
}

.conception-legend {
  position: absolute;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-2) var(--space-4);
  background: rgba(6, 14, 28, 0.85);
  border: 1px solid var(--border-default);
  border-radius: var(--border-radius-md);
}

.conception-legend-text {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-muted);
}
</style>
