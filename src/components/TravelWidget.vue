<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { computeTransit, formatDuration, formatDureeSimulee } from '@/lib/transit'

const ui = useUIStore()

const transit = computed(() => {
  if (!ui.selectedStar?.dist) return null
  return computeTransit(ui.selectedStar.dist)
})

function analyser() {
  ui.openObservatoire()
}

function fixerCap() {
  if (!ui.selectedStar) return
  ui.showNotification(`CAP FIXÉ — ${ui.selectedStar.name} — ${ui.selectedStar.dist} al`)
  ui.selectStar(null)
}

function close() {
  ui.selectStar(null)
}
</script>

<template>
  <div
    v-if="ui.selectedStar && !ui.observatoireOpen"
    class="travel-widget travel-widget--full"
  >
    <div class="travel-widget__backdrop" @click="close" />
    <div class="travel-widget__inner">
      <div class="travel-widget__header">
        <span class="travel-widget__name">{{ ui.selectedStar.name }}</span>
        <button type="button" class="travel-widget__close" @click="close">×</button>
      </div>
      <div v-if="ui.selectedStar.isAnomaly" class="travel-widget__badge">Anomalie détectée</div>
      <div class="travel-widget__grid">
        <div class="travel-widget__cell">
          <div class="travel-widget__key">DISTANCE</div>
          <div class="travel-widget__val">{{ ui.selectedStar.dist }} al</div>
        </div>
        <div class="travel-widget__cell">
          <div class="travel-widget__key">TYPE</div>
          <div class="travel-widget__val">{{ ui.selectedStar.spectral }}</div>
        </div>
      </div>
      <div v-if="transit" class="travel-widget__transit">
        <div class="travel-widget__transit-title">Transit estimé</div>
        <div class="travel-widget__transit-row">
          <span>Accélération (simulée)</span>
          <span>{{ formatDureeSimulee(transit.tAccel) }}</span>
        </div>
        <div class="travel-widget__transit-row">
          <span>Inertie (simulée)</span>
          <span>{{ formatDureeSimulee(transit.tInertie) }}</span>
        </div>
        <div class="travel-widget__transit-row">
          <span>Freinage (simulé)</span>
          <span>{{ formatDureeSimulee(transit.tFreinage) }}</span>
        </div>
        <div class="travel-widget__transit-row">
          <span>Carburant</span>
          <span>−{{ transit.carburantPct }}%</span>
        </div>
        <div class="travel-widget__transit-row">
          <span>Consommation (génération)</span>
          <span>{{ transit.generations }}</span>
        </div>
        <div class="travel-widget__transit-row travel-widget__transit-total">
          <span>Durée joueur totale</span>
          <span>{{ formatDuration(transit.tJoueurSec) }}</span>
        </div>
      </div>
      <div class="travel-widget__footer">
        Observé il y a {{ ui.selectedStar.dist }} ans
      </div>
      <div class="travel-widget__footer">
        Probabilité d'anomalie : {{ ui.selectedStar.isAnomaly ? '61%' : '12%' }}
      </div>
      <div class="travel-widget__actions">
        <button type="button" class="btn btn-primary" @click="analyser">
          [ANALYSER]
        </button>
        <button type="button" class="btn btn-primary" @click="fixerCap">
          [FIXER CAP]
        </button>
      </div>
    </div>
  </div>
</template>
