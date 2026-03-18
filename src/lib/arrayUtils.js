/**
 * Utilitaires tableaux — LACUNA
 */

/**
 * Sous-échantillonnage : retourne au plus maxPoints éléments (équirépartis).
 * @param {Array} data - Tableau source
 * @param {number} maxPoints - Nombre max d'éléments
 * @returns {Array}
 */
export function downsample(data, maxPoints) {
  if (data.length <= maxPoints) return data
  const step = data.length / maxPoints
  const out = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.floor(i * step)
    out.push(data[idx])
  }
  return out
}
