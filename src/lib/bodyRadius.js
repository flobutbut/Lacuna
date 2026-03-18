/**
 * Rayon des corps célestes (en rayons terrestres) pour échelle visuelle
 * Réf. Chen & Kipping 2017, modèles masse-rayon planétaires
 * @module bodyRadius
 */

import { SUN_RADIUS_EARTH } from './astroConstants'

/**
 * Rayon planétaire estimé depuis mass_earth (M⊕)
 * Formule empirique : terrestres R∝M^0.28, géantes R plafonné ~11 R⊕
 * @param {number} massEarth - Masse en masses terrestres
 * @returns {number} Rayon en rayons terrestres
 */
export function radiusFromMassEarth(massEarth) {
  if (!massEarth || massEarth <= 0) return 0.3
  const m = Number(massEarth)
  if (m < 2) return Math.pow(m, 0.28) // Planètes rocheuses
  if (m < 30) return 1.5 + 1.5 * Math.log10(m) // Géantes de glace
  return 5 + 6 * (1 - 30 / m) // Géantes gazeuses (Jupiter ~11)
}

/**
 * Rayon stellaire depuis mass_stellar (M☉)
 * Séquence principale : R ∝ M^0.8
 * @param {number} massStellar - Masse en masses solaires
 * @returns {number} Rayon en rayons terrestres
 */
export function radiusFromMassStellar(massStellar) {
  if (!massStellar || massStellar <= 0) return 10
  return SUN_RADIUS_EARTH * Math.pow(Number(massStellar), 0.8)
}

/**
 * Rayon d'un system_object pour affichage à l'échelle
 * Utilise radius_earth si dispo, sinon dérive de mass_earth ou mass_stellar
 * @param {object} obj - system_object (STAR, PLANET, MOON, MINOR_BODY)
 * @returns {number} Rayon en rayons terrestres
 */
export function getRadiusEarth(obj) {
  if (!obj) return 0
  if (obj.radius_earth != null && obj.radius_earth > 0) {
    return Number(obj.radius_earth)
  }
  if (obj.type === 'STAR' || obj.type === 'PULSAR') {
    return radiusFromMassStellar(obj.mass_stellar)
  }
  return radiusFromMassEarth(obj.mass_earth ?? 0.5)
}

/**
 * Rayon (R⊕) → diamètre affichage (px) avec échelle log10(1+x) entre min et max.
 * @param {number} radiusEarth - Rayon en rayons terrestres
 * @param {number} minBodyRadius - Borne min R⊕ de l'échelle
 * @param {number} maxBodyRadius - Borne max R⊕ de l'échelle
 * @param {number} minDiameterPx - Diamètre px minimum (ex. 16)
 * @param {number} maxDiameterPx - Diamètre px maximum (ex. 128)
 * @returns {number}
 */
export function radiusToDiameterPx(radiusEarth, minBodyRadius, maxBodyRadius, minDiameterPx, maxDiameterPx) {
  const r = Number(radiusEarth)
  if (!Number.isFinite(r) || r <= 0) return minDiameterPx
  if (maxBodyRadius <= minBodyRadius) return (minDiameterPx + maxDiameterPx) / 2
  const logMin = Math.log10(1 + minBodyRadius)
  const logMax = Math.log10(1 + maxBodyRadius)
  const logRange = Math.max(0.001, logMax - logMin)
  const t = Math.max(0, Math.min(1, (Math.log10(1 + r) - logMin) / logRange))
  const px = Math.round(minDiameterPx + t * (maxDiameterPx - minDiameterPx))
  return Math.max(minDiameterPx, Math.min(maxDiameterPx, px))
}
