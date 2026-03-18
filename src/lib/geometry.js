/**
 * Utilitaires géométrie — LACUNA
 * Distance point–segment, interpolation d’angles.
 */

/**
 * Distance du point (px, py) au segment (x1,y1)–(x2,y2).
 * @param {number} px - Abscisse du point
 * @param {number} py - Ordonnée du point
 * @param {number} x1 - Abscisse extrémité 1 du segment
 * @param {number} y1 - Ordonnée extrémité 1 du segment
 * @param {number} x2 - Abscisse extrémité 2 du segment
 * @param {number} y2 - Ordonnée extrémité 2 du segment
 * @returns {number}
 */
export function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return Math.hypot(px - projX, py - projY)
}

/**
 * Interpolation d’angle en degrés (plus court chemin sur le cercle).
 * @param {number} a - Angle de départ (degrés)
 * @param {number} b - Angle d’arrivée (degrés)
 * @param {number} t - Facteur 0–1
 * @returns {number}
 */
export function lerpAngle(a, b, t) {
  const d = ((b - a + 540) % 360) - 180
  return a + d * t
}
