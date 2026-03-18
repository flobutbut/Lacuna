/**
 * Composable — Gestion de la sélection d'étoile (recherche + clic)
 * Partagé Observatoire (ui.searchedStarId) et Vue 3D (ref local)
 */

import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'

/**
 * @param {object} [options]
 * @param {'observatoire'|'standalone'} [options.mode='observatoire']
 * @returns {{ selectedStarId: import('vue').ComputedRef<string|null>, selectStar: (star: object|null) => void, clearSelection: () => void }}
 */
export function useStarSelection(options = {}) {
  const { mode = 'observatoire' } = options

  const ui = useUIStore()
  const { searchedStarId } = storeToRefs(ui)
  const localId = ref(null)

  const selectedStarId = computed(() =>
    mode === 'observatoire' ? searchedStarId.value : localId.value
  )

  function selectStar(star) {
    const id = star?.id ?? null
    if (mode === 'observatoire') {
      ui.setSearchedStarId(id)
    } else {
      localId.value = id
    }
  }

  function clearSelection() {
    if (mode === 'observatoire') {
      ui.clearSearchedStarId()
    } else {
      localId.value = null
    }
  }

  return {
    selectedStarId,
    selectStar,
    clearSelection,
  }
}
