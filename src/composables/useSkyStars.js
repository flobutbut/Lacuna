/**
 * Composable — construction de la liste d'étoiles pour le ciel Observatoire
 * DB (filtrée par bande spectrale) ou fallback procédural
 * Coordonnées unifiées en x/y/z (référentiel galactique, Sol à l'origine)
 */

import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useMapNodesStore } from '@/stores/mapNodes'
import { getPoolForBandFilters, getStarBandParamsOrZero, luminosityToBaseBrightness, luminosityToRadiusMultiplier } from '@/lib/spectralBands'
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

/** Projette les étoiles filtrées — inclut opacityTarget, brightnessMultiplier, colorOverride.
 * visitedIds : Set des system_id visités (carte) — si fourni, visited reflète map_nodes */
function projectStarsFromDb(filteredEntries, viewerCoords = { x: 0, y: 0, z: 0 }, visitedIds = new Set()) {
  if (!filteredEntries || filteredEntries.length === 0) return null
  return filteredEntries.map((entry, i) => {
    const { star: s, opacity, brightnessMultiplier, colorOverride } = entry
    if (s.id === 'SOL') return null
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

function initStars() {
  const arr = []
  for (let i = 0; i < STAR_COUNT; i++) {
    const ra = Math.random() * 360
    const dec = (Math.random() - 0.5) * 180
    const isBright = Math.random() < 0.04
    const isAnomaly = i < 4
    arr.push({
      id: `proc-${i}`,
      ra,
      dec,
      r: isBright ? Math.random() * 1.8 + 0.8 : Math.random() * 0.9 + 0.2,
      brightness: Math.random() * 0.6 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      isAnomaly,
      anomalyPhase: Math.random() * Math.PI * 2,
      name: generateStarName(),
      dist: (Math.random() * 200 + 2).toFixed(1),
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
 * @returns {{ buildStarsFromDb: (viewerCoords?: object) => Array, updateStarBandParams: (starList: Array, band: string) => void }}
 */
export function useSkyStars(spectralFilterRef, exoplanetFilterRef) {
  const stellarSystemsStore = useStellarSystemsStore()
  const systemObjectsStore = useSystemObjectsStore()
  const mapStore = useMapNodesStore()

  /**
   * @param {object} [viewerCoords]
   * @param {{ skipExoplanetFilter?: boolean }} [options] - skipExoplanetFilter: true pour garder toutes les étoiles (ex. positions des constellations)
   */
  function buildStarsFromDb(viewerCoords = { x: 0, y: 0, z: 0 }, options = {}) {
    const band = spectralFilterRef.value
    const raw = stellarSystemsStore.forSky().filter((s) => s.id !== 'SOL')
    const pool = getPoolForBandFilters(raw)
    let entries = pool.map((star) => ({ star, ...getStarBandParamsOrZero(star, band) }))
    if (exoplanetFilterRef?.value && !options.skipExoplanetFilter) {
      entries = entries.filter((e) => systemObjectsStore.hasExoplanets(e.star.id))
    }
    const visitedIds = mapStore.visitedSystemIds ?? new Set()
    const projected = projectStarsFromDb(entries, viewerCoords, visitedIds)
    if (projected && projected.length > 0) return projected
    return initStars()
  }

  return { buildStarsFromDb, updateStarBandParams }
}
