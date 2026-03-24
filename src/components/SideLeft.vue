<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'
import { useUIStore } from '@/stores/ui'
import ObservationCard from '@/components/ObservationCard.vue'
import { formatRelativeTime } from '@/lib/formatUtils'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { getSupportLabel } from '@/constants/signaux'

const signauxStore = useSignauxStore()
const obsStore = useObservationsStore()
const ui = useUIStore()

function isSignalInLab(signal) {
  return !!obsStore.findObservationForSignal(signal)
}

const signalsToShow = computed(() =>
  signauxStore.listWithRemaining.filter((s) => !isSignalInLab(s))
)

function onCardClick(s) {
  ui.selectSignal(s)
}

function onIgnore(id) {
  signauxStore.removeSignal(id)
}

let expiryInterval = null
onMounted(async () => {
  await ensureStoresLoaded(signauxStore, obsStore)
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
      <div class="sw-title" :class="{ 'sw-title--no-divider': signalsToShow.length > 0 }">Radar</div>
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
        :badge="getSupportLabel(s.support)"
        :progress="{ pct: s.lifetimePct, variant: 'amber' }"
        :state="s.remainingMs <= 0 ? 'expired' : ui.signalSearchMatchIds.has(s.id) ? 'highlight' : 'idle'"
        dismiss-label="Ignorer"
        @click="onCardClick(s)"
        @dismiss="() => onIgnore(s.id)"
      />
    </div>
  </div>
</template>
