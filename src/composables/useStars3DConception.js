/**
 * Composable — Vue 3D des étoiles (conception)
 * Réutilise useSkyStars : mêmes points que l'Observatoire, origine = barycentre
 */

import { computed } from 'vue'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { computeBarycentre } from '@/composables/useSkyStars'
import { useSkyStars } from '@/composables/useSkyStars'
import { resolveStarColor } from '@/lib/spectralBands'

/**
 * @param {import('vue').Ref<string>} spectralFilterRef
 * @param {import('vue').Ref<boolean>} [exoplanetFilterRef]
 * @returns {{ points: import('vue').ComputedRef<Array>, getStarPositionById: (id: string) => { x, y, z } | null }}
 */
export function useStars3DConception(spectralFilterRef, exoplanetFilterRef) {
  const stellarSystemsStore = useStellarSystemsStore()
  const { buildStarsFromDb } = useSkyStars(spectralFilterRef, exoplanetFilterRef)

  const barycentre = computed(() => {
    const raw = stellarSystemsStore.forSky().filter((s) => s.id !== 'SOL')
    return computeBarycentre(raw)
  })

  const points = computed(() => {
    const bc = barycentre.value
    const starList = buildStarsFromDb(bc) ?? []
    return starList
      .filter((p) => p.dx != null && p.dy != null && p.dz != null)
      .map((p) => {
        const star = p.star || {}
        const { r, g, b } = resolveStarColor(star, p.colorOverride ?? null)
        return {
          id: p.id,
          x: p.dx,
          y: p.dy,
          z: p.dz,
          r: r / 255,
          g: g / 255,
          b: b / 255,
          size: Math.max(0.5, (p.r ?? 1) * 0.4),
          name: p.name || p.id,
          spectral: p.spectral || '?',
          star,
        }
      })
  })

  function getStarPositionById(id) {
    const starList = buildStarsFromDb(barycentre.value) ?? []
    const p = starList.find((s) => s.id === id)
    if (!p || p.dx == null) return null
    return { x: p.dx, y: p.dy, z: p.dz }
  }

  return {
    points,
    barycentre,
    getStarPositionById,
  }
}
