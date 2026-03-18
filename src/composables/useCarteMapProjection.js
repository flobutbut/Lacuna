/**
 * Projection 2D des systèmes stellaires pour la vue Map (carte projetée).
 * Réutilise getSystemXyz (coordonnées en al) et projette en plan XY avec viewBox pour SVG.
 */
import { computed } from 'vue'
import { getSystemXyz } from '@/lib/stellarCoordinates'

const PADDING_RATIO = 0.12

/**
 * @param {import('vue').ComputedRef<Array<{ systemId: string }>>} nodesRef - Nœuds carte
 * @param {import('vue').ComputedRef<Record<string, object>>} stellarBySystemIdRef - systemId -> stellar (coordinates, distance)
 * @returns {{ positions: import('vue').ComputedRef<Map<string, { x: number, y: number }>>, viewBox: import('vue').ComputedRef<{ minX: number, minY: number, width: number, height: number } | null> }}
 */
export function useCarteMapProjection(nodesRef, stellarBySystemIdRef) {
  const positions = computed(() => {
    const nodes = nodesRef.value ?? []
    const stellarBySystemId = stellarBySystemIdRef.value ?? {}
    const map = new Map()
    for (const node of nodes) {
      const stellar = stellarBySystemId[node.systemId]
      const { x, y } = getSystemXyz(stellar || {})
      map.set(node.systemId, { x, y })
    }
    return map
  })

  const viewBox = computed(() => {
    const posMap = positions.value
    if (posMap.size === 0) return null
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const { x, y } of posMap.values()) {
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
    let w = maxX - minX
    let h = maxY - minY
    if (w < 0.1) w = 0.1
    if (h < 0.1) h = 0.1
    const padX = w * PADDING_RATIO
    const padY = h * PADDING_RATIO
    return {
      minX: minX - padX,
      minY: minY - padY,
      width: w + 2 * padX,
      height: h + 2 * padY,
    }
  })

  return { positions, viewBox }
}
