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
