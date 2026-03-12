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
