/**
 * Le signal de 22 minutes (LPT-001, LACUNA_TRACES_IMMUABLES.md §5) — transitoire radio à longue période GPM J1839−10.
 * Phase commune à tous les joueurs : l'impulsion n° k commence à époque + k × période (game_settings.scenario_signal_epoch).
 * Durée, intensité et polarisation de chaque impulsion sont tirées à partir du seul numéro k : tous les joueurs
 * reçoivent les mêmes impulsions. La première capture (migration 00066) fixe le numéro de la première impulsion reçue.
 */
import { seededRandom } from './random'

/** Période (s), sans dérive — Hurley-Walker et al. 2023 */
export const LPT_PERIOD_S = 1318.1957
/** Direction vue de Sol (position MeerKAT, J2000) */
export const LPT_DIRECTION = { ra: 279.758, dec: -10.53 }
/** Durée d'une impulsion (s) : 30 à 300 s */
export const LPT_DURATION_RANGE_S = [30, 300]
/** Intensité relative d'une impulsion : facteur ~100 entre la plus faible et la plus forte */
export const LPT_INTENSITY_RANGE = [1, 100]
/** Polarisation linéaire (%) : 10 à 100 % */
export const LPT_LINEAR_RANGE_PCT = [10, 100]
/** Polarisation circulaire (%), faible — seuil provisoire */
export const LPT_CIRCULAR_MAX_PCT = 5
/** Impulsions retenues au plus sur un signal — provisoire */
export const LPT_MAX_PULSES = 50

/** Graine d'une impulsion (FNV-1a sur « LPT-001:k ») */
function pulseSeed(k) {
  const key = `LPT-001:${k}`
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Normalise la phase stockée dans les attributs du signal.
 * @param {{ epoch?: string, period_s?: number, first_k?: number }|null|undefined} raw
 * @returns {{ epochMs: number, periodS: number, firstK: number }|null}
 */
export function parseLpt(raw) {
  if (!raw) return null
  const epochMs = Date.parse(raw.epoch)
  const periodS = Number(raw.period_s) || LPT_PERIOD_S
  const firstK = Number(raw.first_k)
  if (!Number.isFinite(epochMs) || !Number.isInteger(firstK)) return null
  return { epochMs, periodS, firstK }
}

/**
 * Impulsion n° k : début, durée (s), intensité relative (1–100), polarisation linéaire et circulaire (%).
 * @param {{ epochMs: number, periodS: number }} lpt
 * @param {number} k
 */
export function lptPulse(lpt, k) {
  const rng = seededRandom(pulseSeed(k))
  const [dMin, dMax] = LPT_DURATION_RANGE_S
  const [iMin, iMax] = LPT_INTENSITY_RANGE
  const [lMin, lMax] = LPT_LINEAR_RANGE_PCT
  const durationS = Math.round(dMin + rng() * (dMax - dMin))
  // Log-uniforme : autant d'impulsions entre 1 et 10 qu'entre 10 et 100
  const intensity = Math.round(iMin * Math.pow(iMax / iMin, rng()) * 10) / 10
  const linearPct = Math.round(lMin + rng() * (lMax - lMin))
  const circularPct = Math.round((rng() * 2 - 1) * LPT_CIRCULAR_MAX_PCT * 10) / 10
  return {
    k,
    startMs: lpt.epochMs + k * lpt.periodS * 1000,
    durationS,
    intensity,
    linearPct,
    circularPct,
  }
}

/**
 * Impulsions reçues depuis la première capture jusqu'à untilMs (commencées), LPT_MAX_PULSES au plus.
 * @param {ReturnType<typeof parseLpt>} lpt
 * @param {number} [untilMs]
 */
export function lptPulses(lpt, untilMs = Date.now()) {
  if (!lpt) return []
  const lastK = lptPulseIndex(lpt, untilMs)
  const out = []
  for (let k = lpt.firstK; k <= lastK && out.length < LPT_MAX_PULSES; k++) out.push(lptPulse(lpt, k))
  return out
}

/**
 * Enveloppe de l'impulsion en cours à tMs (0–1, montée puis descente en sin²), et l'impulsion elle-même.
 * Rien avant la première impulsion reçue.
 * @param {ReturnType<typeof parseLpt>} lpt
 * @param {number} tMs
 * @returns {{ pulse: ReturnType<typeof lptPulse>, envelope: number }|null}
 */
export function lptActivePulse(lpt, tMs) {
  if (!lpt) return null
  const k = lptPulseIndex(lpt, tMs)
  if (k < lpt.firstK) return null
  const pulse = lptPulse(lpt, k)
  const u = (tMs - pulse.startMs) / 1000 / pulse.durationS
  if (u < 0 || u >= 1) return null
  return { pulse, envelope: Math.sin(Math.PI * u) ** 2 }
}

/** Numéro de l'impulsion la plus récente commencée à tMs (une marge absorbe l'arrondi de k × période) */
export function lptPulseIndex(lpt, tMs) {
  return Math.floor((tMs - lpt.epochMs) / 1000 / lpt.periodS + 1e-9)
}

/**
 * Période mesurée sur un train d'impulsions : rien avec une seule ; ± période / nombre d'impulsions (provisoire).
 * @param {Array<{ startMs: number }>} pulses
 * @returns {{ periodS: number, uncertaintyS: number }|null}
 */
export function lptMeasuredPeriod(pulses) {
  if (!pulses || pulses.length < 2) return null
  const first = pulses[0]
  const last = pulses[pulses.length - 1]
  const cycles = Math.round((last.startMs - first.startMs) / 1000 / LPT_PERIOD_S)
  if (cycles < 1) return null
  const periodS = (last.startMs - first.startMs) / 1000 / cycles
  return { periodS, uncertaintyS: periodS / pulses.length }
}
