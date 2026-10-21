/**
 * Génération de données pour l'Analyseur de spectre énergétique
 * Spectre énergie (keV/MeV) × comptage. Simule GRB, pulsar ou signal atypique.
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md §5
 */
import { seedFromObsId } from './spectrogramData'
import { seededRandom } from './random'

const NB_BINS = 64
const E_MIN_KEV = 10
const E_MAX_KEV = 2000

/**
 * Détecte si la structure est un sursaut (burst/GRB).
 */
function isSursaut(s) {
  return /sursaut|burst/.test((s ?? '').toLowerCase())
}

/**
 * Génère un spectre énergétique (histogramme).
 * @param {Object} opts
 * @param {string} opts.obsId - ID observation (seed)
 * @param {number} opts.fiability - 0-100, influence le bruit
 * @param {boolean} opts.anomalous - Signal atypique : pics inhabituels, distribution non astrophysique
 * @param {string} [opts.structure] - Structure du signal : sursaut → profil GRB (pic + décroissance rapide)
 * @param {number} [opts.durationSec] - Durée observation (optionnel, pour cohérence)
 * @returns {{ bins: Array<{ eCenter: number, eMin: number, eMax: number, count: number }>, eDomain: [number, number] }}
 */
export function generateSpectreEnergetiqueData(opts = {}) {
  const seed = seedFromObsId(opts.obsId ?? '')
  const fiability = Math.max(0, Math.min(100, opts.fiability ?? 80))
  const anomalous = opts.anomalous ?? false
  const sursaut = isSursaut(opts.structure)

  const rng = seededRandom(seed)
  const rng2 = seededRandom(seed + 100)
  const noiseLevel = Math.max(0.02, (1 - fiability / 100) * 0.4)

  const dE = (E_MAX_KEV - E_MIN_KEV) / NB_BINS
  const bins = []

  for (let i = 0; i < NB_BINS; i++) {
    const eMin = E_MIN_KEV + i * dE
    const eMax = eMin + dE
    const eCenter = (eMin + eMax) / 2
    let count

    if (anomalous) {
      const peak1 = 80 + (seed % 5) * 40
      const peak2 = 400 + (seed % 7) * 80
      const peak3 = 1200 + (seed % 3) * 200
      const g = (x, mu, sigma) => Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2))
      count =
        50 * g(eCenter, peak1, 60) +
        35 * g(eCenter, peak2, 100) +
        25 * g(eCenter, peak3, 150) +
        (rng() - 0.5) * 8
    } else if (sursaut) {
      const ePeak = 80 + (seed % 6) * 60
      const sigma = 50 + (seed % 4) * 30
      const g = Math.exp(-((eCenter - ePeak) ** 2) / (2 * sigma ** 2))
      const decay = Math.exp(-eCenter / (200 + (seed % 5) * 50))
      count = 180 * g * (1 + 0.5 * decay) + (rng() - 0.5) * 6
    } else {
      const mode = seed % 3
      if (mode === 0) {
        const alpha = -1.5 - rng() * 0.5
        count = 200 * Math.pow(eCenter / 100, alpha) * (1 + (rng2() - 0.5) * 0.3)
      } else if (mode === 1) {
        const ePeak = 120 + (seed % 4) * 80
        const sigma = 80 + (seed % 3) * 40
        const g = Math.exp(-((eCenter - ePeak) ** 2) / (2 * sigma ** 2))
        count = 80 * g + 20 * Math.exp(-eCenter / 800) + (rng() - 0.5) * 5
      } else {
        const alpha = -2 - rng() * 0.4
        const eBreak = 300 + (seed % 5) * 100
        const factor = eCenter < eBreak ? 1 : Math.pow(eCenter / eBreak, -0.5)
        count = 150 * Math.pow(eCenter / 100, alpha) * factor * (1 + (rng2() - 0.5) * 0.25)
      }
    }

    count += (rng() - 0.5) * noiseLevel * Math.max(10, count)
    count = Math.max(0, Math.round(count))
    bins.push({ eCenter, eMin, eMax, count })
  }

  return {
    bins,
    eDomain: [E_MIN_KEV, E_MAX_KEV],
  }
}
