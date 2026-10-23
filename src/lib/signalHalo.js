/**
 * Halo de signal — LACUNA (LACUNA_UI.md §2)
 * Intensité du halo sur chaque bord de l'écran selon la direction du signal et la direction de vue,
 * et repérage des impulsions des signaux lents (une impulsion = un halo).
 */
import { raDecToVector, viewBasis } from './stellarProjection'
import { angularSeparationDeg, pulsarPhaseOffset } from './radarSpectrum'

/** Période à partir de laquelle chaque impulsion d'un signal rallume le halo (s) */
export const SLOW_PULSE_MIN_PERIOD_S = 60
/** Intensité d'un halo sans direction (émetteur du système, bouffée de neutrinos) */
const UNIFORM_LEVEL = 0.6
/** Écart à l'axe de visée en deçà duquel le halo est uniforme : le signal est déjà devant le joueur (°) */
const CENTERED_DEG = 30

/**
 * Intensité (0–1) du halo sur chaque bord.
 * Plus forte sur le bord tourné vers le signal ; plus forte au total quand la vue se tourne vers lui.
 * @param {{ ra: number, dec: number } | null} signalDir - Direction du signal, null si sans direction
 * @param {{ ra: number, dec: number }} viewDir - Direction de vue de l'Observatoire
 * @returns {{ top: number, right: number, bottom: number, left: number }}
 */
export function haloEdges(signalDir, viewDir) {
  if (!signalDir) {
    return { top: UNIFORM_LEVEL, right: UNIFORM_LEVEL, bottom: UNIFORM_LEVEL, left: UNIFORM_LEVEL }
  }
  const sep = angularSeparationDeg(signalDir.ra, signalDir.dec, viewDir.ra, viewDir.dec)
  const global = 0.35 + 0.65 * (1 - sep / 180)
  const S = raDecToVector(signalDir.ra, signalDir.dec)
  const { R, U } = viewBasis(viewDir.ra, viewDir.dec)
  const sx = S.x * R.x + S.y * R.y + S.z * R.z
  const sy = S.x * U.x + S.y * U.y + S.z * U.z
  const len = Math.hypot(sx, sy)
  // Part orientée : nulle quand le signal est droit devant (ou droit derrière), entière au-delà de CENTERED_DEG
  const directional = len < 1e-6 ? 0 : Math.min(1, sep / CENTERED_DEG)
  const nx = len < 1e-6 ? 0 : sx / len
  const ny = len < 1e-6 ? 0 : sy / len
  const edge = (component) => global * ((1 - directional) * 0.6 + directional * Math.max(0, component))
  return { top: edge(ny), right: edge(nx), bottom: edge(-ny), left: edge(-nx) }
}

/**
 * Numéro de la dernière impulsion émise à l'instant tSec (horloge murale, secondes) :
 * il change quand une impulsion passe. Même calage que le Radar (impulsions en (k − décalage) × période).
 * @param {{ id?: string, pulsePeriodS: number, phaseOffset?: number }} signal
 * @param {number} tSec
 */
export function pulseIndex(signal, tSec) {
  return Math.floor(tSec / signal.pulsePeriodS + pulsarPhaseOffset(signal))
}

/** Signal assez lent pour que chaque impulsion rallume le halo */
export function isSlowPulsed(signal) {
  return signal?.pulsePeriodS >= SLOW_PULSE_MIN_PERIOD_S
}
