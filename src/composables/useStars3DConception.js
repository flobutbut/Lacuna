/**
 * Composable — Vue 3D des étoiles (conception)
 * Réutilise useSkyStars : mêmes points que l'Observatoire, origine = barycentre
 */

import { computed } from 'vue'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useShipStore } from '@/stores/ship'
import { computeBarycentre } from '@/composables/useSkyStars'
import { useSkyStars } from '@/composables/useSkyStars'
import { resolveStarColor } from '@/lib/spectralBands'

/**
 * @param {import('vue').Ref<string>} spectralFilterRef
 * @param {import('vue').Ref<boolean>} [exoplanetFilterRef]
 * @param {import('vue').Ref<string>} [typeFilterRef] - Filtre type d'étoile : all | O | B | ... | M | PULSAR | D (starClassification)
 * @returns {{ points: import('vue').ComputedRef<Array>, getStarPositionById: (id: string) => { x, y, z } | null }}
 */
export function useStars3DConception(spectralFilterRef, exoplanetFilterRef, typeFilterRef) {
  const stellarSystemsStore = useStellarSystemsStore()
  const shipStore = useShipStore()
  const { buildStarsFromDb } = useSkyStars(spectralFilterRef, exoplanetFilterRef, {
    includeViewerSystem: true,
    useConceptionSource: true,
    typeFilterRef,
  })

  const barycentre = computed(() => {
    const viewerId = shipStore.currentSystemId ?? 'SOL'
    const conception = stellarSystemsStore.conceptionForSky ?? []
    const raw =
      conception.length > 0
        ? conception.filter((s) => s.id !== viewerId)
        : stellarSystemsStore.forSky(true, { excludeSystemId: viewerId })
    return computeBarycentre(raw)
  })

  const points = computed(() => {
    // Dépendances réactives : catalogue, filtre type, filtre exo, bande — pour que la vue 3D se mette à jour
    const _conceptionCount = (stellarSystemsStore.conceptionForSky ?? []).length
    const _typeFilter = typeFilterRef?.value ?? 'all'
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

  /** Map id → {x,y,z} pour segments constellation (inclut étoiles masquées si filtre exoplanètes actif) */
  const constellationPositionsById = computed(() => {
    const bc = barycentre.value
    const opts = exoplanetFilterRef?.value ? { skipExoplanetFilter: true } : {}
    const list = buildStarsFromDb(bc, opts) ?? []
    const map = new Map()
    for (const p of list) {
      if (p.dx != null && p.dy != null && p.dz != null) {
        map.set(p.id, { x: p.dx, y: p.dy, z: p.dz })
      }
    }
    return map
  })

  return {
    points,
    barycentre,
    getStarPositionById,
    constellationPositionsById,
  }
}
