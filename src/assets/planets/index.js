/**
 * Illustrations SVG par type de composition planétaire — Vue Système Observatoire
 * Mapping composition_type → URL du SVG (TERESTRIAL, GAS_GIANT, ICE_GIANT, ICY)
 * La Terre a son propre fichier (SOL-d / Terre)
 */

import planetEarth from './planet-earth.svg'
import planetTerrestrial from './planet-terrestrial.svg'
import planetGasGiant from './planet-gas-giant.svg'
import planetIceGiant from './planet-ice-giant.svg'
import planetIcy from './planet-icy.svg'

export const PLANET_SVG_PATHS = {
  EARTH: planetEarth,
  TERESTRIAL: planetTerrestrial,
  GAS_GIANT: planetGasGiant,
  ICE_GIANT: planetIceGiant,
  ICY: planetIcy,
}

/** Retourne l'URL du SVG pour un composition_type (ex. TERESTRIAL → planet-terrestrial) */
export function getPlanetSvgPath(compositionType) {
  if (!compositionType || typeof compositionType !== 'string') return planetTerrestrial
  const key = compositionType.toUpperCase()
  return PLANET_SVG_PATHS[key] ?? planetTerrestrial
}

/** Retourne l'URL du SVG pour un system_object — Terre (SOL-d) a son propre asset */
export function getPlanetSvgPathForObject(obj) {
  if (!obj) return planetTerrestrial
  if (obj.system_id === 'SOL' && obj.designation === 'd') return planetEarth
  if (obj.name && /^Terre$/i.test(obj.name.trim())) return planetEarth
  return getPlanetSvgPath(obj.composition)
}
