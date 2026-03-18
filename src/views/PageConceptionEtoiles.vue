<script setup>
import { ref, computed, watch } from 'vue'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useShipStore } from '@/stores/ship'
import { useStarSelection } from '@/composables/useStarSelection'
import { useStars3DConception } from '@/composables/useStars3DConception'
import { formatDistanceLy, getStarClassLabel, getStarTypeForFilter } from '@/lib/starClassification'
import { formatNumber } from '@/lib/formatUtils'
import ObservatoireSpectralFilters from '@/components/ObservatoireSpectralFilters.vue'
import Stars3DCanvas from '@/components/conception/Stars3DCanvas.vue'

const stellarStore = useStellarSystemsStore()
const systemObjectsStore = useSystemObjectsStore()
const shipStore = useShipStore()
const loading = ref(true)
const spectralFilter = ref('visible')
const exoplanetFilter = ref(false)
const typeFilter = ref('all')
const constellationsEnabled = ref(false)
const transitsEnabled = ref(false)

const { selectedStarId, selectStar, clearSelection } = useStarSelection({ mode: 'standalone' })

const spectralFilterRef = computed(() => spectralFilter.value)
const exoplanetFilterRef = computed(() => exoplanetFilter.value)
const typeFilterRef = computed(() => typeFilter.value)
const { points } = useStars3DConception(spectralFilterRef, exoplanetFilterRef, typeFilterRef)

/** Options dynamiques pour le filtre de type : basées uniquement sur les types spectraux réellement présents. */
const availableTypeFilterOptions = computed(() => {
  const source = stellarStore.conceptionForSky?.length ? stellarStore.conceptionForSky : stellarStore.list
  if (!Array.isArray(source) || source.length === 0) {
    return [{ id: 'all', label: 'Tous types' }]
  }

  const present = new Set()
  for (const s of source) {
    const starLike = {
      spectral_type: s.spectral_type ?? s.spectral ?? s.star?.spectral_type ?? s.star?.spectral,
      id: s.id,
      name: s.name,
    }
    const t = getStarTypeForFilter(starLike)
    if (t) present.add(t)
  }

  // Ordre d'affichage UX : M, K, G, F, A, B, O, L, T, Y, D
  const ORDER = ['M', 'K', 'G', 'F', 'A', 'B', 'O', 'L', 'T', 'Y', 'D']
  const options = []
  for (const code of ORDER) {
    if (!present.has(code)) continue
    options.push({
      id: 'type_' + code,
      // Libellé lisible dérivé de STAR_TYPE_LABELS via getStarClassLabel.
      // On lui passe la lettre : ex. 'M' → 'Naine rouge (M)'.
      label: getStarClassLabel(code),
    })
  }

  return [{ id: 'all', label: 'Tous types' }, ...options]
})

/** Segments de trajets (origine → destination) dans l'ordre des visites, pour la vue 3D. */
const transitsSegments = computed(() => {
  const list = shipStore.travels ?? []
  return list.map((t) => ({ fromId: t.origin_system_id, toId: t.destination_system_id }))
})

const currentSystem = computed(() => {
  const id = shipStore.currentSystemId ?? 'SOL'
  return stellarStore.list.find((s) => s.id === id) ?? { id, name: id }
})

const selectedStar = computed(() => {
  const id = selectedStarId.value
  if (!id) return null
  return points.value.find((p) => p.id === id) ?? stellarStore.list.find((s) => s.id === id)
})

/** Système complet (stellar_systems) pour infos détaillées */
const selectedStellar = computed(() => {
  const id = selectedStarId.value
  if (!id) return null
  return stellarStore.list.find((s) => s.id === id) ?? selectedStar.value?.star ?? null
})

const selectedStarClassLabel = computed(() => {
  const st = selectedStellar.value?.spectral_type ?? selectedStar.value?.spectral ?? null
  if (!st) return '—'
  return getStarClassLabel(st)
})

/** Nombre de planètes/lunes (system_objects, sinon stellar.planets en fallback) */
const selectedExoplanetCount = computed(() => {
  const id = selectedStarId.value
  if (!id) return null
  const objs = systemObjectsStore.getForSystem(id) ?? []
  const fromObjs = objs.filter((o) => ['PLANET', 'MOON', 'MINOR_BODY'].includes(o.type)).length
  if (fromObjs > 0) return fromObjs
  const stellar = selectedStellar.value
  return stellar?.planets != null ? Number(stellar.planets) : 0
})

watch(selectedStarId, (id) => {
  if (id) systemObjectsStore.fetchForSystem(id)
}, { immediate: true })

// Désélectionner si l'étoile sélectionnée ne correspond pas au filtre type (plus dans la liste filtrée)
watch(
  () => [typeFilter.value, points.value],
  () => {
    const id = selectedStarId.value
    if (!id) return
    const visible = points.value.some((p) => p.id === id)
    if (!visible) clearSelection()
  },
  { deep: true }
)

async function load() {
  loading.value = true
  await ensureStoresLoaded(stellarStore, shipStore)
  await stellarStore.fetchVisibleForSky(shipStore.currentSystemId ?? 'SOL', 18)
  await stellarStore.fetchConstellationLines()
  await shipStore.fetchTravels()
  loading.value = false
  // Catalogue conception (tous les systèmes avec coordonnées) en arrière-plan
  stellarStore.fetchConceptionStars().catch((e) => console.warn('[Conception] fetchConceptionStars:', e))
}

watch(loading, (isLoading) => {
  if (!isLoading && currentSystem.value) {
    selectStar(currentSystem.value)
  }
})

load()
</script>

<template>
  <div class="page-conception-etoiles">
    <Stars3DCanvas
      v-if="!loading"
      :spectral-filter="spectralFilter"
      :exoplanet-filter="exoplanetFilter"
      :type-filter="typeFilter"
      :focus-star-id="selectedStarId"
      :constellations-enabled="constellationsEnabled"
      :transits-enabled="transitsEnabled"
      :transits-segments="transitsSegments"
      @focus-star="selectStar"
      @clear-focus="clearSelection"
    />
    <div v-if="loading" class="conception-loading">
      Chargement des étoiles…
    </div>
    <div v-if="!loading" class="conception-overlay">
      <div class="conception-tabs">
        <ObservatoireSpectralFilters
          standalone
          :spectral-filter="spectralFilter"
          :exoplanet-filter="exoplanetFilter"
          :type-filter="typeFilter"
          :type-filter-options="availableTypeFilterOptions"
          :constellations-enabled="constellationsEnabled"
          :transits-enabled="transitsEnabled"
          class="conception-tabs__filters"
          @update:spectral-filter="spectralFilter = $event"
          @update:exoplanet-filter="exoplanetFilter = $event"
          @update:type-filter="typeFilter = $event"
          @update:constellations-enabled="constellationsEnabled = $event"
          @update:transits-enabled="transitsEnabled = $event"
          @focus-star="selectStar"
          @clear-focus="clearSelection"
        />
      </div>
      <div class="conception-tiles">
        <div class="side-widget">
          <div class="sw-title">État de la vue</div>
          <div class="sw-row">
            <div class="sw-key">Étoiles affichées</div>
            <div class="sw-val">{{ points.length }}</div>
          </div>
          <div class="sw-row">
            <div class="sw-key">Système courant</div>
            <div class="sw-val">{{ currentSystem?.name ?? currentSystem?.id ?? '—' }}</div>
          </div>
          <div class="sw-row">
            <div class="sw-key">Origine</div>
            <div class="sw-val">Barycentre</div>
          </div>
          <div v-if="stellarStore.conceptionLoading" class="sw-row">
            <div class="sw-key">Catalogue</div>
            <div class="sw-val">Chargement… {{ formatNumber((stellarStore.conceptionForSky ?? []).length) }} systèmes</div>
          </div>
          <div v-else-if="stellarStore.conceptionFullyLoaded && stellarStore.conceptionForSky?.length" class="sw-row">
            <div class="sw-key">Catalogue</div>
            <div class="sw-val">{{ stellarStore.conceptionForSky.length }} systèmes</div>
          </div>
        </div>
        <div class="side-widget">
          <div class="sw-title">Étoile sélectionnée</div>
          <template v-if="selectedStar">
            <div class="sw-row">
              <div class="sw-key">Nom</div>
              <div class="sw-val">{{ selectedStar.name ?? selectedStar.id }}</div>
            </div>
            <div class="sw-row">
              <div class="sw-key">Type</div>
              <div class="sw-val">{{ selectedStarClassLabel }}</div>
            </div>
            <div class="sw-row">
              <div class="sw-key">Type spectral</div>
              <div class="sw-val">{{ selectedStellar?.spectral_type ?? selectedStar.spectral ?? '—' }}</div>
            </div>
            <div class="sw-row">
              <div class="sw-key">Distance</div>
              <div class="sw-val">{{ formatDistanceLy(selectedStellar?.distance ?? selectedStar.star?.distance ?? selectedStar.dist) }}</div>
            </div>
            <div v-if="selectedExoplanetCount != null" class="sw-row">
              <div class="sw-key">Exoplanètes</div>
              <div class="sw-val">{{ selectedExoplanetCount === 0 ? 'Aucune' : selectedExoplanetCount === 1 ? '1 planète/lune' : `${selectedExoplanetCount} planètes/lunes` }}</div>
            </div>
            <div v-if="selectedStellar?.age != null" class="sw-row">
              <div class="sw-key">Âge</div>
              <div class="sw-val">{{ selectedStellar.age }}</div>
            </div>
            <div v-if="selectedStellar?.habitable_zone != null" class="sw-row">
              <div class="sw-key">Zone habitable</div>
              <div class="sw-val">{{ selectedStellar.habitable_zone }}</div>
            </div>
            <div v-if="selectedStellar?.anomaly_level != null && selectedStellar.anomaly_level > 0" class="sw-row">
              <div class="sw-key">Anomalie</div>
              <div class="sw-val" :class="selectedStellar.anomaly_level >= 40 ? 'warn' : ''">{{ selectedStellar.anomaly_level }}%</div>
            </div>
          </template>
          <div v-else class="sw-row">
            <div class="sw-key">—</div>
            <div class="sw-val text-muted">Aucune</div>
          </div>
        </div>
      </div>
      <div class="conception-legend">
        <span class="conception-legend-text">Vue 3D — origine : barycentre des étoiles · Molette : zoom</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-conception-etoiles {
  position: absolute;
  inset: 0;
  background: var(--color-bg);
}

.conception-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: var(--text-md);
}

.conception-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.conception-overlay > * {
  pointer-events: auto;
}

.conception-tabs {
  position: absolute;
  top: var(--sidebar-offset);
  left: var(--sidebar-offset);
  right: calc(var(--sidebar-offset) + var(--sidebar-width));
  padding-left: var(--space-6);
  padding-right: var(--space-6);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-4);
  z-index: 20;
}

.conception-tabs__filters {
  flex-shrink: 0;
}

.conception-tiles {
  position: absolute;
  right: var(--sidebar-offset);
  top: var(--sidebar-offset);
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  z-index: 20;
}

.conception-tiles .side-widget {
  width: 100%;
}

.conception-legend {
  position: absolute;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-2) var(--space-4);
  background: var(--color-panel);
  border: 1px solid var(--border-default);
  border-radius: var(--border-radius-md);
}

.conception-legend-text {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-muted);
}
</style>
