/**
 * Utilitaires coordonnées stellaires
 * Parse, conversion ra/dec ↔ xyz
 */

/**
 * Parse une chaîne en coordonnées célestes (ra, dec).
 * Formats : "217.5 -62.7", "217 -62", "14.5 -62" (14.5h si ≤24), "14 30 -62" (14h30m -62°)
 * @param {string} str
 * @returns {{ ra: number, dec: number } | null}
 */
export function parseCoordinates(str) {
  const s = String(str ?? '').trim().replace(/[h°d'"]/gi, ' ')
  const parts = s.split(/[\s,;]+/).map((p) => parseFloat(p)).filter((n) => !Number.isNaN(n))
  if (parts.length < 2) return null
  let ra
  let dec
  if (parts.length >= 3 && parts[0] >= 0 && parts[0] <= 24 && parts[1] >= 0 && parts[1] < 60 && parts[2] >= -90 && parts[2] <= 90) {
    ra = (parts[0] + parts[1] / 60) * 15
    dec = parts[2]
  } else if (parts.length >= 4 && parts[0] <= 24 && parts[2] >= -90 && parts[2] <= 90) {
    ra = (parts[0] + (parts[1] || 0) / 60) * 15
    dec = Math.sign(parts[2]) * (Math.abs(parts[2]) + (parts[3] || 0) / 60)
  } else {
    ra = parts[0]
    dec = Math.max(-90, Math.min(90, parts[1]))
    if (ra >= 0 && ra <= 24) ra = ra * 15
    else if (ra < 0 || ra > 360) return null
  }
  return { ra: ((ra % 360) + 360) % 360, dec: Math.max(-90, Math.min(90, dec)) }
}

/**
 * Coordonnées x,y,z d'un système stellaire (al).
 * Depuis coordinates ou conversion ra/dec + distance.
 * @param {object} system - Objet avec coordinates et distance
 * @returns {{ x: number, y: number, z: number }}
 */
export function getSystemXyz(system) {
  const coords = system?.coordinates || {}
  if (coords.x != null || coords.y != null || coords.z != null) {
    return { x: coords.x ?? 0, y: coords.y ?? 0, z: coords.z ?? 0 }
  }
  const ra = ((coords.ra ?? 0) * Math.PI) / 180
  const dec = ((coords.dec ?? 0) * Math.PI) / 180
  const d = parseFloat(system?.distance) || 1
  return {
    x: d * Math.cos(dec) * Math.cos(ra),
    y: d * Math.cos(dec) * Math.sin(ra),
    z: d * Math.sin(dec),
  }
}
