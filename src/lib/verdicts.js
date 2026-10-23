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

/** Libellés des familles dans le texte du journal — même texte que verdict_journal_text (migration 00076) */
const FAMILY_TEXT = {
  ELECTROMAGNETIQUE: 'électromagnétique',
  ORBITALE: 'orbitale',
  CHIMIQUE: 'chimique',
  MORPHOLOGIQUE: 'morphologique',
  THERMIQUE: 'thermique',
  TEMPORELLE: 'temporelle',
  GRAVITATIONNELLE: 'gravitationnelle',
  ABSENCE: 'absence',
}

/**
 * Texte de l'entrée de journal d'un verdict (LACUNA_VERDICT.md §6.2).
 * En ligne, le serveur l'écrit lui-même (verdict_journal_text) ; ce texte sert au mode démo.
 * @param {{ reading: string, confidence: string, family: string|null, sightings: number, note?: string }} v
 */
export function buildVerdictJournalText({ reading, confidence, family, sightings, note }) {
  const head = `${getReadingLabel(reading)} (${confidence.toLowerCase()}). `
  const body = family
    ? `Écart principal (${FAMILY_TEXT[family] ?? family.toLowerCase()}), mesuré par ${sightings} rapport${sightings > 1 ? 's' : ''}.`
    : 'Aucun écart mesuré.'
  const quote = note?.trim() ? `\n« ${note.trim()} »` : ''
  return head + body + quote
}

/** Sous-types d'une trace JOUEUR (LACUNA_GDD.md §4, traces.player_subtype) */
export const PLAYER_TRACE_SUBTYPES = [
  { id: 'ANNOTATION', label: 'Annotation', hint: 'Une remarque sur ce système.' },
  { id: 'DISCOVERY', label: 'Découverte', hint: 'Quelque chose que le modèle n’explique pas.' },
  { id: 'WARNING', label: 'Avertissement', hint: 'Une mise en garde pour les vaisseaux suivants.' },
  { id: 'DIRECTION', label: 'Direction', hint: 'Une piste vers un autre système.' },
]

/** Sous-type suggéré d'après la lecture du verdict (LACUNA_VERDICT.md §6.3) */
export function suggestSubtype(reading) {
  return reading === 'NATUREL_INEXPLIQUE' || reading === 'ARTIFICIEL_POSSIBLE' ? 'DISCOVERY' : 'ANNOTATION'
}

/** Longueur maximale d'une désignation d'artefact (create_artifact) */
export const ARTIFACT_DESIGNATION_MAX = 40
/** Longueur maximale de l'interprétation déposée avec l'artefact (create_artifact) */
export const ARTIFACT_INTERPRETATION_MAX = 2000

/** Désignation suggérée : le nom de l'objet, sans le type (« Proxima c · Corps planétaire » → « PROXIMA-C ») */
export function suggestDesignation(observationName) {
  const base = String(observationName ?? '').split('·')[0].trim()
  return base.toUpperCase().replace(/\s+/g, '-').slice(0, ARTIFACT_DESIGNATION_MAX) || 'TRACE'
}
