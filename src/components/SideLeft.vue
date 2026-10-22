<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSignauxStore } from '@/stores/signaux'
import { useRadarStore } from '@/stores/radar'
import AppSwitch from '@/components/AppSwitch.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import RadarMiniature from '@/components/RadarMiniature.vue'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

const signauxStore = useSignauxStore()
const radarStore = useRadarStore()
const { radarEnabled, radarNoiseEnabled } = storeToRefs(radarStore)
/** Filtre de bruit actif = bruit de fond retiré du spectrogramme */
const noiseFiltered = computed(() => radarNoiseEnabled.value === false)

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
    <div class="side-widget">
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

    <div class="side-widget side-widget--signaux">
      <div
        class="side-widget__header side-widget__header--radar"
        :class="{ 'side-widget__header--collapsed': !radarEnabled }"
      >
        <!-- Interrupteur collé au titre ; filtre à droite, seulement radar allumé -->
        <div class="side-widget__radar-title">
          <div class="sw-title sw-title--inline">Radar</div>
          <AppSwitch
            v-model="radarEnabled"
            aria-label="Acquisition radar"
            :title="radarEnabled ? 'Couper le radar' : 'Allumer le radar'"
          />
        </div>
        <button
          v-if="radarEnabled"
          type="button"
          class="btn btn-secondary side-widget__btn--noise"
          :class="{ 'is-active': noiseFiltered }"
          :title="noiseFiltered ? 'Afficher le bruit de fond' : 'Filtrer le bruit de fond'"
          :aria-pressed="noiseFiltered"
          aria-label="Filtre de bruit de fond"
          @click="radarStore.toggleRadarNoise"
        >
          <AppIcon name="noise-filter" />
        </button>
      </div>
      <!-- Radar coupé : tuile réduite à son en-tête -->
      <RadarMiniature v-if="radarEnabled" />
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

.side-widget__radar-title {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* Même contrôle que ObservatoireRadarFilters (vue radar) */
.side-widget__btn--noise {
  pointer-events: auto;
  min-width: 2.25rem;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
  line-height: 0;
}

.side-widget__btn--noise .app-icon {
  display: block;
}

/* Radar coupé : plus de miniature sous l'en-tête */
.side-widget__header--collapsed {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
</style>
