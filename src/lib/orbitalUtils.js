/**
 * Utilitaires orbitaux — Kepler 3 pour distance depuis période
 * a³ ∝ T² → a (AU) = (T/365.25)^(2/3) pour T en jours
 */

export function semiMajorAxisFromPeriod(days) {
  const T = parseFloat(days)
  if (!T || T <= 0) return null
  return Math.pow(T / 365.25, 2 / 3)
}
