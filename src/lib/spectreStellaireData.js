/**
 * Génération de données pour le Spectromètre stellaire
 * Spectre (intensité × longueur d'onde) + courbe de lumière (luminosité × temps)
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md §4.6, §5
 * Classification MK, courbes de lumière Kepler/TESS, étoile de Tabby (KIC 8462852)
 */
import { seedFromObsId } from './spectrogramData'

const WAVELENGTH_MIN = 380
const WAVELENGTH_MAX = 1000
const NB_SPECTRUM_POINTS = 120
const LIGHT_CURVE_POINTS = 80
const LIGHT_CURVE_DAYS = 30

/** Raies d'absorption typiques (nm) — Fraunhofer, Balmer, etc. */
const ABSORPTION_LINES = [
  { wl: 393.4, name: 'Ca K', depth: 0.15 },
  { wl: 396.8, name: 'Ca H', depth: 0.12 },
  { wl: 410.2, name: 'Hδ', depth: 0.08 },
  { wl: 434.0, name: 'Hγ', depth: 0.1 },
  { wl: 486.1, name: 'Hβ', depth: 0.12 },
  { wl: 517.0, name: 'Mg', depth: 0.1 },
  { wl: 589.3, name: 'Na D', depth: 0.18 },
  { wl: 656.3, name: 'Hα', depth: 0.2 },
  { wl: 759.4, name: 'O2 A', depth: 0.08 },
  { wl: 769.9, name: 'K', depth: 0.1 },
]

function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Pic spectral type → centre (nm) du continuum, largeur
 * O/B: pic bleu ~450nm, A: ~480nm, F/G: ~550nm, K: ~600nm, M: ~700nm
 */
function getSpectralPeak(spectralType) {
  if (!spectralType || typeof spectralType !== 'string') return { center: 550, width: 120 }
  const letter = spectralType.toUpperCase()[0]
  const match = spectralType.match(/[OBAGKMF]([0-9.]+)/)
  const sub = match ? Math.min(9, parseFloat(match[1]) || 5) : 5
  const t = sub / 9
  const anchors = {
    O: [420, 440],
    B: [440, 460],
    A: [460, 520],
    F: [520, 560],
    G: [550, 580],
    K: [580, 650],
    M: [650, 750],
    L: [800, 900],
    T: [900, 950],
    Y: [950, 980],
    D: [480, 550],
  }
  const [a, b] = anchors[letter] ?? [550, 600]
  const center = a + (b - a) * t
  const width = letter === 'O' || letter === 'B' ? 80 : letter === 'M' || letter === 'L' ? 150 : 120
  return { center, width }
}

/**
 * Spectre stellaire : intensité × longueur d'onde (380–1000 nm)
 */
export function generateSpectreData(opts = {}) {
  const seed = seedFromObsId(opts.obsId ?? '')
  const rng = seededRandom(seed)
  const fiability = Math.max(0, Math.min(100, opts.fiability ?? 80))
  const anomalous = opts.anomalous ?? false
  const spectralType = opts.spectralType ?? 'G2V'
  const noiseLevel = Math.max(0.01, (1 - fiability / 100) * 0.08)

  const { center, width } = getSpectralPeak(spectralType)
  const points = []

  for (let i = 0; i < NB_SPECTRUM_POINTS; i++) {
    const wl = WAVELENGTH_MIN + (i / (NB_SPECTRUM_POINTS - 1)) * (WAVELENGTH_MAX - WAVELENGTH_MIN)
    let intensity = Math.exp(-((wl - center) ** 2) / (2 * width ** 2))
    intensity = 0.3 + 0.7 * intensity

    for (const line of ABSORPTION_LINES) {
      const dist = Math.abs(wl - line.wl)
      if (dist < 3) {
        const dip = line.depth * Math.exp(-(dist ** 2) / 2)
        intensity -= dip * (0.8 + 0.4 * rng())
      }
    }

    if (anomalous) {
      const emissionWl = 500 + (seed % 7) * 60
      if (Math.abs(wl - emissionWl) < 8) {
        intensity += 0.15 * Math.exp(-((wl - emissionWl) ** 2) / 32)
      }
    }

    intensity += (rng() - 0.5) * noiseLevel
    intensity = Math.max(0.05, Math.min(1, intensity))
    points.push({ wavelength: wl, intensity })
  }

  return { points, domain: [WAVELENGTH_MIN, WAVELENGTH_MAX] }
}

/**
 * Courbe de lumière : flux relatif × temps (jours)
 * Normal: ~1 avec bruit. Anomalous: baisses apériodiques (Tabby) ou transits
 */
export function generateLightCurveData(opts = {}) {
  const seed = seedFromObsId(opts.obsId ?? '')
  const rng = seededRandom(seed)
  const rng2 = seededRandom(seed + 500)
  const fiability = Math.max(0, Math.min(100, opts.fiability ?? 80))
  const anomalous = opts.anomalous ?? false
  const noiseLevel = Math.max(0.005, (1 - fiability / 100) * 0.03)

  const points = []
  let flux = 1

  for (let i = 0; i < LIGHT_CURVE_POINTS; i++) {
    const day = (i / (LIGHT_CURVE_POINTS - 1)) * LIGHT_CURVE_DAYS

    if (anomalous) {
      const dip1 = 5 + (seed % 4)
      const dip2 = 18 + (seed % 5)
      const depth1 = 0.15 + (seed % 10) / 100
      const depth2 = 0.08 + (seed % 5) / 100
      const width = 2
      flux = 1
      flux -= depth1 * Math.exp(-((day - dip1) ** 2) / (2 * width ** 2))
      flux -= depth2 * Math.exp(-((day - dip2) ** 2) / (2 * (width * 1.5) ** 2))
      if (seed % 3 === 0) {
        const transitDay = 12 + (seed % 6)
        flux -= 0.02 * Math.exp(-((day - transitDay) ** 2) / 0.5)
      }
    } else {
      const period = 3 + (seed % 4)
      const amp = 0.008 + rng2() * 0.01
      flux = 1 + amp * Math.sin((day / period) * Math.PI * 2)
    }

    flux += (rng() - 0.5) * noiseLevel
    flux = Math.max(0.5, Math.min(1.05, flux))
    points.push({ day, flux })
  }

  return { points, domain: [0, LIGHT_CURVE_DAYS] }
}
