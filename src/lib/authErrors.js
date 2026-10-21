/**
 * Messages d'erreur d'authentification — LACUNA
 * Traduit les erreurs Supabase Auth (error.code) en messages affichables.
 */

const MESSAGES = {
  invalid_credentials: 'Email ou mot de passe incorrect.',
  email_not_confirmed: 'Adresse email non confirmée. Cliquez sur le lien reçu par email.',
  user_already_exists: 'Un compte existe déjà avec cette adresse.',
  email_exists: 'Un compte existe déjà avec cette adresse.',
  weak_password: 'Mot de passe trop faible. Choisissez-en un plus long ou plus varié.',
  email_address_invalid: 'Adresse email invalide.',
  validation_failed: 'Adresse email ou mot de passe invalide.',
  same_password: 'Le nouveau mot de passe doit être différent de l’ancien.',
  signup_disabled: 'Les inscriptions sont fermées pour le moment.',
  over_email_send_rate_limit: 'Trop d’emails envoyés. Réessayez dans quelques minutes.',
  over_request_rate_limit: 'Trop de tentatives. Réessayez dans quelques minutes.',
  session_not_found: 'Session expirée. Reconnectez-vous.',
  session_expired: 'Session expirée. Reconnectez-vous.',
  otp_expired: 'Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.',
}

const DEFAULT_MESSAGE = 'Une erreur est survenue. Réessayez.'
const NETWORK_MESSAGE = 'Connexion au serveur impossible. Vérifiez votre réseau.'

/**
 * Message lisible pour une erreur Supabase Auth.
 * @param {{ code?: string, name?: string, status?: number } | null | undefined} error
 * @returns {string}
 */
export function authErrorMessage(error) {
  if (!error) return DEFAULT_MESSAGE
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return NETWORK_MESSAGE
  return DEFAULT_MESSAGE
}

/**
 * Erreur renvoyée par Supabase dans l'URL d'un lien email (ex. lien expiré) :
 * #error=access_denied&error_code=otp_expired&error_description=…
 * @param {string} hash - window.location.hash
 * @returns {{ code: string } | null}
 */
export function authErrorFromUrlHash(hash) {
  const params = new URLSearchParams((hash ?? '').replace(/^#/, ''))
  const code = params.get('error_code') || params.get('error')
  return code ? { code } : null
}

/** Longueur minimale du mot de passe exigée côté client */
export const PASSWORD_MIN_LENGTH = 8

/**
 * Validation côté client avant envoi (évite un aller-retour pour les erreurs évidentes).
 * @returns {string|null} Message d'erreur, ou null si valide
 */
export function validateEmail(email) {
  const value = (email ?? '').trim()
  if (!value) return 'Indiquez votre adresse email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Adresse email invalide.'
  return null
}

/** @returns {string|null} */
export function validatePassword(password) {
  if (!password) return 'Indiquez un mot de passe.'
  if (password.length < PASSWORD_MIN_LENGTH) return `${PASSWORD_MIN_LENGTH} caractères minimum.`
  return null
}
