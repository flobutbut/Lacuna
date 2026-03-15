<script setup>
import { computed, watch } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useMapNodesStore } from '@/stores/mapNodes'
import { computeTransit, formatDuration, formatDureeSimulee } from '@/lib/transit'
import AppModal from '@/components/AppModal.vue'
import Divider from '@/components/Divider.vue'
import ModalCell from '@/components/ModalCell.vue'

const ui = useUIStore()
const systemObjectsStore = useSystemObjectsStore()
const mapStore = useMapNodesStore()

watch(
  () => ui.selectedStar?.id,
  async (id) => {
    if (id) {
      await systemObjectsStore.fetchForSystem(id)
      if (!mapStore.loaded) await mapStore.fetch()
    }
  },
  { immediate: true }
)

const isOnMap = computed(() => ui.selectedStar ? mapStore.isOnMap(ui.selectedStar.id) : false)

async function addToCarte() {
  const star = ui.selectedStar
  if (!star) return
  ui.setCarteHasNew(true)
  const node = await mapStore.addNode(star.id, star.name ?? star.id)
  if (node) {
    ui.showNotification(`Système ${star.name} ajouté à la carte`)
  } else {
    ui.showNotification('Impossible d\'ajouter à la carte — vérifiez la migration 00022', 5000)
  }
}

const exoplanetLabel = computed(() => {
  const id = ui.selectedStar?.id
  if (!id) return '—'
  const objects = systemObjectsStore.getForSystem(id)
  const hasLoaded = systemObjectsStore.bySystem[id]
  if (!hasLoaded) return '…'
  const planets = objects.filter((o) => ['PLANET', 'MOON', 'MINOR_BODY'].includes(o.type))
  const count = planets.length
  return count === 0 ? 'Aucune connue' : count === 1 ? '1 connue' : `${count} connues`
})

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
  <AppModal
    v-if="ui.selectedStar && !ui.observatoireOpen"
    @close="close"
  >
    <template #header>
      <h2 class="app-modal__title">{{ ui.selectedStar?.name }}</h2>
    </template>
    <div class="travel-widget__content">
      <div v-if="ui.selectedStar?.isAnomaly" class="travel-widget__badge">Anomalie détectée</div>
      <div class="travel-widget__grid">
        <div class="sw-cell">
          <div class="travel-widget__key sw-key">DISTANCE</div>
          <div class="travel-widget__val sw-val">{{ ui.selectedStar?.dist }} al</div>
        </div>
        <div class="sw-cell">
          <div class="travel-widget__key sw-key">TYPE</div>
          <div class="travel-widget__val sw-val">{{ ui.selectedStar?.spectral }}</div>
        </div>
        <div class="sw-cell">
          <div class="travel-widget__key sw-key">EXOPLANÈTES</div>
          <div class="travel-widget__val sw-val">{{ exoplanetLabel }}</div>
        </div>
      </div>
      <Divider v-if="transit" variant="dashed" />
      <div v-if="transit" class="travel-widget__transit">
        <div class="travel-widget__transit-block">
          <div class="travel-widget__transit-title sw-key">Transit</div>
          <div class="travel-widget__transit-grid">
            <ModalCell variant="compact">
              <span class="sw-key">Accélération</span>
              <span class="sw-val">{{ formatDureeSimulee(transit.tAccel) }}</span>
            </ModalCell>
            <ModalCell variant="compact">
              <span class="sw-key">Inertie</span>
              <span class="sw-val">{{ formatDureeSimulee(transit.tInertie) }}</span>
            </ModalCell>
            <ModalCell variant="compact">
              <span class="sw-key">Freinage</span>
              <span class="sw-val">{{ formatDureeSimulee(transit.tFreinage) }}</span>
            </ModalCell>
          </div>
          <div class="sw-row">
            <span class="sw-key">Total simulé</span>
            <span class="sw-val">{{ formatDureeSimulee(transit.tPhysTotal) }}</span>
          </div>
          <div class="sw-row">
            <span class="sw-key">Durée joueur</span>
            <span class="sw-val">{{ formatDuration(transit.tJoueurSec) }}</span>
          </div>
          <div class="sw-row">
            <span class="sw-key">Carburant</span>
            <span class="sw-val">−{{ transit.carburantPct }}%</span>
          </div>
          <div class="sw-row">
            <span class="sw-key">Consommation (générations)</span>
            <span class="sw-val">{{ transit.generations }}</span>
          </div>
        </div>
      </div>
      <Divider variant="dashed" />
      <div class="travel-widget__footer sw-row">
        <span class="sw-key">Âge de la lumière d'observation</span>
        <span class="sw-val">{{ ui.selectedStar?.dist }} ans</span>
      </div>
      <div class="travel-widget__footer sw-row">
        <span class="sw-key">Probabilité d'anomalie</span>
        <span class="sw-val">{{ ui.selectedStar?.isAnomaly ? '61%' : '12%' }}</span>
      </div>
    </div>
    <template #footer>
      <button
        type="button"
        class="btn btn-primary"
        :disabled="isOnMap"
        @click="addToCarte"
      >
        {{ isOnMap ? 'Sur la carte' : 'Ajouter à la carte' }}
      </button>
      <button type="button" class="btn btn-primary" @click="analyser">
        [ANALYSER]
      </button>
      <button type="button" class="btn btn-primary" @click="fixerCap">
        [FIXER CAP]
      </button>
    </template>
  </AppModal>
</template>
