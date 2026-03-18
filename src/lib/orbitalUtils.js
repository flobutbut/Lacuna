/**
 * Utilitaires orbitaux — Kepler 3 pour distance depuis période
 * a³ ∝ T² → a (AU) = (T/T_earth)^(2/3) pour T en jours
 */

import { EARTH_ORBITAL_PERIOD_DAYS } from './astroConstants'

export function semiMajorAxisFromPeriod(days) {
  const T = parseFloat(days)
  if (!T || T <= 0) return null
  return Math.pow(T / EARTH_ORBITAL_PERIOD_DAYS, 2 / 3)
}

/**
 * Distance (UA) → position px sur une piste logarithmique.
 * @param {number|null|undefined} distanceAu - Distance en UA
 * @param {number} orbitStartPx - Offset px de départ (bord disque étoile)
 * @param {number} minDistanceAu - Borne min UA (pour log)
 * @param {number} maxDistanceAu - Borne max UA (pour log)
 * @param {number} trackWidthPx - Largeur de la piste en px
 * @returns {number} Position px depuis l'origine
 */
const MIN_DISTANCE_AU = 0.001

export function distanceAuToPx(distanceAu, orbitStartPx, minDistanceAu, maxDistanceAu, trackWidthPx) {
  if (distanceAu == null || distanceAu < 0) return orbitStartPx
  const d = Math.max(distanceAu, MIN_DISTANCE_AU)
  if (maxDistanceAu <= minDistanceAu) return orbitStartPx
  const logMin = Math.log10(1 + minDistanceAu)
  const logMax = Math.log10(1 + maxDistanceAu)
  const logRange = Math.max(0.001, logMax - logMin)
  const t = Math.max(0, Math.min(1, (Math.log10(1 + d) - logMin) / logRange))
  return orbitStartPx + t * trackWidthPx
}
