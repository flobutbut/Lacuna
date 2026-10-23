<script setup>
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import { useObservatoireStore } from '@/stores/observatoire'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import AppModal from '@/components/AppModal.vue'
import Divider from '@/components/Divider.vue'
import SignalTypeIcon from '@/components/icons/SignalTypeIcon.vue'
import { signalToObsPayload } from '@/lib/observationPayload'
import { isWindowOpen } from '@/lib/signalWindow'
import { formatNumber } from '@/lib/formatUtils'
import { lptPulses } from '@/lib/lpt'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const observatoireStore = useObservatoireStore()
const signauxStore = useSignauxStore()
const obsStore = useObservationsStore()
const stellarStore = useStellarSystemsStore()

/** Payload d'observation du signal, avec le nom du système pour un émetteur du système courant */
function buildPayload(s) {
  const systemName = stellarStore.list.find((x) => x.id === s.sourceSystemId)?.name
  return signalToObsPayload(s, obsStore.NIVEAUX, systemName)
}

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
  if (!isActive(s)) return
  const payload = buildPayload(s)
  if (!payload) return
  const obsId = await obsStore.addObservation(payload)
  if (!s.persistent && !s.lpt) signauxStore.removeSignal(s.id)
  notificationsStore.setLabHasNew(true)
  observatoireStore.closeSignalModal()
  router.push({ path: '/laboratoire', query: { select: obsId } })
}

async function ajouterAuLabo() {
  const s = observatoireStore.selectedSignal
  if (!s || !isActive(s) || obsStore.findObservationForSignal(s)) return
  const payload = buildPayload(s)
  if (!payload) return
  await obsStore.addObservation(payload)
  if (!s.persistent && !s.lpt) signauxStore.removeSignal(s.id)
  notificationsStore.setLabHasNew(true)
}

/** Bouffée de neutrinos : des événements comptés, sans fréquence ni polarisation */
function isNeutrino(signal) {
  return signal?.support === 'NEUTRINO'
}

/** Direction affichée : ni pour un émetteur du système courant, ni pour des neutrinos (direction reconstruite au Laboratoire) */
function hasDirection(signal) {
  return !!signal && !signal.persistent && !isNeutrino(signal)
}

/** Impulsions reçues d'un signal à impulsions accumulées (LPT-001), 0 sinon */
function pulseCount(signal) {
  return signal?.lpt ? lptPulses(signal.lpt).length : 0
}

/** Un signal à fenêtres n'est analysable que pendant sa fenêtre d'émission */
function isActive(signal) {
  return isWindowOpen(signal?.window)
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
        <div v-if="isNeutrino(observatoireStore.selectedSignal)" class="sw-row">
          <span class="sw-key">Événements</span>
          <span class="sw-val">{{ formatNumber(observatoireStore.selectedSignal?.neutrino?.event_count) }}</span>
        </div>
        <div v-else class="sw-row">
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
        <div v-if="observatoireStore.selectedSignal?.window" class="sw-row">
          <span class="sw-key">État</span>
          <span class="sw-val" :class="isActive(observatoireStore.selectedSignal) ? 'ok' : 'warn'">
            {{ isActive(observatoireStore.selectedSignal) ? 'Actif' : 'Inactif' }}
          </span>
        </div>
        <div v-if="hasDirection(observatoireStore.selectedSignal)" class="sw-row">
          <span class="sw-key">Direction</span>
          <span class="sw-val">azimut {{ observatoireStore.selectedSignal?.azimuth }}°</span>
        </div>
        <div v-if="pulseCount(observatoireStore.selectedSignal)" class="sw-row">
          <span class="sw-key">Impulsions reçues</span>
          <span class="sw-val">{{ pulseCount(observatoireStore.selectedSignal) }}</span>
        </div>
        <div class="sw-row">
          <span class="sw-key">{{ pulseCount(observatoireStore.selectedSignal) ? 'Durée (1re impulsion)' : 'Durée' }}</span>
          <span class="sw-val">{{ observatoireStore.selectedSignal?.durationSec }} secondes</span>
        </div>
        <div v-if="!isNeutrino(observatoireStore.selectedSignal)" class="sw-row">
          <span class="sw-key">Polarisation</span>
          <span class="sw-val">{{ observatoireStore.selectedSignal?.polarization }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <button type="button" class="btn btn-primary" :disabled="!isActive(observatoireStore.selectedSignal)" @click="analyser">
        Analyser
      </button>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="isAdded() || !isActive(observatoireStore.selectedSignal)"
        @click="ajouterAuLabo"
      >
        {{ isAdded() ? 'Ajouté' : 'Ajouter au laboratoire' }}
      </button>
    </template>
  </AppModal>
</template>
