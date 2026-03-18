/**
 * Source de vérité — système courant (viewer) + règles d'inclusion/exclusion par contexte.
 * Contexte:
 * - observatoire: le système courant n'est pas affiché/recherchable comme cible (règle UI)
 * - conception3d: le système courant est autorisé (et souvent sélectionné par défaut)
 */

import { computed } from 'vue'
import { useShipStore } from '@/stores/ship'

/**
 * @returns {{
 *  viewerSystemId: import('vue').ComputedRef<string>,
 *  shouldExcludeViewerSystemFromSky: (context: 'observatoire'|'conception3d') => boolean,
 *  shouldExcludeViewerSystemFromSearch: (context: 'observatoire'|'conception3d') => boolean
 * }}
 */
export function useViewerSystemPolicy() {
  const shipStore = useShipStore()
  const viewerSystemId = computed(() => shipStore.currentSystemId ?? 'SOL')

  function shouldExcludeViewerSystemFromSky(context) {
    return context === 'observatoire'
  }

  function shouldExcludeViewerSystemFromSearch(context) {
    return context === 'observatoire'
  }

  return {
    viewerSystemId,
    shouldExcludeViewerSystemFromSky,
    shouldExcludeViewerSystemFromSearch,
  }
}

