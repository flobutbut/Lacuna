/**
 * Utilitaires pour la représentation visuelle des anneaux planétaires
 * Conversion données DB (km) → paramètres SVG/canvas (px)
 * @module ringUtils
 */

import { EARTH_RADIUS_KM } from './astroConstants'
import { getRadiusEarth } from './bodyRadius'

/**
 * Rayon planétaire en km (centre de la planète)
 * @param {object} body - system_object avec radius_earth
 * @returns {number}
 */
export function getPlanetRadiusKm(body) {
  const rEarth = getRadiusEarth(body)
  return rEarth * EARTH_RADIUS_KM
}

/**
 * Géométrie des anneaux pour rendu SVG/canvas
 * @param {object} body - system_object (has_rings, rings_inner_radius_km, rings_outer_radius_km, radius_earth)
 * @param {number} planetDiameterPx - diamètre du disque planétaire en px (échelle de la vue)
 * @returns {{ hasRings: boolean, innerPx: number, outerPx: number, centerPx: number, thicknessPx: number } | null}
 */
export function getRingGeometry(body, planetDiameterPx) {
  if (!body?.has_rings || !body.rings_inner_radius_km || !body.rings_outer_radius_km) {
    return null
  }
  const innerKm = Number(body.rings_inner_radius_km)
  const outerKm = Number(body.rings_outer_radius_km)
  if (innerKm <= 0 || outerKm <= innerKm) return null

  const planetRadiusKm = getPlanetRadiusKm(body)
  if (planetRadiusKm <= 0) return null

  const planetRadiusPx = planetDiameterPx / 2
  const scalePxPerKm = planetRadiusPx / planetRadiusKm

  const innerPx = innerKm * scalePxPerKm
  const outerPx = outerKm * scalePxPerKm

  return {
    hasRings: true,
    innerPx,
    outerPx,
    centerPx: (innerPx + outerPx) / 2,
    thicknessPx: outerPx - innerPx,
  }
}

/**
 * Attributs SVG pour dessiner un anneau (cercle avec stroke épais)
 * @param {object} geometry - retour de getRingGeometry
 * @param {object} options - { opacity, color, strokeWidth }
 * @returns {{ cx: number, cy: number, r: number, strokeWidth: number, fill: string, stroke: string, opacity: number }}
 */
export function getRingSvgAttrs(geometry, options = {}) {
  if (!geometry) return null
  const { opacity = 0.6, color = 'rgba(200, 180, 140, 0.8)' } = options
  return {
    cx: 0,
    cy: 0,
    r: geometry.centerPx,
    strokeWidth: geometry.thicknessPx,
    fill: 'none',
    stroke: color,
    opacity,
  }
}

/**
 * Path SVG pour un anneau (forme donut) — utile pour des anneaux inclinés (ellipse)
 * @param {object} geometry - retour de getRingGeometry
 * @param {number} inclinationDeg - inclinaison des anneaux (0 = face, 90 = tranche)
 * @returns {string} d attribute pour <path>
 */
export function getRingPathD(geometry, inclinationDeg = 0) {
  if (!geometry) return ''
  const { innerPx, outerPx } = geometry
  const inc = (inclinationDeg ?? 0) * (Math.PI / 180)
  const scaleY = Math.cos(inc)
  const outerX = outerPx
  const outerY = outerPx * scaleY
  const innerX = innerPx
  const innerY = innerPx * scaleY
  const largeArc = 1
  return `M ${outerX} 0 A ${outerX} ${outerY} 0 ${largeArc} 1 ${-outerX} 0 A ${outerX} ${outerY} 0 ${largeArc} 1 ${outerX} 0
          M ${innerX} 0 A ${innerX} ${innerY} 0 ${largeArc} 1 ${-innerX} 0 A ${innerX} ${innerY} 0 ${largeArc} 1 ${innerX} 0`
}

/**
 * Version simplifiée : cercle avec stroke épais (vue de face, pas d'inclinaison)
 * Pour SystemView vue de dessus.
 */
export function getRingCircleAttrs(geometry, options = {}) {
  if (!geometry) return null
  const { opacity = 0.5, color = 'rgba(180, 160, 120, 0.7)' } = options
  return {
    r: geometry.centerPx,
    strokeWidth: geometry.thicknessPx,
    fill: 'none',
    stroke: color,
    opacity,
  }
}

/** Anneaux : facteur × rayon planète (doit être > 1 pour dépasser la planète) */
const RING_FACTOR = 1.5
/** Anneaux : épaisseur minimale (px) pour visibilité */
const RING_STROKE_MIN_PX = 3

/**
 * Dimensions des anneaux pour rendu (rayon, stroke, size) à partir du diamètre planète en px.
 * @param {number} diameterPx - Diamètre du disque planétaire en px
 * @returns {{ radius: number, stroke: number, size: number }}
 */
export function ringSizeForPlanet(diameterPx) {
  const radius = diameterPx / 2
  const ringRadius = Math.max(10, radius * RING_FACTOR)
  const stroke = Math.max(RING_STROKE_MIN_PX, diameterPx * 0.15)
  return { radius: ringRadius, stroke, size: Math.ceil((ringRadius + stroke) * 2) }
}
