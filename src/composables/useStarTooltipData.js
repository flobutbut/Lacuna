/**
 * Composable — Données tooltip pour une étoile (Observatoire, Vue 3D)
 */

import { computed, watch } from 'vue'
import { useSystemObjectsStore } from '@/stores/systemObjects'

/**
 * @param {import('vue').Ref<object|null>} starRef - Étoile projetée { id, name, dist, spectral, isAnomaly, visited, ... }
 * @param {import('vue').Ref<{x:number,y:number}>} [positionRef] - Position du tooltip (défaut: null, à fournir par le parent)
 * @returns {{ tooltipData: import('vue').ComputedRef<object|null>, exoplanetCount: import('vue').ComputedRef<number|null> }}
 */
export function useStarTooltipData(starRef, positionRef = null) {
  const systemObjectsStore = useSystemObjectsStore()

  watch(
    () => starRef.value?.id,
    (id) => {
      if (id) systemObjectsStore.fetchForSystem(id)
    },
    { immediate: true }
  )

  const exoplanetCount = computed(() => {
    const id = starRef.value?.id
    if (!id) return null
    const objects = systemObjectsStore.getForSystem(id)
    const planets = objects.filter((o) => ['PLANET', 'MOON', 'MINOR_BODY'].includes(o.type))
    return planets.length
  })

  const travelLabel = computed(() => {
    const s = starRef.value
    if (!s) return '—'
    const travelSec = (parseFloat(s.dist) * 1000).toFixed(0)
    if (travelSec > 3600) return `${(travelSec / 3600).toFixed(1)}h`
    if (travelSec > 60) return `${Math.floor(travelSec / 60)}m ${travelSec % 60}s`
    return `${travelSec}s`
  })

  const statusText = computed(() => {
    const s = starRef.value
    if (!s) return '—'
    if (s.isAnomaly) return '⚠ ANOMALIE DÉTECTÉE'
    if (s.visited) return '✓ SYSTÈME VISITÉ'
    return '— NON EXPLORÉ'
  })

  const tooltipData = computed(() => {
    const s = starRef.value
    if (!s) return null
    const rows = [
      { key: 'Distance', value: `${s.dist} al` },
      { key: 'Type spectral', value: s.spectral },
      { key: 'Voyage estimé', value: travelLabel.value },
    ]
    const count = exoplanetCount.value
    const systemId = s?.id
    const hasLoaded = systemId && systemObjectsStore.bySystem[systemId]
    if (hasLoaded && count != null) {
      const label = count === 0 ? 'Aucune connue' : count === 1 ? '1 connue' : `${count} connues`
      rows.push({ key: 'Exoplanètes', value: label })
    }
    return {
      visible: true,
      position: positionRef?.value ?? { x: 0, y: 0 },
      title: s.name,
      rows,
      status: statusText.value,
      actionLabel: '[ CLIC POUR OBSERVER ]',
    }
  })

  return {
    tooltipData,
    exoplanetCount,
  }
}
