<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useObservatoireStore } from '@/stores/observatoire'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useStellarSearch } from '@/composables/useStellarSearch'
import AppSelect from '@/components/AppSelect.vue'
import StarAutocompleteMenu from '@/components/StarAutocompleteMenu.vue'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useViewerSystemPolicy } from '@/composables/useViewerSystemPolicy'
import { STAR_TYPE_FILTER_OPTIONS } from '@/lib/starClassification'
import AppIcon from '@/components/icons/AppIcon.vue'

const props = defineProps({
  /** Mode conception (vue 3D) : utilise v-model, émet focus-star au lieu de centrer la vue 2D */
  standalone: { type: Boolean, default: false },
  /** Filtre spectral (v-model en standalone) */
  spectralFilter: { type: String, default: 'visible' },
  /** Filtre exoplanètes (v-model en standalone) */
  exoplanetFilter: { type: Boolean, default: false },
  /** Filtre par type d'étoile (standalone) : all | O | B | ... | M | PULSAR | D etc. (starClassification) */
  typeFilter: { type: String, default: 'all' },
  /** Options disponibles pour le filtre de type (standalone). Si non fourni, fallback sur STAR_TYPE_FILTER_OPTIONS. */
  typeFilterOptions: { type: Array, default: () => STAR_TYPE_FILTER_OPTIONS },
  /** Lignes constellation (v-model en standalone) */
  constellationsEnabled: { type: Boolean, default: false },
  /** Lignes des transits / visites (v-model en standalone) */
  transitsEnabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:spectralFilter', 'update:exoplanetFilter', 'update:typeFilter', 'update:constellationsEnabled', 'update:transitsEnabled', 'focus-star', 'clear-focus'])

const observatoireStore = useObservatoireStore()
const systemObjectsStore = useSystemObjectsStore()
const stellarStore = useStellarSystemsStore()
const { viewerSystemId, shouldExcludeViewerSystemFromSearch } = useViewerSystemPolicy()
const searchInputRef = ref(null)
const searchExpanded = ref(false)
let searchCollapseTimeout = null

const suggestions = ref([])
const suggestionsOpen = ref(false)
const suggestionsLoading = ref(false)
const activeSuggestionIndex = ref(0)
let suggestTimeout = null

const {
  searchQuery,
  hasSearch,
  searchStar,
  clearSearch,
} = useStellarSearch({
  standalone: props.standalone,
  spectralFilterRef: computed(() => (props.standalone ? props.spectralFilter : observatoireStore.spectralFilter)),
  exoplanetFilterRef: computed(() => (props.standalone ? props.exoplanetFilter : observatoireStore.exoplanetFilter)),
  onFocusStar: (match) => emit('focus-star', match),
  onClearFocus: () => emit('clear-focus'),
  onUpdateSpectralFilter: (band) => {
    if (props.standalone) emit('update:spectralFilter', band)
    else observatoireStore.setSpectralFilter(band)
  },
})

const FILTERS = [
  { id: 'visible', label: 'Visuel', title: 'Spectre visible (V)' },
  { id: 'ir', label: 'IR', title: 'Infrarouge proche (I) — naines M, objets froids' },
  { id: 'uv', label: 'UV', title: 'Ultraviolet (U) — étoiles chaudes O, B, A' },
  { id: 'r', label: 'R', title: 'Rouge (R) — géantes, intermédiaire' },
]

async function toggleExoplanetFilter() {
  const current = props.standalone ? props.exoplanetFilter : observatoireStore.exoplanetFilter
  if (!current) {
    await systemObjectsStore.fetchSystemIdsWithExoplanets()
  }
  if (props.standalone) {
    emit('update:exoplanetFilter', !props.exoplanetFilter)
  } else {
    observatoireStore.toggleExoplanetFilter()
  }
}

function onSpectralFilterChange(v) {
  if (props.standalone) emit('update:spectralFilter', v)
  else observatoireStore.setSpectralFilter(v)
}

function onTypeFilterChange(v) {
  emit('update:typeFilter', v)
}

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

  // Fermer le menu après un court délai pour laisser le clic sur une suggestion passer.
  window.setTimeout(() => {
    suggestionsOpen.value = false
  }, 120)
}

function onSearchFocus() {
  if (searchCollapseTimeout) {
    clearTimeout(searchCollapseTimeout)
    searchCollapseTimeout = null
  }
  searchExpanded.value = true
  if (searchQuery.value.trim().length >= 3) suggestionsOpen.value = true
}

function onClearClick() {
  if (hasSearch.value) {
    clearSearch()
    suggestions.value = []
    suggestionsOpen.value = false
    activeSuggestionIndex.value = 0
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

async function refreshSuggestions() {
  const q = searchQuery.value.trim()
  if (q.length < 3) {
    suggestions.value = []
    suggestionsOpen.value = false
    activeSuggestionIndex.value = 0
    return
  }
  const excludeId = !props.standalone && shouldExcludeViewerSystemFromSearch('observatoire') ? viewerSystemId.value : null
  suggestionsLoading.value = true
  try {
    const data = await stellarStore.searchSystems(q, { excludeSystemId: excludeId })
    suggestions.value = Array.isArray(data) ? data : []
    suggestionsOpen.value = document.activeElement === searchInputRef.value
    activeSuggestionIndex.value = 0
  } finally {
    suggestionsLoading.value = false
  }
}

function scheduleSuggestions() {
  if (suggestTimeout) clearTimeout(suggestTimeout)
  suggestTimeout = setTimeout(() => {
    refreshSuggestions()
  }, 200)
}

function selectSuggestion(item) {
  if (!item) return
  suggestionsOpen.value = false
  suggestions.value = []
  activeSuggestionIndex.value = 0
  // Réutilise la logique existante de focus/centrage via useStellarSearch.
  // goToMatch est exposé par le composable, mais pas destructuré ici : on déclenche une recherche complète.
  searchQuery.value = item.name ?? item.id
  searchStar()
}

function onSearchKeydown(e) {
  if (!suggestionsOpen.value) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const max = Math.max(0, suggestions.value.length - 1)
    activeSuggestionIndex.value = Math.min(max, activeSuggestionIndex.value + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeSuggestionIndex.value = Math.max(0, activeSuggestionIndex.value - 1)
  } else if (e.key === 'Enter') {
    if (suggestions.value.length > 0) {
      e.preventDefault()
      selectSuggestion(suggestions.value[activeSuggestionIndex.value])
    }
  } else if (e.key === 'Escape') {
    suggestionsOpen.value = false
  }
}

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
  // Navigation multi-résultats désactivée temporairement (on garde la logique).
}

watch(searchQuery, (q) => {
  if (!q?.trim() && !props.standalone) observatoireStore.clearSignalSearchMatchIds()
  scheduleSuggestions()
})

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
  if (suggestTimeout) clearTimeout(suggestTimeout)
})
</script>

<template>
  <div class="spectral-bar">
    <div class="spectral-filters">
      <AppSelect
        :model-value="standalone ? spectralFilter : observatoireStore.spectralFilter"
        :options="FILTERS"
        value-key="id"
        label-key="label"
        aria-label="Filtre spectral"
        title="Bande spectrale"
        class="spectral-filters__select"
        @update:model-value="onSpectralFilterChange"
      />
      <AppSelect
        v-if="standalone"
        :model-value="typeFilter"
        :options="typeFilterOptions"
        value-key="id"
        label-key="label"
        aria-label="Type d'étoile"
        title="Filtrer par type d'étoile"
        class="spectral-filters__select spectral-filters__select--type"
        @update:model-value="onTypeFilterChange"
      />
      <button
        type="button"
        class="btn btn-secondary"
        :class="{ 'is-active': standalone ? exoplanetFilter : observatoireStore.exoplanetFilter }"
        title="N'afficher que les systèmes avec exoplanètes connues"
        @click="toggleExoplanetFilter"
      >
        Exoplanètes
      </button>
      <button
        v-if="!standalone"
        type="button"
        class="btn btn-secondary"
        :class="{ 'is-active': observatoireStore.constellationsEnabled }"
        title="Afficher les lignes de constellation"
        @click="observatoireStore.toggleConstellationsEnabled"
      >
        Constellations
      </button>
      <button
        v-if="standalone"
        type="button"
        class="btn btn-secondary"
        :class="{ 'is-active': constellationsEnabled }"
        title="Afficher les lignes de constellation (3D)"
        @click="emit('update:constellationsEnabled', !constellationsEnabled)"
      >
        Constellations
      </button>
      <button
        v-if="standalone"
        type="button"
        class="btn btn-secondary"
        :class="{ 'is-active': transitsEnabled }"
        title="Afficher les trajets (systèmes visités dans l'ordre)"
        @click="emit('update:transitsEnabled', !transitsEnabled)"
      >
        Transits
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
          <span class="spectral-search__icon">
            <AppIcon name="search" :size="14" />
          </span>
        </button>
        <div v-else key="body" class="spectral-search__body">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="spectral-search__input"
            placeholder="Système, constellation, coordonnées… (/)"
            @keydown="onSearchKeydown"
            @keydown.enter="searchStar"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
          />
          <button
            type="button"
            class="spectral-search__go"
            title="Centrer sur l'étoile"
            aria-label="Centrer sur l'étoile"
            @click="searchStar"
          >
            <AppIcon name="arrow-right" />
          </button>
          <button
            type="button"
            class="spectral-search__clear"
            :aria-label="hasSearch ? 'Effacer' : 'Fermer la recherche'"
            :title="hasSearch ? 'Effacer' : 'Fermer'"
            @click="onClearClick"
          >
            <AppIcon name="close" />
          </button>
          <StarAutocompleteMenu
            v-if="suggestionsOpen && searchQuery.trim().length >= 3"
            :items="suggestions"
            :active-index="activeSuggestionIndex"
            :loading="suggestionsLoading"
            empty-label="Aucune étoile"
            @hover="activeSuggestionIndex = $event"
            @select="selectSuggestion"
          />
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
/* Largeur minimale uniquement pour le filtre "Type d'étoile" afin que les libellés longs tiennent sur une seule ligne */
.spectral-filters__select--type {
  min-width: 240px;
}

/* Barre recherche : alignée sur select / boutons (panel, hover glow) */
.spectral-search {
  display: flex;
  align-items: stretch;
  border: var(--border-width) solid var(--border-default);
  background: var(--color-panel);
  min-width: 0;
  overflow: hidden;
  transition: width var(--transition-smooth);
}
.spectral-search:not(.spectral-search--minified) {
  /* Permet au menu autocomplete (absolu) de dépasser sous la barre */
  overflow: visible;
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
  background: var(--color-cyan-glow);
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
  position: relative;
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
  transition: color var(--transition-base), background-color var(--transition-base);
}
.spectral-search__clear:hover,
.spectral-search__go:hover,
.spectral-search__nav:hover {
  color: var(--color-cyan);
  background: var(--color-cyan-glow);
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
