/**
 * Verdict du Laboratoire — LACUNA
 * La lecture que le joueur fait d'une observation analysée. Le jeu ne la valide jamais.
 * Réf. LACUNA_VERDICT.md §5.
 */

/** Lectures possibles (enum SQL verdict_reading, migration 00075) */
export const VERDICT_READINGS = [
  { id: 'NATUREL_CONNU', label: 'Naturel connu', hint: 'Le modèle de référence suffit ; l’écart est expliqué ou négligeable.' },
  { id: 'NATUREL_INEXPLIQUE', label: 'Naturel inexpliqué', hint: 'Un phénomène naturel, que le modèle ne décrit pas.' },
  { id: 'ARTIFICIEL_POSSIBLE', label: 'Origine artificielle possible', hint: 'L’écart est compatible avec une intervention.' },
  { id: 'INDETERMINE', label: 'Indéterminé', hint: 'Rien ne permet de trancher.' },
]

/** Niveaux de confiance (enum SQL confidence_level, LACUNA_GDD.md §3) */
export const CONFIDENCE_LEVELS = [
  { id: 'OBSERVATION', label: 'Observation' },
  { id: 'HYPOTHÈSE', label: 'Hypothèse' },
  { id: 'CONVICTION', label: 'Conviction' },
  { id: 'CERTITUDE', label: 'Certitude' },
]

/** Longueur maximale de la note (contrainte lab_verdicts.note) */
export const VERDICT_NOTE_MAX = 280

export function getReadingLabel(id) {
  return VERDICT_READINGS.find((r) => r.id === id)?.label ?? id
}

export function getConfidenceLabel(id) {
  return CONFIDENCE_LEVELS.find((c) => c.id === id)?.label ?? id
}

/**
 * Famille de l'écart principal d'une observation : celle qui est mesurée par le plus de rapports
 * (les ombres ne comptent pas). À égalité, la première relevée. null si aucun écart mesuré.
 * @param {Array<Array<{ family: string, requiresNiveau: string|null }>>} reportDeviationLists
 * @returns {string|null}
 */
export function getMainDeviationFamily(reportDeviationLists) {
  const counts = new Map()
  for (const list of reportDeviationLists) {
    for (const d of list) {
      if (d.requiresNiveau) continue
      counts.set(d.family, (counts.get(d.family) ?? 0) + 1)
    }
  }
  let best = null
  for (const [family, n] of counts) {
    if (best === null || n > counts.get(best)) best = family
  }
  return best
}

/** Texte court d'un verdict : « Naturel inexpliqué · conviction » */
export function formatVerdict(verdict) {
  if (!verdict) return ''
  return `${getReadingLabel(verdict.reading)} · ${getConfidenceLabel(verdict.confidence).toLowerCase()}`
}
