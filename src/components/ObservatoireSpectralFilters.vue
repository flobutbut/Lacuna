<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'
import { filterBySpectralBand } from '@/lib/spectralBands'

const ui = useUIStore()
const stellarStore = useStellarSystemsStore()
const signauxStore = useSignauxStore()
const obsStore = useObservationsStore()
const searchQuery = ref('')
const searchInputRef = ref(null)
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

/** Score de priorité : exact=3, préfixe=2, substring=1. Tri décroissant puis par nom. */
function matchScore(s, q) {
  const name = (s.name ?? s.id ?? '').toLowerCase()
  const id = (s.id ?? '').toLowerCase()
  const spectral = (s.spectral_type ?? '').toLowerCase()
  const dist = String(s.distance ?? '')
  const matches = name.includes(q) || id.includes(q) || spectral.includes(q) || dist.includes(q)
  if (!matches) return 0
  if (name === q || id === q) return 3
  if (name.startsWith(q) || id.startsWith(q) || spectral.startsWith(q)) return 2
  return 1
}

function computeMatches() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  const systems = stellarStore.list.filter((s) => s.id !== 'SOL')
  return systems
    .filter((s) => matchScore(s, q) > 0)
    .sort((a, b) => {
      const sa = matchScore(a, q)
      const sb = matchScore(b, q)
      if (sb !== sa) return sb - sa
      return (a.name ?? a.id).localeCompare(b.name ?? b.id)
    })
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

function goToMatch(match) {
  const coords = match.coordinates || {}
  const ra = coords.ra ?? 0
  const dec = coords.dec ?? 0
  const letter = (match.spectral_type || '').toUpperCase()[0]
  const band = letter === 'L' || letter === 'T' || letter === 'Y' ? 'ir' : ui.spectralFilter
  if (letter === 'L' || letter === 'T' || letter === 'Y') {
    ui.setSpectralFilter('ir')
  }
  ui.setSearchedStarId(match.id)
  ui.setTargetViewDirectionValue({ ra, dec })
  const raw = stellarStore.forSky()
  const magLimit = band === 'ir' ? 15 : 12
  const filtered = filterBySpectralBand(raw, band, magLimit)
  if (!filtered.some((s) => s.id === match.id)) {
    ui.showNotification('Trop loin pour voir cette étoile — vue centrée sur la zone', 4000)
  }
}

function searchStar() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    searchMatches.value = []
    ui.clearSearchedStarId()
    ui.clearSignalSearchMatchIds()
    return
  }
  const systemMatches = computeMatches()
  const signalMatches = computeSignalMatches()
  ui.setSignalSearchMatchIds(signalMatches.map((s) => s.id))
  if (systemMatches.length === 0 && signalMatches.length === 0) {
    searchMatches.value = []
    ui.clearSearchedStarId()
    ui.showNotification('Aucun système ni signal trouvé pour « ' + searchQuery.value.trim() + ' »', 3000)
    return
  }
  if (systemMatches.length > 0) {
    searchMatches.value = systemMatches
    currentMatchIndex.value = 0
    goToMatch(systemMatches[0])
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

const hasSearch = computed(() => !!searchQuery.value.trim())
const hasMultipleMatches = computed(() => searchMatches.value.length > 1)
const matchLabel = computed(() => {
  if (searchMatches.value.length <= 1) return ''
  return `${currentMatchIndex.value + 1}/${searchMatches.value.length}`
})

function onGlobalKeydown(e) {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    e.preventDefault()
    searchInputRef.value?.focus()
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
      <button
      v-for="f in FILTERS"
      :key="f.id"
      type="button"
      class="spectral-filters__btn"
      :class="{ 'spectral-filters__btn--active': ui.spectralFilter === f.id }"
      :title="f.title"
      @click="ui.setSpectralFilter(f.id)"
    >
        {{ f.label }}
      </button>
    </div>
    <div class="spectral-search">
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        type="text"
        class="spectral-search__input"
        placeholder="Nom, ID, spectral... (/)"
        @keydown.enter="searchStar"
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
        v-if="hasSearch"
        type="button"
        class="spectral-search__clear"
        aria-label="Effacer"
        @click="clearSearch"
      >
        ×
      </button>
      <button
        v-if="!hasMultipleMatches"
        type="button"
        class="spectral-search__go"
        title="Centrer sur l'étoile"
        @click="searchStar"
      >
        →
      </button>
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
  font-size: var(--text-base);
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

/* Barre recherche minifiée */
.spectral-search {
  display: flex;
  align-items: stretch;
  border: var(--border-width) solid var(--border-default);
}
.spectral-search__input {
  min-width: 140px;
  width: 180px;
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
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-muted);
  border-left: var(--border-width) solid var(--border-default);
  display: flex;
  align-items: center;
}
</style>
