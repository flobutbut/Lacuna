<script setup>
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'
import SignalTypeIcon from '@/components/SignalTypeIcon.vue'

const router = useRouter()
const ui = useUIStore()
const signauxStore = useSignauxStore()
const obsStore = useObservationsStore()

function signalToObsPayload(s) {
  if (!s) return null
  const name = `${s.frequency} · azimut ${s.azimuth}°`
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
  <div v-if="ui.selectedSignal" class="observatoire-panel signal-modal">
    <div class="observatoire-panel__backdrop" @click="close" />
    <div class="observatoire-panel__box">
      <div class="observatoire-panel__header">
        <h2 class="observatoire-panel__title">Signal · {{ ui.selectedSignal?.frequency }}</h2>
        <button type="button" class="observatoire-panel__close" @click="close">×</button>
      </div>
      <div class="observatoire-panel__body">
        <div class="signal-modal__grid">
          <div class="signal-modal__cell">
            <div class="signal-modal__key">FRÉQUENCE</div>
            <div class="signal-modal__val">{{ ui.selectedSignal?.frequency }}</div>
          </div>
          <div class="signal-modal__cell">
            <div class="signal-modal__key">TYPE</div>
            <div class="signal-modal__val signal-modal__val--structure">
              <SignalTypeIcon :structure="ui.selectedSignal?.structure" :size="14" />
              {{ ui.selectedSignal?.structure ?? 'non uniforme' }}
            </div>
          </div>
          <div class="signal-modal__cell">
            <div class="signal-modal__key">DIRECTION</div>
            <div class="signal-modal__val">azimut {{ ui.selectedSignal?.azimuth }}°</div>
          </div>
          <div class="signal-modal__cell">
            <div class="signal-modal__key">DISTANCE EST.</div>
            <div class="signal-modal__val">{{ ui.selectedSignal?.distanceEst ?? '—' }}</div>
          </div>
          <div class="signal-modal__cell">
            <div class="signal-modal__key">REÇU LE</div>
            <div class="signal-modal__val">{{ ui.selectedSignal?.receivedAt }}</div>
          </div>
        </div>
        <div class="signal-modal__rows">
          <div class="signal-modal__row">
            <span class="signal-modal__key">Durée du signal</span>
            <span class="signal-modal__val">{{ ui.selectedSignal?.durationSec }} secondes</span>
          </div>
          <div class="signal-modal__row">
            <span class="signal-modal__key">Polarisation</span>
            <span class="signal-modal__val">{{ ui.selectedSignal?.polarization }}</span>
          </div>
        </div>
        <div class="observatoire-panel__footer signal-modal__footer">
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
        </div>
      </div>
    </div>
  </div>
</template>
