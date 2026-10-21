/**
 * Composable — Gestion de la sélection d'étoile (recherche + clic)
 * Partagé Observatoire (observatoireStore.searchedStarId) et Vue 3D (ref local)
 */

import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useObservatoireStore } from '@/stores/observatoire'

/**
 * @param {object} [options]
 * @param {'observatoire'|'standalone'} [options.mode='observatoire']
 * @returns {{ selectedStarId: import('vue').ComputedRef<string|null>, selectStar: (star: object|null) => void, clearSelection: () => void }}
 */
export function useStarSelection(options = {}) {
  const { mode = 'observatoire' } = options

  const observatoireStore = useObservatoireStore()
  const { searchedStarId } = storeToRefs(observatoireStore)
  const localId = ref(null)

  const selectedStarId = computed(() =>
    mode === 'observatoire' ? searchedStarId.value : localId.value
  )

  function selectStar(star) {
    const id = star?.id ?? null
    if (mode === 'observatoire') {
      observatoireStore.setSearchedStarId(id)
    } else {
      localId.value = id
    }
  }

  function clearSelection() {
    if (mode === 'observatoire') {
      observatoireStore.clearSearchedStarId()
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
