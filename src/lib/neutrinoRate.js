/**
 * Taux d'événements du détecteur de neutrinos, seconde par seconde (tuile « Neutrinos »,
 * LACUNA_LABORATOIRE_INSTRUMENTS.md §3.4). Ancrage : moniteur de bouffées de supernova en temps réel
 * de Super-Kamiokande, qui suit le taux d'événements au-dessus du bruit de fond.
 *
 * Mêmes chiffres que les signaux captés (migration 00065) : montée de pré-supernova de 200 événements
 * sur 5 min avant T0, bouffée de 5 000 000 événements sur ~10 s à T0 — valeurs provisoires.
 * Les comptages sont tirés de façon déterministe (graine = seconde) : un rechargement montre le même historique.
 */
import { seededRandom } from './random'
import { PRE_SUPERNOVA_LEAD_MS } from './supernova'

/** Bruit de fond du détecteur (événements/s) */
export const NEUTRINO_BACKGROUND_RATE = 0.05
const PRE_EVENTS = 200
const PRE_DURATION_S = PRE_SUPERNOVA_LEAD_MS / 1000
const BURST_EVENTS = 5_000_000
const BURST_DURATION_S = 10
/** Constantes de temps : un quart de la durée, comme l'analyseur de neutrinos */
const PRE_TAU = PRE_DURATION_S / 4
const BURST_TAU = BURST_DURATION_S / 4
const PRE_AMPLITUDE = PRE_EVENTS / (PRE_TAU * (Math.exp(PRE_DURATION_S / PRE_TAU) - 1))

/**
 * Taux attendu (événements/s) à l'instant donné.
 * @param {string|number|null} t0 - Bouffée de la supernova pour cette partie (ISO ou ms) ; null = bruit de fond seul
 * @param {number} tSec - Instant (secondes, horloge murale)
 */
export function expectedNeutrinoRate(t0, tSec) {
  const t0Ms = typeof t0 === 'number' ? t0 : Date.parse(t0)
  if (t0 == null || !Number.isFinite(t0Ms)) return NEUTRINO_BACKGROUND_RATE
  const dt = tSec - t0Ms / 1000
  let rate = NEUTRINO_BACKGROUND_RATE
  if (dt >= -PRE_DURATION_S && dt < 0) rate += PRE_AMPLITUDE * Math.exp((dt + PRE_DURATION_S) / PRE_TAU)
  if (dt >= 0) rate += (BURST_EVENTS / BURST_TAU) * Math.exp(-dt / BURST_TAU)
  return rate
}

/** Tirage de Poisson déterministe ; approximation normale au-delà de 50 */
function poisson(lambda, rng) {
  if (lambda <= 0) return 0
  if (lambda > 50) {
    const u1 = Math.max(rng(), Number.EPSILON)
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * rng())
    return Math.max(0, Math.round(lambda + z * Math.sqrt(lambda)))
  }
  const limit = Math.exp(-lambda)
  let k = 0
  let p = rng()
  while (p > limit) {
    k++
    p *= rng()
  }
  return k
}

/**
 * Événements comptés pendant la seconde [sec, sec + 1).
 * @param {string|number|null} t0
 * @param {number} sec - Seconde entière (horloge murale)
 */
export function neutrinoCount(t0, sec) {
  return poisson(expectedNeutrinoRate(t0, sec + 0.5), seededRandom(sec * 2654435761 >>> 0))
}

/**
 * Comptages des `length` dernières secondes, la plus récente en dernier.
 * @param {string|number|null} t0
 * @param {number} endSec - Dernière seconde comptée
 * @param {number} length
 */
export function neutrinoCountsWindow(t0, endSec, length) {
  const out = new Array(length)
  for (let i = 0; i < length; i++) out[i] = neutrinoCount(t0, endSec - (length - 1 - i))
  return out
}
