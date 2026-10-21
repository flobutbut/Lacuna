<script setup>
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import { useObservatoireStore } from '@/stores/observatoire'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'
import AppModal from '@/components/AppModal.vue'
import Divider from '@/components/Divider.vue'
import SignalTypeIcon from '@/components/icons/SignalTypeIcon.vue'
import { signalToObsPayload } from '@/lib/observationPayload'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const observatoireStore = useObservatoireStore()
const signauxStore = useSignauxStore()
const obsStore = useObservationsStore()

function close() {
  observatoireStore.closeSignalModal()
}

async function analyser() {
  const s = observatoireStore.selectedSignal
  if (!s) return
  const existing = obsStore.findObservationForSignal(s)
  if (existing) {
    observatoireStore.closeSignalModal()
    router.push({ path: '/laboratoire', query: { select: existing.id } })
    return
  }
  const payload = signalToObsPayload(s, obsStore.NIVEAUX)
  if (!payload) return
  const obsId = await obsStore.addObservation(payload)
  signauxStore.removeSignal(s.id)
  notificationsStore.setLabHasNew(true)
  observatoireStore.closeSignalModal()
  router.push({ path: '/laboratoire', query: { select: obsId } })
}

async function ajouterAuLabo() {
  const s = observatoireStore.selectedSignal
  if (!s || obsStore.findObservationForSignal(s)) return
  const payload = signalToObsPayload(s, obsStore.NIVEAUX)
  if (!payload) return
  await obsStore.addObservation(payload)
  signauxStore.removeSignal(s.id)
  notificationsStore.setLabHasNew(true)
}

function isAdded() {
  const s = observatoireStore.selectedSignal
  return s ? !!obsStore.findObservationForSignal(s) : false
}

</script>

<template>
  <AppModal
    v-if="observatoireStore.selectedSignal"
    :title="`Signal · ${observatoireStore.selectedSignal?.frequency}`"
    @close="close"
  >
    <div class="signal-modal__body">
      <div class="signal-modal__grid signal-modal__grid--top">
        <div class="sw-cell">
          <div class="signal-modal__key sw-key">Distance est.</div>
          <div class="signal-modal__val sw-val">{{ observatoireStore.selectedSignal?.distanceEst ?? '—' }}</div>
        </div>
        <div class="sw-cell">
          <div class="signal-modal__key sw-key">Reçu le</div>
          <div class="signal-modal__val sw-val">{{ observatoireStore.selectedSignal?.receivedAt }}</div>
        </div>
      </div>
      <Divider variant="dashed" />
      <div class="signal-modal__section">
        <div class="signal-modal__section-title sw-key">Propriétés du signal</div>
        <div class="sw-row">
          <span class="sw-key">Fréquence</span>
          <span class="sw-val">{{ observatoireStore.selectedSignal?.frequency }}</span>
        </div>
        <div class="sw-row">
          <span class="sw-key">Type</span>
          <span class="signal-modal__val--structure sw-val">
            <SignalTypeIcon :structure="observatoireStore.selectedSignal?.structure" :size="14" />
            {{ observatoireStore.selectedSignal?.structure ?? 'non uniforme' }}
          </span>
        </div>
        <div class="sw-row">
          <span class="sw-key">Direction</span>
          <span class="sw-val">azimut {{ observatoireStore.selectedSignal?.azimuth }}°</span>
        </div>
        <div class="sw-row">
          <span class="sw-key">Durée</span>
          <span class="sw-val">{{ observatoireStore.selectedSignal?.durationSec }} secondes</span>
        </div>
        <div class="sw-row">
          <span class="sw-key">Polarisation</span>
          <span class="sw-val">{{ observatoireStore.selectedSignal?.polarization }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-primary" @click="analyser">
        Analyser
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="isAdded()"
        @click="ajouterAuLabo"
      >
        {{ isAdded() ? 'Ajouté' : 'Ajouter au laboratoire' }}
      </button>
    </template>
  </AppModal>
</template>
