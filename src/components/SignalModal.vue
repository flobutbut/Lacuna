<script setup>
import { useUIStore } from '@/stores/ui'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'

const ui = useUIStore()
const signauxStore = useSignauxStore()
const obsStore = useObservationsStore()

function close() {
  ui.closeSignalModal()
}

async function analyserAuLabo() {
  const s = ui.selectedSignal
  if (!s) return
  const name = `${s.frequency} · azimut ${s.azimuth}°`
  await obsStore.addObservation({
    name,
    type: 'SIGNAL',
    support: 'EM_RADIO',
    system: '—',
    system_id: null,
    distance: s.distanceEst ?? '—',
    coords: '—',
    date: s.receivedAt,
    durationSec: s.durationSec ?? 72,
  })
  signauxStore.removeSignal(s.id)
  ui.setLabHasNew(true)
  ui.closeSignalModal()
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
          <div class="signal-modal__row">
            <span class="signal-modal__key">Structure</span>
            <span class="signal-modal__val">{{ ui.selectedSignal?.structure }}</span>
          </div>
        </div>
        <div class="observatoire-panel__footer">
          <button type="button" class="btn btn-primary" @click="analyserAuLabo">
            [ANALYSER]
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
