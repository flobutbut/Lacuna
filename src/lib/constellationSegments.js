/**
 * Segments de constellation visibles — partagé Observatoire (2D) et Vue 3D
 * Filtre les segments dont les deux étoiles ont une position connue
 */

/**
 * Retourne les segments de constellation dont les deux extrémités sont présentes.
 * @param {Array<{star_from: string, star_to: string, constellation_abbr?: string, constellations?: object}>} lines
 * @param {Map<string, {x: number, y: number} | {x: number, y: number, z: number}>} positionsById - id → coords (2D ou 3D)
 * @returns {Array<{from: object, to: object, segment: object}>}
 */
export function getVisibleConstellationSegments(lines, positionsById) {
  if (!lines?.length || !positionsById) return []
  const result = []
  for (const seg of lines) {
    const from = positionsById.get(seg.star_from)
    const to = positionsById.get(seg.star_to)
    if (from && to) {
      result.push({ from, to, segment: seg })
    }
  }
  return result
}
