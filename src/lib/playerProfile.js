/**
 * Profil joueur — règles du pseudo et du nom du vaisseau, erreurs de création de partie
 * Bornes identiques aux contraintes SQL (migration 00046 : profiles.pseudo, ships.name).
 */

export const PSEUDO_MIN = 2
export const PSEUDO_MAX = 24
export const SHIP_NAME_MIN = 2
export const SHIP_NAME_MAX = 32

/** @returns {string|null} Message d'erreur, ou null si valide */
export function validatePseudo(value) {
  const v = (value ?? '').trim()
  if (!v) return 'Choisissez un pseudo.'
  if (v.length < PSEUDO_MIN || v.length > PSEUDO_MAX) return `Entre ${PSEUDO_MIN} et ${PSEUDO_MAX} caractères.`
  return null
}

/** @returns {string|null} */
export function validateShipName(value) {
  const v = (value ?? '').trim()
  if (!v) return 'Baptisez votre vaisseau.'
  if (v.length < SHIP_NAME_MIN || v.length > SHIP_NAME_MAX) return `Entre ${SHIP_NAME_MIN} et ${SHIP_NAME_MAX} caractères.`
  return null
}

/** Codes SQL levés par start_new_game avec un message déjà rédigé pour le joueur */
const GAME_ERROR_CODES = new Set(['22023', '23505', '42501'])

/**
 * Message lisible pour une erreur de start_new_game (RPC PostgREST).
 * @param {{ code?: string, message?: string } | null | undefined} error
 */
export function gameErrorMessage(error) {
  if (error?.code && GAME_ERROR_CODES.has(error.code) && error.message) return error.message
  if (error?.message?.includes('Failed to fetch')) return 'Connexion au serveur impossible. Vérifiez votre réseau.'
  return 'La création de la partie a échoué. Réessayez.'
}

/** true si l'erreur signifie que le joueur a déjà une partie (on le renvoie simplement au jeu) */
export function isGameAlreadyStarted(error) {
  return error?.code === '23505'
}
