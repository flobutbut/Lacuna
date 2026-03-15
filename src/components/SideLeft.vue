<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'
import { useUIStore } from '@/stores/ui'
import { useShipStore } from '@/stores/ship'
import ObservationCard from '@/components/ObservationCard.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { valClass, formatRelativeTime } from '@/lib/formatUtils'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

const signauxStore = useSignauxStore()
const obsStore = useObservationsStore()
const ui = useUIStore()
const shipStore = useShipStore()

const SUPPORT_LABELS = { GRAVITATIONNEL: 'Grav', GAMMA_X: 'γ/X', EM_RADIO: 'EM' }

function isSignalInLab(signal) {
  return !!obsStore.findObservationForSignal(signal)
}

function supportLabel(support) {
  return SUPPORT_LABELS[support] ?? support ?? '—'
}

const signalsToShow = computed(() =>
  signauxStore.listWithRemaining.filter((s) => !isSignalInLab(s))
)

const propulsion = computed(() => (shipStore.systems?.propulsion ?? 0.88) * 100)
const he3 = computed(() => (shipStore.fuel?.he3 ?? 0.742) * 100)
const hull = computed(() => (shipStore.systems?.hull ?? 0.971) * 100)
const plasmaShield = computed(() => (shipStore.systems?.plasma_shield ?? 1) * 100)

function onCardClick(s) {
  ui.selectSignal(s)
}

function onIgnore(id) {
  signauxStore.removeSignal(id)
}

let expiryInterval = null
onMounted(async () => {
  await ensureStoresLoaded(shipStore, signauxStore, obsStore)
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
      <div class="sw-title">Systèmes vaisseau</div>
      <div class="sw-row">
        <div class="sw-key">Propulsion</div>
        <div class="sw-val" :class="valClass(propulsion/100)">{{ propulsion >= 80 ? 'NOMINAL' : (propulsion.toFixed(1) + '%') }}</div>
      </div>
      <ProgressBar :value="propulsion" pct />
      <div class="sw-row">
        <div class="sw-key">Carburant He³</div>
        <div class="sw-val" :class="valClass(he3/100)">{{ he3.toFixed(1) }}%</div>
      </div>
      <ProgressBar :value="he3" pct />
      <div class="sw-row">
        <div class="sw-key">Intégrité coque</div>
        <div class="sw-val" :class="valClass(hull/100)">{{ hull.toFixed(1) }}%</div>
      </div>
      <ProgressBar :value="hull" pct />
      <div class="sw-row">
        <div class="sw-key">Bouclier plasma</div>
        <div class="sw-val" :class="valClass(plasmaShield/100)">{{ plasmaShield >= 80 ? 'ACTIF' : (plasmaShield.toFixed(1) + '%') }}</div>
      </div>
      <ProgressBar :value="plasmaShield" color="cyan" pct />
    </div>

    <div v-if="ui.observatoireViewMode === 'sky'" class="side-widget side-widget--signaux">
      <div class="sw-title" :class="{ 'sw-title--no-divider': signalsToShow.length > 0 }">Signaux captés</div>
      <div v-if="signalsToShow.length === 0" class="signal-empty">
        Aucun signal.
      </div>
      <ObservationCard
        v-for="s in signalsToShow"
        v-else
        :key="s.id"
        icon-type="signal"
        :icon-value="s.structure"
        :title="`${s.frequency} · azimut ${s.azimuth}°`"
        title-variant="signal"
        :rows="[formatRelativeTime(s.createdAt, { prefix: 'Reçu ', precise: true })]"
        :badge="supportLabel(s.support)"
        :progress="{ pct: s.lifetimePct, variant: 'amber' }"
        :state="s.remainingMs <= 0 ? 'expired' : ui.signalSearchMatchIds.has(s.id) ? 'highlight' : 'idle'"
        dismiss-label="Ignorer"
        @click="onCardClick(s)"
        @dismiss="() => onIgnore(s.id)"
      />
    </div>

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
  </div>
</template>
