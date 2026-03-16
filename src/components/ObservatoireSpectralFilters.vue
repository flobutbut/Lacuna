<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useShipStore } from '@/stores/ship'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'
import { filterBySpectralBand } from '@/lib/spectralBands'
import { xyzToRaDec, raDecToVector } from '@/lib/stellarProjection'
import AppSelect from '@/components/AppSelect.vue'

const ui = useUIStore()
const stellarStore = useStellarSystemsStore()
const systemObjectsStore = useSystemObjectsStore()
const shipStore = useShipStore()
const signauxStore = useSignauxStore()
const obsStore = useObservationsStore()
const searchQuery = ref('')
const searchInputRef = ref(null)
const searchExpanded = ref(false)
let searchCollapseTimeout = null
/** Tous les systèmes correspondant à la requête actuelle */
const searchMatches = ref([])
/** Index du résultat affiché (0 = premier) */
const currentMatchIndex = ref(0)

const FILTERS = [
  { id: 'visible', label: 'Visuel', title: 'Spectre visible (V)' },
  { id: 'ir', label: 'IR', title: 'Infrarouge proche (I) — naines M, objets froids' },
  { id: 'uv', label: 'UV', title: 'Ultraviolet (U) — étoiles chaudes O, B, A' },
  { id: 'r', label: 'R', title: 'Rouge (R) — géantes, intermédiaire' },
]

/**
 * Recherche systèmes : interroge Supabase par name et id (case-insensitive, contains).
 * Ne dépend pas de list ni de visibleForSky — trouve toute étoile en base (ex. Polaris).
 */
async function computeMatches() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return stellarStore.searchSystems(q)
}

/** Signaux correspondant à la requête (support, fréquence, sourceName) — hors lab. */
function computeSignalMatches() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  const supportLabels = { GRAVITATIONNEL: 'grav gravitationnel gw onde', GAMMA_X: 'gamma x γ', EM_RADIO: 'em radio électromagnétique' }
  return (signauxStore.list || []).filter((s) => {
    if (obsStore.findObservationForSignal(s)) return false
    const freq = (s.frequency || '').toLowerCase()
    const src = (s.sourceName || '').toLowerCase()
    const sup = (supportLabels[s.support] || s.support || '').toLowerCase()
    return freq.includes(q) || src.includes(q) || sup.includes(q)
  })
}

/** Constellations dont le nom (latin, fr ou abbr) contient la requête */
function computeConstellationMatches() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  const lines = stellarStore.constellationLines || []
  const byAbbr = new Map()
  for (const seg of lines) {
    const abbr = seg.constellation_abbr || ''
    if (!byAbbr.has(abbr)) {
      const c = seg.constellations || {}
      byAbbr.set(abbr, {
        type: 'constellation',
        abbr,
        name: c.name_latin || abbr,
        nameFr: c.name_fr || c.name_latin || abbr,
        starIds: new Set(),
      })
    }
    byAbbr.get(abbr).starIds.add(seg.star_from)
    byAbbr.get(abbr).starIds.add(seg.star_to)
  }
  return [...byAbbr.values()].filter((c) => {
    const name = (c.name || '').toLowerCase()
    const nameFr = (c.nameFr || '').toLowerCase()
    const abbr = (c.abbr || '').toLowerCase()
    return name.includes(q) || nameFr.includes(q) || abbr.includes(q)
  })
}

/** Coordonnées x,y,z d'un système (conversion ra/dec + distance si besoin) */
function getSystemXyz(system) {
  const coords = system?.coordinates || {}
  if (coords.x != null || coords.y != null || coords.z != null) {
    return { x: coords.x ?? 0, y: coords.y ?? 0, z: coords.z ?? 0 }
  }
  const ra = ((coords.ra ?? 0) * Math.PI) / 180
  const dec = ((coords.dec ?? 0) * Math.PI) / 180
  const d = parseFloat(system?.distance) || 1
  return {
    x: d * Math.cos(dec) * Math.cos(ra),
    y: d * Math.cos(dec) * Math.sin(ra),
    z: d * Math.sin(dec),
  }
}

function goToConstellation(constellationMatch) {
  ui.clearSearchedStarId()
  const pool = stellarStore.forSky()
  const fullList = stellarStore.list
  const viewerSystem = pool.find((s) => s.id === shipStore.currentSystemId) || fullList.find((s) => s.id === shipStore.currentSystemId)
  const viewerCoords = viewerSystem?.coordinates ?? { x: 0, y: 0, z: 0 }
  const vx = viewerCoords.x ?? 0
  const vy = viewerCoords.y ?? 0
  const vz = viewerCoords.z ?? 0
  let sumX = 0
  let sumY = 0
  let sumZ = 0
  let n = 0
  for (const starId of constellationMatch.starIds) {
    const system = pool.find((s) => s.id === starId) || fullList.find((s) => s.id === starId)
    if (!system) continue
    const xyz = getSystemXyz(system)
    const dx = (xyz.x ?? 0) - vx
    const dy = (xyz.y ?? 0) - vy
    const dz = (xyz.z ?? 0) - vz
    const { ra, dec } = xyzToRaDec(dx, dy, dz)
    const v = raDecToVector(ra, dec)
    sumX += v.x
    sumY += v.y
    sumZ += v.z
    n += 1
  }
  if (n === 0) {
    ui.showNotification('Constellation sans étoiles trouvées dans le catalogue', 3000)
    return
  }
  const len = Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ)
  if (len < 1e-6) {
    ui.showNotification('Impossible de calculer le centre de la constellation', 3000)
    return
  }
  const centerRa = (Math.atan2(sumY, sumX) * 180) / Math.PI
  const centerDec = (Math.asin(Math.max(-1, Math.min(1, sumZ / len))) * 180) / Math.PI
  ui.setTargetViewDirectionValue({ ra: centerRa, dec: centerDec })
  const label = constellationMatch.nameFr || constellationMatch.name || constellationMatch.abbr
  ui.showNotification(`Vue centrée sur ${label}`, 2000)
}

function goToMatch(match) {
  if (match?.type === 'constellation') {
    goToConstellation(match)
    return
  }
  const coords = match.coordinates || {}
  const viewerSystem = stellarStore.list.find((s) => s.id === shipStore.currentSystemId)
  const viewerCoords = viewerSystem?.coordinates ?? { x: 0, y: 0, z: 0 }
  const dx = (coords.x ?? 0) - (viewerCoords.x ?? 0)
  const dy = (coords.y ?? 0) - (viewerCoords.y ?? 0)
  const dz = (coords.z ?? 0) - (viewerCoords.z ?? 0)
  const { ra, dec } = xyzToRaDec(dx, dy, dz)
  const letter = (match.spectral_type || '').toUpperCase()[0]
  const band = letter === 'L' || letter === 'T' || letter === 'Y' ? 'ir' : ui.spectralFilter
  if (letter === 'L' || letter === 'T' || letter === 'Y') {
    ui.setSpectralFilter('ir')
  }
  ui.setSearchedStarId(match.id)
  ui.setTargetViewDirectionValue({ ra, dec })
  const raw = stellarStore.forSky().filter((s) => s.id !== 'SOL')
  const filtered = filterBySpectralBand(raw, band)
  if (!filtered.some((f) => f.star?.id === match.id)) {
    ui.showNotification('Trop loin pour voir cette étoile — vue centrée sur la zone', 4000)
  } else if (ui.exoplanetFilter && !systemObjectsStore.hasExoplanets(match.id)) {
    ui.showNotification('Système sans exoplanètes connues — masqué par le filtre', 3000)
  }
}

async function searchStar() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    searchMatches.value = []
    ui.clearSearchedStarId()
    ui.clearSignalSearchMatchIds()
    return
  }
  const systemMatches = await computeMatches()
  const signalMatches = computeSignalMatches()
  const constellationMatches = computeConstellationMatches()
  ui.setSignalSearchMatchIds(signalMatches.map((s) => s.id))
  const allMatches = [...systemMatches, ...constellationMatches]
  if (allMatches.length === 0 && signalMatches.length === 0) {
    searchMatches.value = []
    ui.clearSearchedStarId()
    ui.showNotification('Aucun système, constellation ni signal trouvé pour « ' + searchQuery.value.trim() + ' »', 3000)
    return
  }
  if (allMatches.length > 0) {
    searchMatches.value = allMatches
    currentMatchIndex.value = 0
    goToMatch(allMatches[0])
  } else {
    searchMatches.value = []
    ui.clearSearchedStarId()
  }
  if (signalMatches.length > 0) {
    ui.showNotification(`${signalMatches.length} signal${signalMatches.length > 1 ? 'ux' : ''} correspondent`, 2000)
  }
}

function prevMatch() {
  if (searchMatches.value.length <= 1) return
  currentMatchIndex.value = (currentMatchIndex.value - 1 + searchMatches.value.length) % searchMatches.value.length
  goToMatch(searchMatches.value[currentMatchIndex.value])
}

function nextMatch() {
  if (searchMatches.value.length <= 1) return
  currentMatchIndex.value = (currentMatchIndex.value + 1) % searchMatches.value.length
  goToMatch(searchMatches.value[currentMatchIndex.value])
}

function clearSearch() {
  searchQuery.value = ''
  searchMatches.value = []
  ui.clearSearchedStarId()
  ui.clearSignalSearchMatchIds()
}

async function toggleExoplanetFilter() {
  if (!ui.exoplanetFilter) {
    await systemObjectsStore.fetchSystemIdsWithExoplanets()
  }
  ui.toggleExoplanetFilter()
}

const hasSearch = computed(() => !!searchQuery.value.trim())
const hasMultipleMatches = computed(() => searchMatches.value.length > 1)
const isSearchMinified = computed(() => !searchExpanded.value && !hasSearch.value)

function expandSearch() {
  if (searchCollapseTimeout) {
    clearTimeout(searchCollapseTimeout)
    searchCollapseTimeout = null
  }
  searchExpanded.value = true
}

function onSearchBodyAfterEnter() {
  if (searchExpanded.value) searchInputRef.value?.focus()
}

function onSearchBlur() {
  searchCollapseTimeout = setTimeout(() => {
    if (!hasSearch.value) searchExpanded.value = false
    searchCollapseTimeout = null
  }, 200)
}

function onSearchFocus() {
  if (searchCollapseTimeout) {
    clearTimeout(searchCollapseTimeout)
    searchCollapseTimeout = null
  }
  searchExpanded.value = true
}

function onClearClick() {
  if (hasSearch.value) {
    clearSearch()
    if (searchCollapseTimeout) {
      clearTimeout(searchCollapseTimeout)
      searchCollapseTimeout = null
    }
    searchInputRef.value?.focus()
  } else {
    searchExpanded.value = false
    searchInputRef.value?.blur()
  }
}
const matchLabel = computed(() => {
  if (searchMatches.value.length <= 1) return ''
  return `${currentMatchIndex.value + 1}/${searchMatches.value.length}`
})

function onGlobalKeydown(e) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    e.preventDefault()
    expandSearch()
    return
  }
  if (e.key === 'Escape') {
    searchInputRef.value?.blur()
    if (searchQuery.value.trim()) clearSearch()
    return
  }
  // Ctrl+← / Ctrl+→ : naviguer entre résultats multiples
  if (searchMatches.value.length > 1 && document.activeElement === searchInputRef.value) {
    if (e.key === 'ArrowLeft' && e.ctrlKey) {
      e.preventDefault()
      prevMatch()
    } else if (e.key === 'ArrowRight' && e.ctrlKey) {
      e.preventDefault()
      nextMatch()
    }
  }
}

watch(searchQuery, (q) => {
  if (!q?.trim()) ui.clearSignalSearchMatchIds()
})

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="spectral-bar">
    <div class="spectral-filters">
      <AppSelect
        :model-value="ui.spectralFilter"
        :options="FILTERS"
        value-key="id"
        label-key="label"
        aria-label="Filtre spectral"
        title="Bande spectrale"
        @update:model-value="ui.setSpectralFilter"
      />
      <button
        type="button"
        class="spectral-filters__btn"
        :class="{ 'spectral-filters__btn--active': ui.exoplanetFilter }"
        title="N'afficher que les systèmes avec exoplanètes connues"
        @click="toggleExoplanetFilter"
      >
        Exoplanètes
      </button>
      <button
        type="button"
        class="spectral-filters__btn"
        :class="{ 'spectral-filters__btn--active': ui.constellationsEnabled }"
        title="Afficher les lignes de constellation"
        @click="ui.toggleConstellationsEnabled"
      >
        Constellations
      </button>
    </div>
    <div class="spectral-search" :class="{ 'spectral-search--minified': isSearchMinified }">
      <Transition name="spectral-search-swap" mode="out-in" @after-enter="onSearchBodyAfterEnter">
        <button
          v-if="isSearchMinified"
          key="trigger"
          type="button"
          class="spectral-search__trigger"
          aria-label="Rechercher un système"
          title="Rechercher (/)"
          @click="expandSearch"
        >
          <span class="spectral-search__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
        </button>
        <div v-else key="body" class="spectral-search__body">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="spectral-search__input"
            placeholder="Système, constellation... (/)"
            @keydown.enter="searchStar"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
          />
          <template v-if="hasMultipleMatches">
            <button
              type="button"
              class="spectral-search__nav"
              aria-label="Résultat précédent"
              title="Résultat précédent"
              @click="prevMatch"
            >
              ‹
            </button>
            <span class="spectral-search__count">{{ matchLabel }}</span>
            <button
              type="button"
              class="spectral-search__nav"
              aria-label="Résultat suivant"
              title="Résultat suivant"
              @click="nextMatch"
            >
              ›
            </button>
          </template>
          <button
            v-if="!hasMultipleMatches"
            type="button"
            class="spectral-search__go"
            title="Centrer sur l'étoile"
            @click="searchStar"
          >
            →
          </button>
          <button
            type="button"
            class="spectral-search__clear"
            :aria-label="hasSearch ? 'Effacer' : 'Fermer la recherche'"
            :title="hasSearch ? 'Effacer' : 'Fermer'"
            @click="onClearClick"
          >
            ×
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.spectral-bar {
  display: flex;
  align-items: stretch;
  gap: var(--space-4);
  pointer-events: auto;
}
.spectral-filters {
  display: flex;
  align-items: stretch;
  gap: var(--space-2);
}
.spectral-filters__btn {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-normal);
  text-transform: uppercase;
  color: var(--color-muted);
  background: transparent;
  border: var(--border-width) solid var(--border-default);
  cursor: pointer;
  transition: all var(--transition-base);
}
.spectral-filters__btn:hover {
  color: var(--color-white);
  border-color: var(--border-bright);
  background: var(--color-cyan-subtle);
}
.spectral-filters__btn--active {
  color: var(--color-cyan);
  border-color: var(--color-cyan-dim);
  background: var(--color-cyan-hover);
}

/* Barre recherche : minifiée (icône) ou étendue + animations */
.spectral-search {
  display: flex;
  align-items: stretch;
  border: var(--border-width) solid var(--border-default);
  min-width: 0;
  overflow: hidden;
  transition: width var(--transition-smooth);
}
.spectral-search--minified {
  width: 40px;
}
.spectral-search:not(.spectral-search--minified) {
  width: 340px;
}
.spectral-search-swap-enter-active,
.spectral-search-swap-leave-active {
  transition: opacity var(--transition-smooth), transform var(--transition-smooth);
}
.spectral-search-swap-leave-from {
  opacity: 1;
  transform: scale(1);
}
.spectral-search-swap-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
.spectral-search-swap-enter-from {
  opacity: 0;
  transform: scale(0.98);
}
.spectral-search-swap-enter-to {
  opacity: 1;
  transform: scale(1);
}
.spectral-search__trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  padding: var(--space-3) var(--space-4);
  color: var(--color-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color var(--transition-base), background-color var(--transition-base);
}
.spectral-search__trigger:hover {
  color: var(--color-cyan);
  background: var(--color-cyan-subtle);
}
.spectral-search__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
.spectral-search__icon svg {
  flex-shrink: 0;
}
.spectral-search__body {
  display: flex;
  align-items: stretch;
  min-width: 0;
  width: 100%;
}
.spectral-search__input {
  flex: 1;
  min-width: 140px;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  color: var(--color-white);
  background: transparent;
  border: none;
  outline: none;
}
.spectral-search__input::placeholder {
  color: var(--color-muted);
}
.spectral-search__clear,
.spectral-search__go,
.spectral-search__nav {
  padding: 0 var(--space-3);
  font-size: var(--text-md);
  color: var(--color-muted);
  background: transparent;
  border: none;
  border-left: var(--border-width) solid var(--border-default);
  cursor: pointer;
  transition: color var(--transition-base);
}
.spectral-search__clear:hover,
.spectral-search__go:hover,
.spectral-search__nav:hover {
  color: var(--color-cyan);
}
.spectral-search__count {
  padding: 0 var(--space-2);
  font-size: var(--text-base);
  font-family: var(--font-mono);
  color: var(--color-muted);
  border-left: var(--border-width) solid var(--border-default);
  display: flex;
  align-items: center;
}
</style>
