<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSignauxStore } from '@/stores/signaux'
import { useRadarStore } from '@/stores/radar'
import { useShipStore } from '@/stores/ship'
import { useObservatoireStore } from '@/stores/observatoire'
import { useObservationsStore } from '@/stores/observations'
import { isWindowOpen } from '@/lib/signalWindow'
import AppSwitch from '@/components/AppSwitch.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import RadarMiniature from '@/components/RadarMiniature.vue'
import NeutrinoMonitor from '@/components/NeutrinoMonitor.vue'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

const signauxStore = useSignauxStore()
const radarStore = useRadarStore()
const shipStore = useShipStore()
const observatoireStore = useObservatoireStore()
const obsStore = useObservationsStore()

/** Fil conducteur (LACUNA_VERDICT.md §8) : observations confiées au Laboratoire et pas encore analysées */
// L'état vaut la clé SQL (PENDING) pour une observation chargée de la base, son libellé (« En attente ») sinon
const pendingAnalyses = computed(() => obsStore.list.filter((o) => o.state === 'PENDING' || o.state === 'En attente').length)
const { radarEnabled, radarNoiseEnabled, neutrinoMonitorEnabled } = storeToRefs(radarStore)
/** Filtre de bruit actif = bruit de fond retiré du spectrogramme */
const noiseFiltered = computed(() => radarNoiseEnabled.value === false)

/**
 * Signaux sans direction sur le ciel : émetteurs du système où se trouve le vaisseau (présents en permanence,
 * actifs seulement pendant leur fenêtre) et bouffées de neutrinos encore récentes
 */
const now = ref(Date.now())
const systemEmitters = computed(() =>
  signauxStore.list
    .filter(
      (s) =>
        (s.sourceType === 'EMITTER' && s.sourceSystemId === shipStore.currentSystemId) ||
        (s.support === 'NEUTRINO' && now.value - s.createdAt < s.lifetimeMs)
    )
    .map((s) => ({ signal: s, active: isWindowOpen(s.window, now.value) }))
)

let expiryInterval = null
onMounted(async () => {
  await ensureStoresLoaded(signauxStore, obsStore)
  signauxStore.removeExpired()
  expiryInterval = setInterval(() => {
    signauxStore.removeExpired()
    now.value = Date.now()
  }, 10000)
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
      <RouterLink v-if="pendingAnalyses > 0" to="/laboratoire" class="side-widget__next">
        {{ pendingAnalyses }} observation{{ pendingAnalyses > 1 ? 's' : '' }} en attente d’analyse → Laboratoire
      </RouterLink>
    </div>

    <div v-if="systemEmitters.length" class="side-widget">
      <div class="sw-title">Signaux sans direction</div>
      <button
        v-for="e in systemEmitters"
        :key="e.signal.id"
        type="button"
        class="sw-row side-widget__emitter"
        @click="observatoireStore.selectSignal(e.signal)"
      >
        <span class="sw-key">{{ e.signal.frequency }}</span>
        <span class="sw-val" :class="e.active ? 'ok' : 'warn'">{{ e.active ? 'ACTIF' : 'INACTIF' }}</span>
      </button>
    </div>

    <div class="side-widget side-widget--signaux" data-tour="radar">
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

    <div class="side-widget" data-tour="neutrinos">
      <div
        class="side-widget__header side-widget__header--radar"
        :class="{ 'side-widget__header--collapsed': !neutrinoMonitorEnabled }"
      >
        <div class="side-widget__radar-title">
          <div class="sw-title sw-title--inline">Neutrinos</div>
          <AppSwitch
            v-model="neutrinoMonitorEnabled"
            aria-label="Moniteur du détecteur de neutrinos"
            :title="neutrinoMonitorEnabled ? 'Masquer le moniteur' : 'Afficher le moniteur'"
          />
        </div>
      </div>
      <NeutrinoMonitor v-if="neutrinoMonitorEnabled" />
    </div>
  </div>
</template>

<style scoped>
.side-widget__emitter {
  width: 100%;
  padding: var(--space-2) 0;
  background: none;
  border: none;
  font: inherit;
  cursor: pointer;
}

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
