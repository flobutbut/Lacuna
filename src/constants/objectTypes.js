/**
 * Labels des types d'objets — LACUNA
 * Types "body" utilisés pour l'affichage (Observatoire, Laboratoire)
 * Mapping DB → body : voir systemObjects.toBodyFormat (STAR→ETOILE, etc.)
 */

/** Libellés français par type body (ETOILE, PLANETE, MINEUR, etc.) */
export const OBJECT_TYPE_LABELS = {
  SIGNAL: 'Signal reçu',
  PLANETE: 'Corps planétaire',
  MINEUR: 'Corps mineur',
  OBJET: 'Objet récupéré',
  ATMOSPHERE: 'Atmosphère',
  ETOILE: 'Étoile',
}

/** Libellés composition (planètes, lunes) — composition_type en base */
export const COMPOSITION_LABELS = {
  TERESTRIAL: 'Rocheuse',
  GAS_GIANT: 'Gazeuse',
  ICE_GIANT: 'Géante de glace',
  ICY: 'Glacé',
}

/** Mapping type DB (PLANET, MOON, MINOR_BODY) → libellé affichage pour la carte */
export function planetTypeLabel(obj) {
  if (!obj?.type) return '—'
  if (obj.type === 'MOON') return 'Lune'
  const map = { PLANET: 'PLANETE', MINOR_BODY: 'MINEUR' }
  return OBJECT_TYPE_LABELS[map[obj.type]] ?? obj.type
}

/**
 * Type normalisé pour les filtres (STAR→ETOILE, PLANET→PLANETE).
 * @param {{ type?: string }|null} obs
 * @returns {string|null}
 */
export function getObsFilterType(obs) {
  if (!obs?.type) return null
  if (obs.type === 'STAR') return 'ETOILE'
  if (obs.type === 'PLANET') return 'PLANETE'
  return obs.type
}

/**
 * Descripteur d'icône pour ObservationCard (icon-type / icon-value).
 * @param {{ type?: string, structure?: string }|null} obs
 * @returns {{ type: 'signal'|'observation', value: string }}
 */
export function getObservationIcon(obs) {
  if (!obs) return { type: 'signal', value: '' }
  if (obs.type === 'SIGNAL') return { type: 'signal', value: obs.structure ?? '' }
  return { type: 'observation', value: getObsFilterType(obs) ?? obs.type }
}
