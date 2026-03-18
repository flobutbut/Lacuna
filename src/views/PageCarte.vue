<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMapNodesStore } from '@/stores/mapNodes'
import { useShipStore } from '@/stores/ship'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useObservationsStore } from '@/stores/observations'
import { useLabReportsStore } from '@/stores/labReports'
import { useUIStore } from '@/stores/ui'
import { OBJECT_TYPE_LABELS, COMPOSITION_LABELS, planetTypeLabel } from '@/constants/objectTypes'
import { buildObservationPayload } from '@/lib/observationPayload'
import { formatCoordinates } from '@/lib/formatUtils'
import { formatDistanceLy, getStarClassLabel } from '@/lib/starClassification'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { toPhysicalUnits, toLuminosityAndHz } from '@/lib/systemObjectConverters'
import StarSvgInline from '@/components/illustrations/StarSvgInline.vue'
import PlanetSvgInline from '@/components/illustrations/PlanetSvgInline.vue'
import CarteSystemCard from '@/components/carte/CarteSystemCard.vue'
import CarteOrbitalView from '@/components/carte/CarteOrbitalView.vue'
import CarteMap3D from '@/components/carte/CarteMap3D.vue'

const router = useRouter()
const mapStore = useMapNodesStore()
const shipStore = useShipStore()
const stellarStore = useStellarSystemsStore()
const systemObjectsStore = useSystemObjectsStore()
const obsStore = useObservationsStore()
const labReportsStore = useLabReportsStore()
const ui = useUIStore()

const selectedSystemId = ref(null)
const selectedPlanet = ref(null)
/** Étoile du système sélectionnée (objet system_objects ou synthétique) — null si on affiche le système ou une planète */
const selectedStar = ref(null)

/** True pendant le chargement des objets du système sélectionné (évite données vides/incomplètes) */
const detailsLoading = ref(false)

/** Onglet vue Carte : 'system' (vue orbitale) | 'map' (vue 3D, comme Conception) */
const carteViewMode = ref('system')


// Charger les stores (vaisseau avant carte : mapStore.fetch() a besoin de ship.id)
onMounted(async () => {
  ui.clearCarteHasNew()
  await ensureStoresLoaded(shipStore, stellarStore)
  await ensureStoresLoaded(mapStore)
  await shipStore.fetchTravels()
  await systemObjectsStore.fetchAll()
  await obsStore.fetch()
  await labReportsStore.fetchForObservations(obsStore.list.map((o) => o.id))
  // S'assurer que le système courant est sur la carte
  const currentId = shipStore.currentSystemId
  if (currentId && !mapStore.isOnMap(currentId)) {
    const stellar = stellarStore.list.find((s) => s.id === currentId)
    if (stellar) await mapStore.addNode(currentId, stellar.name ?? currentId, { visitedAt: new Date().toISOString().slice(0, 10) })
  }
  // Précharger les objets de tous les systèmes sur la carte (hors limite fetchAll)
  const nodes = mapStore.nodes
  if (nodes?.length > 0) {
    await Promise.all(nodes.map((n) => systemObjectsStore.fetchForSystem(n.systemId)))
  }
})

// Systèmes stellaires pour les nœuds de la carte
const stellarBySystemId = computed(() => {
  const m = {}
  for (const s of stellarStore.list) m[s.id] = s
  return m
})

/** Enrichit un nœud carte (stellar, spectralType, exoplanetCount) */
function enrichNode(n) {
  const stellar = stellarBySystemId.value[n.systemId]
  const objs = systemObjectsStore.getForSystem(n.systemId) ?? []
  const exoplanetCount = objs.length
    ? objs.filter((o) => ['PLANET', 'MOON', 'MINOR_BODY'].includes(o.type)).length
    : (stellar?.planets ?? 0)
  return {
    ...n,
    stellar,
    spectralType: stellar?.spectral_type ?? 'M',
    exoplanetCount,
  }
}

/** Système en cours (vaisseau) — en premier dans la liste si présent sur la carte */
const currentSystemItem = computed(() => {
  const currentId = shipStore.currentSystemId
  if (!currentId || !mapStore.isOnMap(currentId)) return null
  const n = mapStore.nodeBySystemId[currentId]
  return n ? enrichNode(n) : null
})

/** Autres systèmes : ordre chronologique inversé (plus récent en premier) */
const otherSystemsList = computed(() => {
  const currentId = shipStore.currentSystemId
  const others = mapStore.nodes.filter((n) => n.systemId !== currentId)
  const sorted = [...others].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return tb - ta
  })
  return sorted.map((n) => enrichNode(n))
})

/** Liste affichée : current + divider + others (pour message vide) */
const hasSystemsOnMap = computed(() => mapStore.nodes.length > 0)

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

/** Système stellaire courant (pour fiches) */
const selectedStellar = computed(() =>
  selectedSystemId.value ? stellarBySystemId.value[selectedSystemId.value] : null
)

/** Type DB planète → libellé affichage (design system : libellés français) */
/** Unités physiques pour la planète sélectionnée */
const selectedPlanetPhysics = computed(() =>
  selectedPlanet.value ? toPhysicalUnits(selectedPlanet.value) : null
)

/** Unités physiques pour l'étoile sélectionnée (rayon R⊕, etc.) */
const selectedStarPhysics = computed(() =>
  selectedStar.value ? toPhysicalUnits(selectedStar.value) : null
)

/** Luminosité et zone habitable pour l'étoile sélectionnée */
const selectedStarLumHz = computed(() => {
  const star = selectedStar.value
  const stellar = selectedStellar.value
  if (!star) return null
  return toLuminosityAndHz(star, stellar)
})

/** Format coordonnées système pour affichage */
/** Nombre de planètes/lunes du système sélectionné (system_objects, sinon stellar.planets) */
const selectedSystemPlanetCount = computed(() => {
  const id = selectedSystemId.value
  if (!id) return 0
  const objs = systemObjectsStore.getForSystem(id) ?? []
  const fromObjs = objs.filter((o) => ['PLANET', 'MOON', 'MINOR_BODY'].includes(o.type)).length
  if (fromObjs > 0) return fromObjs
  const stellar = selectedStellar.value
  return stellar?.planets != null ? Number(stellar.planets) : 0
})

/** Liste des planètes/lunes du système (sans l’étoile) pour le drill-down */
const systemBodiesForAnalyser = computed(() => {
  const systemId = selectedSystemId.value
  if (!systemId) return []
  const objs = systemObjectsStore.getForSystem(systemId) ?? []
  return objs
    .filter((o) => o.type !== 'STAR')
    .sort((a, b) => (a.designation || a.name || '').localeCompare(b.designation || b.name || ''))
})

// Sélection système
function selectSystem(systemId) {
  selectedSystemId.value = systemId
  selectedPlanet.value = null
  selectedStar.value = null
}

function onSelectPlanet(planet) {
  selectedPlanet.value = planet
  selectedStar.value = null
}

function onSelectStar(starObj) {
  selectedPlanet.value = null
  selectedStar.value = starObj ?? null
}

/** Payload observation — délègue à lib/observationPayload */
function addObservationPayload(body, systemName, systemId, distance) {
  return buildObservationPayload(
    body,
    {
      systemName,
      systemId,
      distance,
      displayName: body.name ?? '—',
    },
    obsStore.NIVEAUX
  )
}

/** Corps + étoile système (pour payload / find) — planète ou étoile sélectionnée */
function getSelectedBodyAndStar() {
  const systemId = selectedSystemId.value
  if (!systemId) return { body: null, star: null }
  const stellar = stellarBySystemId.value[systemId]
  const systemName = stellar?.name ?? systemId
  const starRef = { id: systemId, name: systemName, dist: stellar?.distance ?? '—' }
  const planet = selectedPlanet.value
  if (planet) {
    const body = systemObjectsStore.toBodyFormat(planet, systemName)
    return { body, star: starRef }
  }
  const starObj = selectedStar.value
  if (starObj) {
    const body = systemObjectsStore.toBodyFormat(starObj, systemName)
    return { body, star: starRef }
  }
  return { body: null, star: null }
}

const animatingKey = ref(null)

/** Analyser : trouve ou crée l’observation puis ouvre le laboratoire (comme ObservatoirePanel.analyser) */
async function analyser() {
  const { body, star } = getSelectedBodyAndStar()
  if (!body || !star) return
  await analyserForBodyPayload(body, star)
}

/** Logique commune : trouve ou crée l'observation puis ouvre le laboratoire */
async function analyserForBodyPayload(body, star) {
  if (!body || !star) return
  const bodyLabel = OBJECT_TYPE_LABELS[body.type] ?? 'Corps planétaire'
  const existing = obsStore.findObservationForBody(body, star, bodyLabel)
  if (existing) {
    router.push({ path: '/laboratoire', query: { select: existing.id } })
    return
  }
  const obsId = await obsStore.addObservation(
    addObservationPayload(body, star.name, star.id, star.dist)
  )
  ui.setLabHasNew(true)
  router.push({ path: '/laboratoire', query: { select: obsId } })
}

/** Lance l'analyse pour un objet system_objects (depuis la liste des astres du système) */
async function analyserForBody(bodyObj) {
  const systemId = selectedSystemId.value
  if (!systemId || !bodyObj) return
  const stellar = stellarBySystemId.value[systemId]
  const systemName = stellar?.name ?? systemId
  const star = { id: systemId, name: systemName, dist: stellar?.distance ?? '—' }
  const body = systemObjectsStore.toBodyFormat(bodyObj, systemName)
  await analyserForBodyPayload(body, star)
}

/** Analyser l’étoile du système (depuis la section header du drill-down) */
async function analyserForStar() {
  const systemId = selectedSystemId.value
  if (!systemId) return
  const stellar = selectedStellar.value
  if (!stellar) return
  const systemName = stellar.name ?? systemId
  const starRef = { id: systemId, name: systemName, dist: stellar.distance ?? '—' }
  const starBody = systemObjectsStore.toBodyFormat(
    { type: 'STAR', id: systemId, designation: systemId, name: systemName, spectral_type: stellar.spectral_type },
    systemName
  )
  await analyserForBodyPayload(starBody, starRef)
}

/** Ouvre le widget transit pour fixer le cap vers le système sélectionné */
function fixerCapCarte() {
  const systemId = selectedSystemId.value
  const stellar = selectedStellar.value
  if (!systemId || !stellar) return
  if (shipStore.currentSystemId === systemId) {
    ui.showNotification('Vous êtes déjà dans ce système', 3000)
    return
  }
  ui.selectStar({
    id: systemId,
    name: stellar.name ?? systemId,
    dist: stellar.distance ?? '—',
    spectral: getStarClassLabel(stellar.spectral_type) || '—',
  })
}

/** Ajouter au laboratoire pour un astre donné (liste drill-down) */
function addOnlyForBody(bodyObj) {
  const systemId = selectedSystemId.value
  if (!systemId || !bodyObj) return
  const stellar = stellarBySystemId.value[systemId]
  const systemName = stellar?.name ?? systemId
  const star = { id: systemId, name: systemName, dist: stellar?.distance ?? '—' }
  const body = systemObjectsStore.toBodyFormat(bodyObj, systemName)
  if (obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type] ?? 'Corps planétaire')) return
  const key = `${star.name}-${body.id}`
  animatingKey.value = key
  setTimeout(() => {
    obsStore.addObservation(addObservationPayload(body, star.name, star.id, star.dist))
    ui.setLabHasNew(true)
    animatingKey.value = null
  }, 350)
}

function isAddedForBody(bodyObj) {
  const systemId = selectedSystemId.value
  if (!systemId || !bodyObj) return false
  const stellar = stellarBySystemId.value[systemId]
  const systemName = stellar?.name ?? systemId
  const star = { id: systemId, name: systemName, dist: stellar?.distance ?? '—' }
  const body = systemObjectsStore.toBodyFormat(bodyObj, systemName)
  return !!obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type] ?? 'Corps planétaire')
}

function isAnimatingForBody(bodyObj) {
  const systemId = selectedSystemId.value
  if (!systemId || !bodyObj) return false
  const stellar = stellarBySystemId.value[systemId]
  const systemName = stellar?.name ?? systemId
  const star = { id: systemId, name: systemName, dist: stellar?.distance ?? '—' }
  const body = systemObjectsStore.toBodyFormat(bodyObj, systemName)
  return animatingKey.value === `${star.name}-${body.id}`
}

/** Libellé type planète (composition) pour affichage liste */
function planetTypeLabelForBody(body) {
  return COMPOSITION_LABELS[body?.composition_type] ?? OBJECT_TYPE_LABELS.PLANETE ?? 'Corps'
}

/** Position orbitale pour affichage (désignation ou demi-grand axe) */
function orbitPositionLabel(body) {
  if (body?.designation) return body.designation
  if (body?.orbital_semi_major_axis_au != null) return `${Number(body.orbital_semi_major_axis_au).toFixed(2)} UA`
  return '—'
}

/** Ajouter au laboratoire sans naviguer (comme ObservatoirePanel.addOnly) */
function addOnly() {
  const { body, star } = getSelectedBodyAndStar()
  if (!body || !star || obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type] ?? 'Corps planétaire')) return
  const key = `${star.name}-${body.id}`
  animatingKey.value = key
  setTimeout(() => {
    obsStore.addObservation(addObservationPayload(body, star.name, star.id, star.dist))
    ui.setLabHasNew(true)
    animatingKey.value = null
  }, 350)
}

function isAdded() {
  const { body, star } = getSelectedBodyAndStar()
  return body && star ? !!obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type] ?? 'Corps planétaire') : false
}

function isAnimating() {
  const { body, star } = getSelectedBodyAndStar()
  if (!body || !star) return false
  return animatingKey.value === `${star.name}-${body.id}`
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

function backToSystem() {
  selectedPlanet.value = null
  selectedStar.value = null
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

// S'assurer que le système sélectionné existe dans stellarStore.list (cas : ajouté via recherche directe)
async function ensureStellarForSelectedSystem(systemId) {
  if (!systemId) return
  if (stellarBySystemId.value[systemId]) return
  // Recherche directe dans Supabase via le store existant
  const results = await stellarStore.searchSystems(systemId, { excludeSystemId: null }).catch(() => [])
  if (Array.isArray(results) && results.length > 0) {
    const existingIds = new Set(stellarStore.list.map((s) => s.id))
    const toAdd = results.filter((s) => s?.id && !existingIds.has(s.id))
    if (toAdd.length > 0) {
      stellarStore.list.push(...toAdd)
    }
  }
}

// Charger les objets du système quand on sélectionne (toujours fetch : cache peut être partiel)
watch(
  selectedSystemId,
  async (systemId) => {
    if (!systemId) {
      detailsLoading.value = false
      return
    }
    detailsLoading.value = true
    try {
      await ensureStellarForSelectedSystem(systemId)
      await systemObjectsStore.fetchForSystem(systemId)
    } finally {
      detailsLoading.value = false
    }
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

// En passant à l'onglet Map : repasser au système parent si une planète était sélectionnée. Pas de chargement global — la vue 3D n'affiche que les nœuds carte (déjà en store).
watch(carteViewMode, (mode) => {
  if (mode === 'map') {
    if (selectedPlanet.value || selectedStar.value) {
      selectedPlanet.value = null
      selectedStar.value = null
    }
    // Charger les coordonnées stellaires uniquement pour les nœuds carte qui manquent (pas toute la base)
    const nodes = mapStore.nodes ?? []
    for (const node of nodes) {
      if (!stellarBySystemId.value[node.systemId]) {
        ensureStellarForSelectedSystem(node.systemId).catch(() => {})
      }
    }
  }
})
</script>

<template>
  <div class="page-full page-full--spread">
    <div class="carte-layout">
      <!-- Colonne gauche : liste des systèmes -->
      <div class="carte-systems-col">
        <h1 class="page-title">Carte galactique</h1>
        <div class="carte-systems__title sw-title sw-title--no-divider">Systèmes sur la carte</div>
        <div v-if="!hasSystemsOnMap" class="carte-systems-empty">
          Aucun système. Ajoutez-en depuis l'Observatoire ou le Laboratoire.
        </div>
        <div v-else class="carte-systems__list">
          <CarteSystemCard
            v-if="currentSystemItem"
            :key="currentSystemItem.systemId"
            :system-id="currentSystemItem.systemId"
            :name="currentSystemItem.name"
            :spectral-type="currentSystemItem.spectralType"
            :exoplanet-count="currentSystemItem.exoplanetCount"
            :badge="currentSystemItem.tracesFound > 0 ? currentSystemItem.tracesFound : ''"
            :state="selectedSystemId === currentSystemItem.systemId ? 'selected' : 'idle'"
            :dismissable="false"
            :visited="!!currentSystemItem.visitedAt"
            :is-current="true"
            @click="selectSystem(currentSystemItem.systemId)"
            @dismiss="removeFromMap(currentSystemItem.systemId)"
          />
          <div v-if="otherSystemsList.length > 0" class="carte-systems__others" :class="{ 'carte-systems__others--spaced': currentSystemItem }">
            <CarteSystemCard
              v-for="node in otherSystemsList"
              :key="node.systemId"
              :system-id="node.systemId"
              :name="node.name"
              :spectral-type="node.spectralType"
              :exoplanet-count="node.exoplanetCount"
              :badge="node.tracesFound > 0 ? node.tracesFound : ''"
              :state="selectedSystemId === node.systemId ? 'selected' : 'idle'"
              :dismissable="!node.visitedAt"
              :visited="!!node.visitedAt"
              :is-current="false"
              @click="selectSystem(node.systemId)"
              @dismiss="removeFromMap(node.systemId)"
            />
          </div>
        </div>
      </div>

      <!-- Colonne centrale : onglets System / Map puis vue orbitale ou projetée -->
      <div class="carte-map-col">
        <div class="carte-tabs">
          <button
            type="button"
            class="carte-tabs__btn"
            :class="{ 'carte-tabs__btn--active': carteViewMode === 'system' }"
            @click="carteViewMode = 'system'"
          >
            System
          </button>
          <button
            type="button"
            class="carte-tabs__btn"
            :class="{ 'carte-tabs__btn--active': carteViewMode === 'map' }"
            @click="carteViewMode = 'map'"
          >
            Map
          </button>
        </div>
        <div class="carte-map-container carte-map-container--orbital" :class="{ 'carte-map-container--3d': carteViewMode === 'map' }">
          <CarteMap3D
            v-if="carteViewMode === 'map'"
            :focus-star-id="selectedSystemId"
            @focus-star="selectSystem"
            @clear-focus="selectSystem(null)"
          />
          <template v-if="carteViewMode !== 'map'">
            <div v-if="mapStore.nodes.length === 0" class="carte-map-empty">
              Aucun système sur la carte. Ajoutez-en depuis l'Observatoire ou le Laboratoire.
            </div>
            <CarteOrbitalView
              v-else
              :system-id="selectedSystemId"
              :system-name="stellarBySystemId[selectedSystemId]?.name"
              :spectral-type="stellarBySystemId[selectedSystemId]?.spectral_type ?? 'G2V'"
              :star-selected="!!selectedStar"
              :selected-planet-id="selectedPlanet ? (selectedPlanet.designation || selectedPlanet.id) : null"
              :loading="detailsLoading"
              @select-planet="onSelectPlanet"
              @select-star="onSelectStar($event)"
            />
          </template>
        </div>
      </div>

      <!-- Colonne droite : détails système ou planète (cachée en vue 3D Map si besoin, ou gardée pour cohérence) -->
      <div class="carte-details-col">
        <div v-if="!selectedSystemId" class="carte-details-empty">
          Sélectionnez un système dans la liste.
        </div>
        <div v-else-if="detailsLoading" class="carte-details-empty">
          Chargement des données du système…
        </div>
        <template v-else-if="selectedPlanet">
          <!-- Détails planète — design system sw-row / sw-key / sw-val -->
          <div class="carte-details__header">
            <div class="carte-details__header-row">
              <button type="button" class="btn btn-ghost carte-back-btn" aria-label="Revenir au système" @click="backToSystem">←</button>
              <div class="carte-details__icon">
                <PlanetSvgInline :planet="selectedPlanet" :diameter="48" />
              </div>
            </div>
            <div class="carte-details__name">{{ selectedPlanet.name || selectedPlanet.designation || 'Planète' }}</div>
            <div class="carte-details__meta">
              <div class="sw-row">
                <span class="sw-key">Désignation</span>
                <span class="sw-val">{{ selectedPlanet.designation ?? '—' }}</span>
              </div>
              <div class="sw-row">
                <span class="sw-key">Type</span>
                <span class="sw-val">{{ planetTypeLabel(selectedPlanet) }}</span>
              </div>
              <div v-if="selectedPlanetPhysics?.radiusEarth != null" class="sw-row">
                <span class="sw-key">Rayon</span>
                <span class="sw-val">{{ selectedPlanetPhysics.radiusEarth?.toFixed(2) }} R⊕</span>
              </div>
              <div v-if="selectedPlanet.mass_earth != null" class="sw-row">
                <span class="sw-key">Masse</span>
                <span class="sw-val">{{ Number(selectedPlanet.mass_earth).toFixed(3) }} M⊕</span>
              </div>
              <div v-if="selectedPlanet.orbital_semi_major_axis_au != null" class="sw-row">
                <span class="sw-key">Demi-grand axe</span>
                <span class="sw-val">{{ selectedPlanet.orbital_semi_major_axis_au }} UA</span>
              </div>
              <div v-if="selectedPlanet.orbital_period_days != null" class="sw-row">
                <span class="sw-key">Période orbitale</span>
                <span class="sw-val">{{ selectedPlanet.orbital_period_days?.toFixed(0) }} j</span>
              </div>
              <div v-if="selectedPlanet.orbital_eccentricity != null" class="sw-row">
                <span class="sw-key">Excentricité</span>
                <span class="sw-val">{{ Number(selectedPlanet.orbital_eccentricity).toFixed(3) }}</span>
              </div>
              <div class="sw-row">
                <span class="sw-key">Zone habitable</span>
                <span class="sw-val" :class="selectedPlanet.in_habitable_zone ? 'ok' : 'err'">{{ selectedPlanet.in_habitable_zone ? 'Oui' : 'Non' }}</span>
              </div>
              <div v-if="selectedPlanet.has_rings" class="sw-row">
                <span class="sw-key">Anneaux</span>
                <span class="sw-val">Oui</span>
              </div>
              <div v-if="selectedPlanet.confirmation_status === 'DEBATED'" class="sw-row">
                <span class="sw-key">Statut</span>
                <span class="sw-val warn">Débattu</span>
              </div>
            </div>
          </div>
          <div class="carte-detail-actions">
            <button type="button" class="btn btn-primary" @click="analyser">
              Analyser
            </button>
            <button
              type="button"
              class="btn btn-primary observatoire-body__add-btn"
              :class="{ 'observatoire-body__add-btn--animating': isAnimating(), 'observatoire-body__add-btn--added': isAdded() }"
              :disabled="isAdded()"
              @click="addOnly"
            >
              {{ isAdded() ? 'Ajouté' : 'Ajouter au laboratoire' }}
            </button>
          </div>
        </template>
        <template v-else-if="selectedStar">
          <!-- Détails étoile — design system sw-row / sw-key / sw-val -->
          <div class="carte-details__header">
            <div class="carte-details__header-row">
              <button type="button" class="btn btn-ghost carte-back-btn" aria-label="Revenir au système" @click="backToSystem">←</button>
              <div class="carte-details__icon">
                <StarSvgInline :spectral-type="(selectedStar.spectral_type || selectedStellar?.spectral_type) ?? 'M'" />
              </div>
            </div>
            <div class="carte-details__name">{{ (selectedStar.name || selectedStar.designation || selectedStellar?.name) ?? selectedSystemId }}</div>
            <div class="carte-details__meta">
              <div class="sw-row">
                <span class="sw-key">Type</span>
                <span class="sw-val">{{ selectedStar.type === 'PULSAR' ? 'Pulsar' : 'Étoile' }}</span>
              </div>
              <div class="sw-row">
                <span class="sw-key">Type spectral</span>
                <span class="sw-val">{{ (selectedStar.spectral_type || selectedStellar?.spectral_type) ?? '—' }}</span>
              </div>
              <div v-if="selectedStar.mass_stellar != null" class="sw-row">
                <span class="sw-key">Masse</span>
                <span class="sw-val">{{ Number(selectedStar.mass_stellar).toFixed(3) }} M☉</span>
              </div>
              <div v-if="selectedStarPhysics?.radiusEarth != null" class="sw-row">
                <span class="sw-key">Rayon</span>
                <span class="sw-val">{{ selectedStarPhysics.radiusEarth?.toFixed(1) }} R⊕</span>
              </div>
              <template v-if="selectedStarLumHz">
                <div v-if="selectedStarLumHz.luminosity != null" class="sw-row">
                  <span class="sw-key">Luminosité</span>
                  <span class="sw-val">{{ selectedStarLumHz.luminosity?.toFixed(4) }} L☉</span>
                </div>
                <div v-if="selectedStarLumHz.hzInner != null && selectedStarLumHz.hzOuter != null" class="sw-row">
                  <span class="sw-key">Zone habitable</span>
                  <span class="sw-val">{{ selectedStarLumHz.hzInner?.toFixed(2) }} – {{ selectedStarLumHz.hzOuter?.toFixed(2) }} UA</span>
                </div>
              </template>
              <div class="sw-row">
                <span class="sw-key">Distance</span>
                <span class="sw-val">{{ formatDistanceLy(selectedStellar?.distance) }}</span>
              </div>
            </div>
          </div>
          <div class="carte-detail-actions">
            <button type="button" class="btn btn-primary" @click="analyser">
              Analyser
            </button>
            <button
              type="button"
              class="btn btn-primary observatoire-body__add-btn"
              :class="{ 'observatoire-body__add-btn--animating': isAnimating(), 'observatoire-body__add-btn--added': isAdded() }"
              :disabled="isAdded()"
              @click="addOnly"
            >
              {{ isAdded() ? 'Ajouté' : 'Ajouter au laboratoire' }}
            </button>
          </div>
        </template>
        <template v-else>
          <!-- Détails système — design system sw-row / sw-key / sw-val -->
          <div class="carte-details__header">
            <div class="carte-details__icon">
              <StarSvgInline :spectral-type="selectedStellar?.spectral_type ?? 'M'" />
            </div>
            <div class="carte-details__name">{{ selectedStellar?.name ?? selectedSystemId }}</div>
            <div class="carte-details__meta">
              <div class="sw-row">
                <span class="sw-key">Type</span>
                <span class="sw-val">{{ (getStarClassLabel(selectedStellar?.spectral_type) || selectedStellar?.spectral_type) ?? '—' }}</span>
              </div>
              <div class="sw-row">
                <span class="sw-key">Distance</span>
                <span class="sw-val">{{ formatDistanceLy(selectedStellar?.distance) }}</span>
              </div>
              <div v-if="selectedStellar?.coordinates" class="sw-row">
                <span class="sw-key">Coordonnées</span>
                <span class="sw-val">{{ formatCoordinates(selectedStellar) }}</span>
              </div>
              <div v-if="selectedStellar?.age != null" class="sw-row">
                <span class="sw-key">Âge</span>
                <span class="sw-val">{{ selectedStellar.age }}</span>
              </div>
              <div v-if="selectedStellar?.anomaly_level != null" class="sw-row">
                <span class="sw-key">Anomalie</span>
                <span class="sw-val" :class="selectedStellar.anomaly_level >= 40 ? 'warn' : ''">{{ selectedStellar.anomaly_level }}%</span>
              </div>
              <div class="sw-row">
                <span class="sw-key">Corps connus</span>
                <span class="sw-val">{{ selectedSystemPlanetCount }} planète(s) / lune(s)</span>
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
            <div class="carte-detail-actions">
              <button type="button" class="btn btn-primary" @click="analyserForStar">
                Analyser
              </button>
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="shipStore.currentSystemId === selectedSystemId"
                @click="fixerCapCarte"
              >
                Fixer le cap
              </button>
            </div>
          </div>

          <div v-if="systemBodiesForAnalyser.length > 0" class="carte-details__section">
            <div class="carte-details__section-title sw-title">Astres du système</div>
            <div class="carte-system-bodies">
              <div
                v-for="body in systemBodiesForAnalyser"
                :key="body.designation || body.id"
                class="carte-system-body"
              >
                <div class="carte-system-body__top">
                  <div class="carte-system-body__icon">
                    <PlanetSvgInline :planet="body" :diameter="32" />
                  </div>
                  <div class="carte-system-body__info">
                    <div class="carte-system-body__name sw-val">{{ body.name || body.designation || 'Corps' }}</div>
                    <div class="carte-system-body__meta">
                      <span class="carte-system-body__type">{{ planetTypeLabelForBody(body) }}</span>
                      <span class="carte-system-body__orbit">{{ orbitPositionLabel(body) }}</span>
                    </div>
                  </div>
                </div>
                <div class="carte-system-body__actions">
                  <button type="button" class="btn btn-primary carte-system-body__btn" @click="analyserForBody(body)">
                    Analyser
                  </button>
                  <button
                    type="button"
                    class="btn btn-primary observatoire-body__add-btn"
                    :class="{ 'observatoire-body__add-btn--animating': isAnimatingForBody(body), 'observatoire-body__add-btn--added': isAddedForBody(body) }"
                    :disabled="isAddedForBody(body)"
                    @click="addOnlyForBody(body)"
                  >
                    {{ isAddedForBody(body) ? 'Ajouté' : 'Ajouter au laboratoire' }}
                  </button>
                </div>
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
        </template>
      </div>
    </div>
  </div>
</template>
