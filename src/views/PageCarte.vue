<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useMapNodesStore } from '@/stores/mapNodes'
import { useShipStore } from '@/stores/ship'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useObservationsStore } from '@/stores/observations'
import { useLabReportsStore } from '@/stores/labReports'
import { useUIStore } from '@/stores/ui'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import StarSvgInline from '@/components/illustrations/StarSvgInline.vue'
import CarteSystemCard from '@/components/carte/CarteSystemCard.vue'
import CarteOrbitalView from '@/components/carte/CarteOrbitalView.vue'

const mapStore = useMapNodesStore()
const shipStore = useShipStore()
const stellarStore = useStellarSystemsStore()
const systemObjectsStore = useSystemObjectsStore()
const obsStore = useObservationsStore()
const labReportsStore = useLabReportsStore()
const ui = useUIStore()

const selectedSystemId = ref(null)
const selectedPlanet = ref(null)

// Charger les stores
onMounted(async () => {
  await ensureStoresLoaded(shipStore, stellarStore, mapStore)
  await systemObjectsStore.fetchAll()
  await obsStore.fetch()
  await labReportsStore.fetchForObservations(obsStore.list.map((o) => o.id))
  // S'assurer que le système courant est sur la carte
  const currentId = shipStore.currentSystemId
  if (currentId && !mapStore.isOnMap(currentId)) {
    const stellar = stellarStore.list.find((s) => s.id === currentId)
    if (stellar) await mapStore.addNode(currentId, stellar.name ?? currentId, { visitedAt: new Date().toISOString().slice(0, 10) })
  }
})

// Systèmes stellaires pour les nœuds de la carte
const stellarBySystemId = computed(() => {
  const m = {}
  for (const s of stellarStore.list) m[s.id] = s
  return m
})

// Systèmes sur la carte (pour la liste)
const systemsList = computed(() => {
  const stellar = stellarBySystemId.value
  return mapStore.nodes.map((n) => {
    const s = stellar[n.systemId]
    const objs = systemObjectsStore.getForSystem(n.systemId) ?? []
    const exoplanetCount = objs.length
      ? objs.filter((o) => ['PLANET', 'MOON', 'MINOR_BODY'].includes(o.type)).length
      : (s?.planets ?? 0)
    return {
      ...n,
      stellar: s,
      spectralType: s?.spectral_type ?? 'M',
      exoplanetCount,
    }
  })
})

// Observations et rapports pour le système sélectionné
const selectedObservations = computed(() => {
  const systemId = selectedSystemId.value
  if (!systemId) return []
  return obsStore.list.filter((o) => o.system_id === systemId)
})

const selectedReports = computed(() => {
  const obs = selectedObservations.value
  const reports = []
  for (const o of obs) {
    const r = labReportsStore.getReportsForObs(o.id) ?? []
    reports.push(...r.map((rep) => ({ ...rep, obsName: o.name })))
  }
  return reports
})

// Sélection système
function selectSystem(systemId) {
  selectedSystemId.value = systemId
  selectedPlanet.value = null
}

function onSelectPlanet(planet) {
  selectedPlanet.value = planet
}

function onSelectStar() {
  selectedPlanet.value = null
}

async function removeFromMap(systemId) {
  const id = systemId ?? selectedSystemId.value
  if (!id) return
  await mapStore.removeNode(id)
  if (selectedSystemId.value === id) {
    selectedSystemId.value = null
    selectedPlanet.value = null
  }
}

// Auto-sélection du premier système si aucun n'est sélectionné
watch(
  () => mapStore.nodes,
  (nodes) => {
    if (nodes?.length > 0 && !selectedSystemId.value) {
      selectedSystemId.value = nodes[0].systemId
    }
  },
  { immediate: true, deep: true }
)

// Charger les objets du système quand on sélectionne (toujours fetch : cache peut être partiel)
watch(
  selectedSystemId,
  async (systemId) => {
    if (systemId) await systemObjectsStore.fetchForSystem(systemId)
  },
  { immediate: true }
)

watch(
  () => shipStore.currentSystemId,
  (currentId) => {
    if (currentId && !mapStore.isOnMap(currentId)) {
      const stellar = stellarStore.list.find((s) => s.id === currentId)
      if (stellar) mapStore.addNode(currentId, stellar.name ?? currentId, { visitedAt: new Date().toISOString().slice(0, 10) })
    }
  }
)
</script>

<template>
  <div class="page-full page-full--spread">
    <div class="carte-layout">
      <!-- Colonne gauche : liste des systèmes -->
      <div class="carte-systems-col">
        <h1 class="page-title">Carte galactique</h1>
        <div class="carte-systems__title sw-title">Systèmes sur la carte</div>
        <div v-if="systemsList.length === 0" class="carte-systems-empty">
          Aucun système. Ajoutez-en depuis l'Observatoire ou le Laboratoire.
        </div>
        <template v-else>
          <CarteSystemCard
            v-for="node in systemsList"
            :key="node.systemId"
            :system-id="node.systemId"
            :name="node.name"
            :spectral-type="node.spectralType"
            :exoplanet-count="node.exoplanetCount"
            :badge="node.tracesFound > 0 ? node.tracesFound : ''"
            :state="selectedSystemId === node.systemId ? 'selected' : 'idle'"
            @click="selectSystem(node.systemId)"
            @dismiss="removeFromMap(node.systemId)"
          />
        </template>
      </div>

      <!-- Colonne centrale : vue orbitale du système sélectionné -->
      <div class="carte-map-col">
        <div class="carte-map-container carte-map-container--orbital">
          <div v-if="mapStore.nodes.length === 0" class="carte-map-empty">
            Aucun système sur la carte. Ajoutez-en depuis l'Observatoire ou le Laboratoire.
          </div>
          <CarteOrbitalView
            v-else
            :system-id="selectedSystemId"
            :system-name="stellarBySystemId[selectedSystemId]?.name"
            :spectral-type="stellarBySystemId[selectedSystemId]?.spectral_type ?? 'G2V'"
            @select-planet="onSelectPlanet"
            @select-star="onSelectStar"
          />
        </div>
      </div>

      <!-- Colonne droite : détails système ou planète -->
      <div class="carte-details-col">
        <div v-if="!selectedSystemId" class="carte-details-empty">
          Sélectionnez un système dans la liste.
        </div>
        <template v-else-if="selectedPlanet">
          <!-- Détails planète -->
          <div class="carte-details__header">
            <div class="carte-details__name">{{ selectedPlanet.name || selectedPlanet.designation || 'Planète' }}</div>
            <div class="carte-details__meta">
              <div class="sw-row">
                <span class="sw-key">Désignation</span>
                <span class="sw-val">{{ selectedPlanet.designation ?? '—' }}</span>
              </div>
              <div class="sw-row">
                <span class="sw-key">Type</span>
                <span class="sw-val">{{ selectedPlanet.type ?? '—' }}</span>
              </div>
              <div v-if="selectedPlanet.orbital_semi_major_axis_au != null" class="sw-row">
                <span class="sw-key">Demi-grand axe (UA)</span>
                <span class="sw-val">{{ selectedPlanet.orbital_semi_major_axis_au }}</span>
              </div>
              <div v-if="selectedPlanet.orbital_period_days != null" class="sw-row">
                <span class="sw-key">Période (j)</span>
                <span class="sw-val">{{ selectedPlanet.orbital_period_days?.toFixed(0) }}</span>
              </div>
              <div v-if="selectedPlanet.in_habitable_zone" class="sw-row">
                <span class="sw-key">Zone habitable</span>
                <span class="sw-val">Oui</span>
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-ghost carte-back-btn" @click="onSelectStar">
            Retour à l'étoile
          </button>
        </template>
        <template v-else>
          <!-- Détails système -->
          <div class="carte-details__header">
            <div class="carte-details__icon">
              <StarSvgInline :spectral-type="stellarBySystemId[selectedSystemId]?.spectral_type ?? 'M'" />
            </div>
            <div class="carte-details__name">{{ stellarBySystemId[selectedSystemId]?.name ?? selectedSystemId }}</div>
            <div class="carte-details__meta">
              <div class="sw-row">
                <span class="sw-key">Type spectral</span>
                <span class="sw-val">{{ stellarBySystemId[selectedSystemId]?.spectral_type ?? '—' }}</span>
              </div>
              <div class="sw-row">
                <span class="sw-key">Distance</span>
                <span class="sw-val">{{ stellarBySystemId[selectedSystemId]?.distance ?? '—' }} al</span>
              </div>
              <div class="sw-row">
                <span class="sw-key">Visité</span>
                <span class="sw-val">{{ mapStore.nodeBySystemId[selectedSystemId]?.visitedAt ? 'Oui' : '—' }}</span>
              </div>
              <div v-if="mapStore.nodeBySystemId[selectedSystemId]?.tracesFound > 0" class="sw-row">
                <span class="sw-key">Traces</span>
                <span class="sw-val">{{ mapStore.nodeBySystemId[selectedSystemId].tracesFound }}</span>
              </div>
            </div>
          </div>

          <div v-if="selectedReports.length > 0" class="carte-details__section">
            <div class="carte-details__section-title sw-title">Rapports d'analyse</div>
            <div
              v-for="(r, i) in selectedReports"
              :key="r.instrumentId + r.date + i"
              class="carte-report"
            >
              <div class="carte-report__instrument sw-val">{{ r.instrument }} — {{ r.fiability }}%</div>
              <div class="carte-report__results">{{ r.results }}</div>
            </div>
          </div>

          <button type="button" class="btn btn-ghost carte-remove-btn" @click="removeFromMap()">
            Retirer ce système de la carte
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
