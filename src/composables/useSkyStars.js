/**
 * Composable — construction de la liste d'étoiles pour le ciel Observatoire
 * DB (filtrée par bande spectrale) ou fallback procédural
 * Coordonnées unifiées en x/y/z (référentiel galactique, Sol à l'origine)
 */

import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useMapNodesStore } from '@/stores/mapNodes'
import { useShipStore } from '@/stores/ship'
import { getPoolForBandFilters, getStarBandParamsOrZero, luminosityToBaseBrightness, luminosityToRadiusMultiplier } from '@/lib/spectralBands'
import { matchesStarTypeFilter } from '@/lib/starClassification'
import { xyzToRaDec } from '@/lib/stellarProjection'

const STAR_COUNT = 1800

/** Met à jour opacityTarget, brightnessMultiplier, colorOverride (sans recalcul géométrique) */
export function updateStarBandParams(starList, band) {
  if (!starList || !Array.isArray(starList)) return
  starList.forEach((proj) => {
    const s = proj.star
    if (!s) return
    const params = getStarBandParamsOrZero(s, band)
    proj.opacityTarget = params.opacity
    proj.brightnessMultiplier = params.brightnessMultiplier
    proj.colorOverride = params.colorOverride
  })
}

function generateStarName() {
  const prefixes = ['HD', 'HIP', 'TYC', 'BD', 'GJ', 'LHS', 'Wolf', 'Ross', 'Lalande', 'Gliese']
  const p = prefixes[Math.floor(Math.random() * prefixes.length)]
  const n = Math.floor(Math.random() * 99999)
  return `${p} ${n}`
}

/**
 * Calcule le barycentre des étoiles (moyenne des positions x,y,z).
 * Utilisé par la vue 3D conception comme origine.
 */
export function computeBarycentre(stars) {
  let sx = 0, sy = 0, sz = 0, n = 0
  for (const s of stars) {
    if (s.id === 'SOL') continue
    let coords = s.coordinates || {}
    if (coords.x == null && coords.ra != null) {
      const ra = (coords.ra ?? 0) * (Math.PI / 180)
      const dec = (coords.dec ?? 0) * (Math.PI / 180)
      const d = parseFloat(s.distance) || 1
      coords = { x: d * Math.cos(dec) * Math.cos(ra), y: d * Math.cos(dec) * Math.sin(ra), z: d * Math.sin(dec) }
    }
    if (coords.x == null) continue
    sx += coords.x ?? 0
    sy += coords.y ?? 0
    sz += coords.z ?? 0
    n++
  }
  return n === 0 ? { x: 0, y: 0, z: 0 } : { x: sx / n, y: sy / n, z: sz / n }
}

/** Projette les étoiles filtrées — inclut opacityTarget, brightnessMultiplier, colorOverride, dx/dy/dz (3D).
 * visitedIds : Set des system_id visités (carte) — si fourni, visited reflète map_nodes
 * options.excludeSystemId : si défini, exclut ce système (règle Observatoire)
 * options.includeViewerSystem : si true, n'applique pas l'exclusion (Vue 3D conception) */
function projectStarsFromDb(filteredEntries, viewerCoords = { x: 0, y: 0, z: 0 }, visitedIds = new Set(), options = {}) {
  const { excludeSystemId = null, includeViewerSystem = false } = options
  if (!filteredEntries || filteredEntries.length === 0) return null
  return filteredEntries.map((entry, i) => {
    const { star: s, opacity, brightnessMultiplier, colorOverride } = entry
    if (!includeViewerSystem && excludeSystemId && s.id === excludeSystemId) return null
    let coords = s.coordinates || {}
    if (coords.x == null && coords.ra != null) {
      const ra = (coords.ra ?? 0) * (Math.PI / 180)
      const dec = (coords.dec ?? 0) * (Math.PI / 180)
      const d = parseFloat(s.distance) || 1
      coords = {
        x: d * Math.cos(dec) * Math.cos(ra),
        y: d * Math.cos(dec) * Math.sin(ra),
        z: d * Math.sin(dec),
      }
    }
    const dx = (coords.x ?? 0) - (viewerCoords.x ?? 0)
    const dy = (coords.y ?? 0) - (viewerCoords.y ?? 0)
    const dz = (coords.z ?? 0) - (viewerCoords.z ?? 0)
    const { ra, dec, dist } = xyzToRaDec(dx, dy, dz)
    const distNum = dist > 0 ? dist : parseFloat(s.distance) || 10
    const isAnomaly = (s.anomaly_level || 0) > 0
    const rBase = Math.max(1.2, 3.4 - distNum / 25)
    const rLum = luminosityToRadiusMultiplier(s.luminosity, s.spectral_type)
    const r = rBase * rLum * (isAnomaly ? 1.5 : 1)
    const baseBrightness = luminosityToBaseBrightness(s.luminosity, s.spectral_type)
    return {
      id: s.id,
      ra,
      dec,
      dx,
      dy,
      dz,
      r,
      brightness: baseBrightness,
      twinkle: (i * 0.7) % (Math.PI * 2),
      twinkleSpeed: 0.008 + (i % 5) * 0.003,
      isAnomaly,
      anomalyPhase: i * 0.5,
      name: s.name || s.id,
      dist: String(distNum.toFixed(1)),
      spectral: s.spectral_type || '?',
      visited: visitedIds.has(s.id),
      star: s,
      opacityTarget: opacity,
      opacityCurrent: 0,
      brightnessMultiplier,
      colorOverride,
    }
  }).filter(Boolean)
}

function initStars(viewerCoords = { x: 0, y: 0, z: 0 }) {
  const arr = []
  const vx = viewerCoords.x ?? 0
  const vy = viewerCoords.y ?? 0
  const vz = viewerCoords.z ?? 0
  for (let i = 0; i < STAR_COUNT; i++) {
    const ra = Math.random() * 360
    const dec = (Math.random() - 0.5) * 180
    const dist = Math.random() * 200 + 2
    const rad = Math.PI / 180
    const dx = dist * Math.cos(dec * rad) * Math.cos(ra * rad) - vx
    const dy = dist * Math.cos(dec * rad) * Math.sin(ra * rad) - vy
    const dz = dist * Math.sin(dec * rad) - vz
    const isBright = Math.random() < 0.04
    const isAnomaly = i < 4
    arr.push({
      id: `proc-${i}`,
      ra,
      dec,
      dx,
      dy,
      dz,
      r: isBright ? Math.random() * 1.8 + 0.8 : Math.random() * 0.9 + 0.2,
      brightness: Math.random() * 0.6 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      isAnomaly,
      anomalyPhase: Math.random() * Math.PI * 2,
      name: generateStarName(),
      dist: dist.toFixed(1),
      spectral: ['G2V', 'K5V', 'M3V', 'F8V', 'A5V', 'M0V', 'G8V'][Math.floor(Math.random() * 7)],
      visited: i < 3,
      opacityTarget: 1,
      opacityCurrent: 0,
    })
  }
  return arr
}

/**
 * @param {import('vue').Ref<string>} spectralFilterRef
 * @param {import('vue').Ref<boolean>} [exoplanetFilterRef] - Filtre exoplanètes (systèmes avec planètes connues)
 * @param {{ includeViewerSystem?: boolean, useConceptionSource?: boolean }} [opts] - includeViewerSystem: true pour Vue 3D ; useConceptionSource: true pour utiliser conceptionForSky (catalogue complet) si disponible
 * @returns {{ buildStarsFromDb: (viewerCoords?: object) => Array, updateStarBandParams: (starList: Array, band: string) => void }}
 */
export function useSkyStars(spectralFilterRef, exoplanetFilterRef, opts = {}) {
  const { includeViewerSystem = false, useConceptionSource = false, typeFilterRef = null } = opts
  const stellarSystemsStore = useStellarSystemsStore()
  const systemObjectsStore = useSystemObjectsStore()
  const mapStore = useMapNodesStore()
  const shipStore = useShipStore()

  /**
   * @param {object} [viewerCoords]
   * @param {{ skipExoplanetFilter?: boolean }} [options] - skipExoplanetFilter: true pour garder toutes les étoiles (ex. positions des constellations)
   */
  function buildStarsFromDb(viewerCoords = { x: 0, y: 0, z: 0 }, options = {}) {
    const band = spectralFilterRef.value
    const conception = stellarSystemsStore.conceptionForSky ?? []
    const useConception = useConceptionSource && Array.isArray(conception) && conception.length > 0

    let raw
    const viewerSystemId = shipStore.currentSystemId ?? 'SOL'

    if (useConception) {
      raw = [...conception]
      if (includeViewerSystem && !raw.some((s) => s.id === viewerSystemId)) {
        const viewer = stellarSystemsStore.list.find((s) => s.id === viewerSystemId)
        if (viewer) raw = [viewer, ...raw]
      }
    } else {
      const excludeId = includeViewerSystem ? null : viewerSystemId
      raw = excludeId ? stellarSystemsStore.forSky(true, { excludeSystemId: excludeId }) : stellarSystemsStore.forSky(false)
      if (!excludeId && includeViewerSystem && !raw.some((s) => s.id === viewerSystemId)) {
        const viewer = stellarSystemsStore.list.find((s) => s.id === viewerSystemId)
        if (viewer) raw = [viewer, ...raw]
      }
    }
    if (typeFilterRef?.value && typeFilterRef.value !== 'all') {
      raw = raw.filter((s) => matchesStarTypeFilter(s, typeFilterRef.value))
    }
    // Vue conception : ne pas filtrer par magnitude (catalogue complet). Observatoire : limiter à mag ≤ 15.
    const pool = useConception ? raw : getPoolForBandFilters(raw)
    let entries = pool.map((star) => ({ star, ...getStarBandParamsOrZero(star, band) }))
    if (exoplanetFilterRef?.value && !options.skipExoplanetFilter) {
      entries = entries.filter((e) => systemObjectsStore.hasExoplanets(e.star.id))
    }
    const visitedIds = mapStore.visitedSystemIds ?? new Set()
    const projected = projectStarsFromDb(entries, viewerCoords, visitedIds, { excludeSystemId: viewerSystemId, includeViewerSystem })
    if (projected && projected.length > 0) return projected
    return initStars(viewerCoords)
  }

  return { buildStarsFromDb, updateStarBandParams }
}
