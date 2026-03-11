<script setup>
import { ref, computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { filterBySpectralBand } from '@/lib/spectralBands'

const ui = useUIStore()
const stellarStore = useStellarSystemsStore()
const searchQuery = ref('')

const FILTERS = [
  { id: 'visible', label: 'Visuel', title: 'Spectre visible (V)' },
  { id: 'ir', label: 'IR', title: 'Infrarouge proche (I) — naines M, objets froids' },
  { id: 'uv', label: 'UV', title: 'Ultraviolet (U) — étoiles chaudes O, B, A' },
  { id: 'r', label: 'R', title: 'Rouge (R) — géantes, intermédiaire' },
]

function searchStar() {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) {
    ui.clearSearchedStarId()
    return
  }
  const systems = stellarStore.list.filter((s) => s.id !== 'SOL')
  const match = systems.find((s) => {
    const name = (s.name ?? s.id ?? '').toLowerCase()
    const id = (s.id ?? '').toLowerCase()
    return name.includes(q) || id.includes(q)
  })
  if (match) {
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
  } else {
    ui.clearSearchedStarId()
  }
}

function clearSearch() {
  searchQuery.value = ''
  ui.clearSearchedStarId()
}

const hasSearch = computed(() => !!searchQuery.value.trim())
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
        v-model="searchQuery"
        type="text"
        class="spectral-search__input"
        placeholder="Rechercher..."
        @keydown.enter="searchStar"
      />
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
  position: absolute;
  top: var(--sidebar-offset);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: stretch;
  gap: var(--space-4);
  z-index: 20;
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
  width: 100px;
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
.spectral-search__go {
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
.spectral-search__go:hover {
  color: var(--color-cyan);
}
</style>
