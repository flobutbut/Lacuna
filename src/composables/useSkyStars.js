/**
 * Composable — construction de la liste d'étoiles pour le ciel Observatoire
 * DB (filtrée par bande spectrale) ou fallback procédural
 */

import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { filterBySpectralBand } from '@/lib/spectralBands'

const STAR_COUNT = 1800

function generateStarName() {
  const prefixes = ['HD', 'HIP', 'TYC', 'BD', 'GJ', 'LHS', 'Wolf', 'Ross', 'Lalande', 'Gliese']
  const p = prefixes[Math.floor(Math.random() * prefixes.length)]
  const n = Math.floor(Math.random() * 99999)
  return `${p} ${n}`
}

/** Systèmes Supabase → format étoiles (avec ra,dec pour FOV) */
function projectStarsFromDb(systems) {
  const skySystems = systems.filter((s) => s.id !== 'SOL')
  if (skySystems.length === 0) return null
  return skySystems.map((s, i) => {
    const coords = s.coordinates || {}
    const ra = coords.ra ?? 0
    const dec = coords.dec ?? 0
    const dist = parseFloat(s.distance) || 10
    const isAnomaly = (s.anomaly_level || 0) > 0
    const r = Math.max(0.4, 2 - dist / 30) * (isAnomaly ? 1.5 : 1)
    return {
      id: s.id,
      ra,
      dec,
      r,
      brightness: 0.5 + 0.3 * (1 - dist / 50),
      twinkle: (i * 0.7) % (Math.PI * 2),
      twinkleSpeed: 0.008 + (i % 5) * 0.003,
      isAnomaly,
      anomalyPhase: i * 0.5,
      name: s.name || s.id,
      dist: String(dist.toFixed(1)),
      spectral: s.spectral_type || '?',
      visited: false,
    }
  })
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
    })
  }
  return arr
}

/**
 * @param {import('vue').Ref<string>} spectralFilterRef
 * @returns {import('vue').ComputedRef<Array>}
 */
export function useSkyStars(spectralFilterRef) {
  const stellarSystemsStore = useStellarSystemsStore()

  return function buildStarsFromDb() {
    const band = spectralFilterRef.value
    const raw = stellarSystemsStore.forSky()
    const magLimit = band === 'ir' ? 15 : 12
    const filtered = filterBySpectralBand(raw, band, magLimit)
    const projected = projectStarsFromDb(filtered)
    if (projected && projected.length > 0) return projected
    return initStars()
  }
}
