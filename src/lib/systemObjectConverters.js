/**
 * Convertisseur système — sortie DB (M⊕, R⊕, UA) → unités physiques / paramètres visuels
 * Couche unique entre la base et les représentations (vues, labels, tooltips).
 * @module systemObjectConverters
 */

import { EARTH_RADIUS_KM, EARTH_MASS_KG, AU_KM } from './astroConstants'
import { getRadiusEarth } from './bodyRadius'
import { semiMajorAxisFromPeriod } from './orbitalUtils'
import {
  luminosityFromMass,
  luminosityFromSpectralType,
  habitableZoneLimits,
} from './habitableZone'

/**
 * Convertit un system_object brut en unités physiques (km, kg, UA)
 * Pour labels, tooltips, export.
 * @param {object} obj - system_object brut (données DB)
 * @returns {{ radiusEarth?: number, radiusKm?: number, massKg?: number, distanceAu?: number, periodDays?: number, ringsInnerKm?: number, ringsOuterKm?: number }}
 */
export function toPhysicalUnits(obj) {
  if (!obj) return {}
  const radiusEarth = getRadiusEarth(obj)
  const radiusKm = radiusEarth * EARTH_RADIUS_KM
  const massKg = obj.mass_earth != null ? Number(obj.mass_earth) * EARTH_MASS_KG : null
  const distanceAu =
    obj.orbital_semi_major_axis_au ??
    (obj.orbital_period_days ? semiMajorAxisFromPeriod(obj.orbital_period_days) : null)
  const periodDays = obj.orbital_period_days != null ? Number(obj.orbital_period_days) : null
  const ringsInnerKm =
    obj.has_rings && obj.rings_inner_radius_km != null ? Number(obj.rings_inner_radius_km) : null
  const ringsOuterKm =
    obj.has_rings && obj.rings_outer_radius_km != null ? Number(obj.rings_outer_radius_km) : null

  return { radiusEarth, radiusKm, massKg, distanceAu, periodDays, ringsInnerKm, ringsOuterKm }
}

/**
 * Contexte d'échelle pour le rendu visuel (px)
 * @typedef {object} VisualScaleContext
 * @property {number} scalePxPerAu - px par UA (distances orbitales)
 * @property {number} scalePxPerEarthRadius - px par R⊕ (tailles des corps)
 * @property {number} [minPlanetDiameterPx] - diamètre min d'une planète (référence)
 */

/**
 * Convertit un system_object en paramètres prêts pour le rendu SVG/canvas
 * @param {object} obj - system_object brut
 * @param {VisualScaleContext} ctx - contexte d'échelle de la vue
 * @param {object} [options] - { minDiameterPx, ringColor, ringOpacity }
 * @returns {{ radiusEarth: number, radiusPx: number, diameterPx: number, distancePx: number, distanceAu: number, ringGeometry: object|null, ringAttrs: object|null }}
 */
export function toVisualParams(obj, ctx, options = {}) {
  if (!obj) return {}
  const { minDiameterPx = 4, ringColor, ringOpacity } = options

  const radiusEarth = getRadiusEarth(obj)
  const distanceAu =
    obj.orbital_semi_major_axis_au ??
    (obj.orbital_period_days ? semiMajorAxisFromPeriod(obj.orbital_period_days) : null)

  const scalePxPerR = ctx.scalePxPerEarthRadius ?? 2
  const diameterPx = Math.max(minDiameterPx, radiusEarth * scalePxPerR * 2)
  const radiusPx = diameterPx / 2
  const distancePx =
    distanceAu != null && ctx.scalePxPerAu != null ? distanceAu * ctx.scalePxPerAu : null

  let ringGeometry = null
  let ringAttrs = null
  if (
    obj.has_rings &&
    obj.rings_inner_radius_km != null &&
    obj.rings_outer_radius_km != null &&
    radiusEarth > 0
  ) {
    const innerKm = Number(obj.rings_inner_radius_km)
    const outerKm = Number(obj.rings_outer_radius_km)
    if (innerKm > 0 && outerKm > innerKm) {
      const planetRadiusKm = radiusEarth * EARTH_RADIUS_KM
      const scalePxPerKm = radiusPx / planetRadiusKm
      const innerPx = innerKm * scalePxPerKm
      const outerPx = outerKm * scalePxPerKm
      const thicknessPx = Math.max(1, outerPx - innerPx)
      const centerPx = (innerPx + outerPx) / 2
      ringGeometry = {
        hasRings: true,
        innerPx,
        outerPx,
        centerPx,
        thicknessPx,
      }
      ringAttrs = {
        r: centerPx,
        strokeWidth: thicknessPx,
        fill: 'none',
        stroke: ringColor ?? 'rgba(180, 160, 120, 0.8)',
        opacity: ringOpacity ?? 0.6,
      }
    }
  }

  return {
    radiusEarth,
    radiusPx,
    diameterPx,
    distancePx,
    distanceAu,
    ringGeometry,
    ringAttrs,
  }
}

/**
 * Luminosité et zone habitable pour une étoile / système
 * @param {object} star - system_object type STAR
 * @param {object} [stellarSystem] - stellar_system (spectral_type fallback)
 * @returns {{ luminosity: number, hzInner: number, hzOuter: number }}
 */
export function toLuminosityAndHz(star, stellarSystem) {
  const dbLum = stellarSystem?.luminosity
  const lum =
    dbLum != null && Number.isFinite(Number(dbLum))
      ? Number(dbLum)
      : star?.mass_stellar
        ? luminosityFromMass(star.mass_stellar)
        : luminosityFromSpectralType(
            star?.spectral_type ?? stellarSystem?.spectral_type ?? 'G2V'
          )
  const hz = habitableZoneLimits(lum)
  return { luminosity: lum, hzInner: hz.inner, hzOuter: hz.outer }
}

// Ré-export des helpers utilisés par d'autres modules
export { getRadiusEarth } from './bodyRadius'
export { semiMajorAxisFromPeriod } from './orbitalUtils'
export { habitableZoneLimits, luminosityFromMass, luminosityFromSpectralType } from './habitableZone'
