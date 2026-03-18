<script setup>
import { computed, watch, onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useShipStore } from '@/stores/ship'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useMapNodesStore } from '@/stores/mapNodes'
import { computeTransit, formatDuration, formatDureeSimulee } from '@/lib/transit'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import AppModal from '@/components/AppModal.vue'
import Divider from '@/components/Divider.vue'
import ModalCell from '@/components/ModalCell.vue'

const ui = useUIStore()
const shipStore = useShipStore()
const stellarStore = useStellarSystemsStore()
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

onMounted(async () => {
  await ensureStoresLoaded(shipStore, stellarStore)
})

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

async function fixerCap() {
  if (!ui.selectedStar) return
  if (shipStore.isInTransit) {
    ui.showNotification('Transit déjà en cours — attendez l’arrivée avant de fixer un nouveau cap', 4000)
    return
  }
  if (!shipStore.ship) {
    ui.showNotification('Vaisseau non chargé — réessayez dans une seconde', 4000)
    return
  }
  const star = ui.selectedStar
  // S'assurer que la destination existe côté DB (résolution dynamique si besoin)
  let targetSystem = stellarStore.list.find((s) => s.id === star.id)
  if (!targetSystem) {
    const results = await stellarStore.searchSystems(star.id, { excludeSystemId: shipStore.currentSystemId })
    if (Array.isArray(results) && results.length > 0) {
      // Fusionner dans la liste locale sans doublon
      const existing = stellarStore.list.slice()
      const byId = new Map(existing.map((s) => [s.id, s]))
      for (const sys of results) {
        if (sys?.id && !byId.has(sys.id)) byId.set(sys.id, sys)
      }
      stellarStore.list = Array.from(byId.values())
      targetSystem = results.find((s) => s.id === star.id) || Array.from(byId.values()).find((s) => s.id === star.id)
    }
  }
  if (!targetSystem) {
    ui.showNotification('Impossible de fixer un cap vers ce système (aucune entrée trouvée dans le catalogue ARCA).', 5000)
    return
  }
  const meta = star.dist ? computeTransit(star.dist) : null
  const result = await shipStore.startTransit(star.id, star.dist, meta ?? undefined)
  if (!result) {
    ui.showNotification('Impossible de lancer le transit (vaisseau non chargé ou erreur Supabase)', 5000)
    return
  }
  ui.showNotification(`CAP FIXÉ — ${star.name} — ${star.dist} al — transit en cours`, 4000)
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
      <button
        type="button"
        class="btn btn-primary"
        :disabled="shipStore.isInTransit && shipStore.currentTransitPhase !== 'COASTING'"
        @click="fixerCap"
      >
        <span v-if="shipStore.isInTransit && shipStore.currentTransitPhase !== 'COASTING'">
          [CAP VERROUILLÉ — MANŒUVRE]
        </span>
        <span v-else>
          [FIXER CAP]
        </span>
      </button>
    </template>
  </AppModal>
</template>
