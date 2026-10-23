/**
 * Génération de données pour l'Analyseur de neutrinos (LACUNA_LABORATOIRE_INSTRUMENTS.md §4.14)
 * Chronologie des événements, spectre en énergie (MeV) et cône de direction.
 * Déterministe via seed (obsId). Les mesures du signal (attributes) priment sur les valeurs par défaut.
 *
 * Valeurs par défaut calées sur SN 1987A (Kamiokande II) : ~12 s, énergies de ~6 à ~35 MeV, moyenne ~15 MeV.
 */
import { seedFromObsId } from './spectrogramData'
import { seededRandom } from './random'

const DEFAULT_EVENTS = 24
const DEFAULT_DURATION_S = 12
const DEFAULT_MEAN_MEV = 15
const DEFAULT_UNCERTAINTY_DEG = 5
/** Au-delà, on tire un échantillon et on remet les comptages à l'échelle */
const MAX_SAMPLED_EVENTS = 5000
const TIME_BINS = 30
const ENERGY_BINS = 24
const E_MAX_MEV = 60

/** Tirage d'une loi gamma de forme 3 (somme de trois exponentielles) : spectre quasi thermique */
function gamma3(rng, mean) {
  const scale = mean / 3
  let sum = 0
  for (let i = 0; i < 3; i++) sum += -Math.log(1 - rng())
  return sum * scale
}

/**
 * @param {Object} opts
 * @param {string} opts.obsId - ID observation (seed)
 * @param {number} [opts.fiability] - 0–100 : bruit de fond et incertitude de direction
 * @param {Object} [opts.attributes] - Mesures du signal : event_count, duration_s, mean_energy_mev, direction {ra, dec}, uncertainty_deg,
 *   profile ('burst' : montée immédiate puis décroissance ; 'rising' : taux qui monte lentement, pré-supernova)
 * @returns {{
 *   total: number, background: number, durationS: number, meanEnergyMeV: number,
 *   timeBins: Array<{ t0: number, t1: number, count: number }>,
 *   energyBins: Array<{ e0: number, e1: number, count: number }>,
 *   direction: { ra: number, dec: number } | null, uncertaintyDeg: number
 * }}
 */
export function generateNeutrinoData(opts = {}) {
  const att = opts.attributes ?? {}
  const fiability = Math.max(0, Math.min(100, opts.fiability ?? 80))
  const total = Math.max(1, Math.round(Number(att.event_count) || DEFAULT_EVENTS))
  const durationS = Number(att.duration_s) || DEFAULT_DURATION_S
  const meanEnergyMeV = Number(att.mean_energy_mev) || DEFAULT_MEAN_MEV
  const rng = seededRandom(seedFromObsId(opts.obsId ?? ''))

  // Bouffée : montée immédiate puis décroissance exponentielle (constante ≈ quart de la durée).
  // Pré-supernova : taux qui croît exponentiellement jusqu'à la fin de la fenêtre.
  const rising = att.profile === 'rising'
  const tau = durationS / 4
  const windowS = rising ? durationS : durationS * 1.5
  const sampleTime = rising
    ? (r) => tau * Math.log(1 + r * (Math.exp(windowS / tau) - 1))
    : (r) => -tau * Math.log(1 - r * (1 - Math.exp(-windowS / tau)))
  const sampled = Math.min(total, MAX_SAMPLED_EVENTS)
  const weight = total / sampled
  const timeCounts = new Array(TIME_BINS).fill(0)
  const energyCounts = new Array(ENERGY_BINS).fill(0)
  for (let i = 0; i < sampled; i++) {
    const t = Math.min(windowS - 1e-9, sampleTime(rng()))
    timeCounts[Math.floor((t / windowS) * TIME_BINS)] += weight
    const e = gamma3(rng, meanEnergyMeV)
    if (e < E_MAX_MEV) energyCounts[Math.floor((e / E_MAX_MEV) * ENERGY_BINS)] += weight
  }

  // Bruit de fond : uniforme dans le temps, à basse énergie ; plus présent quand la fiabilité baisse
  const background = Math.round(total * 0.2 * (1 - fiability / 100))
  for (let i = 0; i < Math.min(background, MAX_SAMPLED_EVENTS); i++) {
    const w = background / Math.min(background, MAX_SAMPLED_EVENTS)
    timeCounts[Math.floor(rng() * TIME_BINS)] += w
    energyCounts[Math.floor(((3 + rng() * 5) / E_MAX_MEV) * ENERGY_BINS)] += w
  }

  const timeBins = timeCounts.map((count, i) => ({
    t0: (i / TIME_BINS) * windowS,
    t1: ((i + 1) / TIME_BINS) * windowS,
    count: Math.round(count),
  }))
  const energyBins = energyCounts.map((count, i) => ({
    e0: (i / ENERGY_BINS) * E_MAX_MEV,
    e1: ((i + 1) / ENERGY_BINS) * E_MAX_MEV,
    count: Math.round(count),
  }))

  const baseUncertainty = Number(att.uncertainty_deg) || DEFAULT_UNCERTAINTY_DEG
  const uncertaintyDeg = baseUncertainty * (1 + (1 - fiability / 100))
  const dir = att.direction
  const direction = dir && Number.isFinite(Number(dir.ra)) && Number.isFinite(Number(dir.dec))
    ? { ra: Number(dir.ra), dec: Number(dir.dec) }
    : null

  return { total, background, durationS, meanEnergyMeV, timeBins, energyBins, direction, uncertaintyDeg }
}
