<script setup>
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'
import AppModal from '@/components/AppModal.vue'
import Divider from '@/components/Divider.vue'
import SignalTypeIcon from '@/components/icons/SignalTypeIcon.vue'
import { formatSignalObservationName } from '@/lib/formatUtils'

const router = useRouter()
const ui = useUIStore()
const signauxStore = useSignauxStore()
const obsStore = useObservationsStore()

function signalToObsPayload(s) {
  if (!s) return null
  const name = formatSignalObservationName(s)
  return {
    name,
    type: 'SIGNAL',
    support: s.support ?? 'EM_RADIO',
    structure: s.structure ?? 'non uniforme',
    system: '—',
    system_id: null,
    distance: s.distanceEst ?? '—',
    coords: '—',
    date: s.receivedAt,
    niveau: obsStore.NIVEAUX.PASSIF,
    durationSec: s.durationSec ?? 72,
    anomalous: s.anomalous ?? false,
  }
}

function close() {
  ui.closeSignalModal()
}

async function analyser() {
  const s = ui.selectedSignal
  if (!s) return
  const existing = obsStore.findObservationForSignal(s)
  if (existing) {
    ui.closeSignalModal()
    router.push({ path: '/laboratoire', query: { select: existing.id } })
    return
  }
  const payload = signalToObsPayload(s)
  if (!payload) return
  const obsId = await obsStore.addObservation(payload)
  signauxStore.removeSignal(s.id)
  ui.setLabHasNew(true)
  ui.closeSignalModal()
  router.push({ path: '/laboratoire', query: { select: obsId } })
}

async function ajouterAuLabo() {
  const s = ui.selectedSignal
  if (!s || obsStore.findObservationForSignal(s)) return
  const payload = signalToObsPayload(s)
  if (!payload) return
  await obsStore.addObservation(payload)
  signauxStore.removeSignal(s.id)
  ui.setLabHasNew(true)
}

function isAdded() {
  const s = ui.selectedSignal
  return s ? !!obsStore.findObservationForSignal(s) : false
}

</script>

<template>
  <AppModal
    v-if="ui.selectedSignal"
    :title="`Signal · ${ui.selectedSignal?.frequency}`"
    @close="close"
  >
    <div class="signal-modal__body">
      <div class="signal-modal__grid signal-modal__grid--top">
        <div class="sw-cell">
          <div class="signal-modal__key sw-key">Distance est.</div>
          <div class="signal-modal__val sw-val">{{ ui.selectedSignal?.distanceEst ?? '—' }}</div>
        </div>
        <div class="sw-cell">
          <div class="signal-modal__key sw-key">Reçu le</div>
          <div class="signal-modal__val sw-val">{{ ui.selectedSignal?.receivedAt }}</div>
        </div>
      </div>
      <Divider variant="dashed" />
      <div class="signal-modal__section">
        <div class="signal-modal__section-title sw-key">Propriétés du signal</div>
        <div class="sw-row">
          <span class="sw-key">Fréquence</span>
          <span class="sw-val">{{ ui.selectedSignal?.frequency }}</span>
        </div>
        <div class="sw-row">
          <span class="sw-key">Type</span>
          <span class="signal-modal__val--structure sw-val">
            <SignalTypeIcon :structure="ui.selectedSignal?.structure" :size="14" />
            {{ ui.selectedSignal?.structure ?? 'non uniforme' }}
          </span>
        </div>
        <div class="sw-row">
          <span class="sw-key">Direction</span>
          <span class="sw-val">azimut {{ ui.selectedSignal?.azimuth }}°</span>
        </div>
        <div class="sw-row">
          <span class="sw-key">Durée</span>
          <span class="sw-val">{{ ui.selectedSignal?.durationSec }} secondes</span>
        </div>
        <div class="sw-row">
          <span class="sw-key">Polarisation</span>
          <span class="sw-val">{{ ui.selectedSignal?.polarization }}</span>
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
