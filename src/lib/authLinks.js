/**
 * Liens des emails d'authentification — LACUNA
 *
 * Les liens envoyés par Supabase (/auth/v1/verify) sont consommés dès leur première ouverture :
 * un aperçu de lien (WhatsApp, iMessage) ou un antivirus de messagerie peut les utiliser avant
 * le joueur. Les modèles d'email pointent donc vers nos pages (/confirmer, /nouveau-mot-de-passe)
 * avec le jeton en paramètre ; la page ne le valide qu'au clic du joueur (verifyOtp).
 *
 * Modèles Supabase (Authentication → Emails) :
 *   Confirm signup : {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup
 *   Reset password : {{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery
 */

/** Types de lien acceptés par chaque page */
const SIGNUP_TYPES = ['signup', 'email']
const RECOVERY_TYPES = ['recovery']

/**
 * Jeton d'un lien d'email (?token_hash=…&type=…), s'il est d'un type attendu.
 * @param {string} search - window.location.search
 * @param {'signup'|'recovery'} kind
 * @returns {{ tokenHash: string, type: string } | null}
 */
export function parseEmailLink(search, kind) {
  const params = new URLSearchParams(search ?? '')
  const tokenHash = params.get('token_hash')
  const type = params.get('type')
  const allowed = kind === 'recovery' ? RECOVERY_TYPES : SIGNUP_TYPES
  if (!tokenHash || !allowed.includes(type)) return null
  return { tokenHash, type }
}

/**
 * Inscription d'une adresse qui a déjà un compte confirmé : Supabase répond sans erreur
 * et sans envoyer d'email, avec un utilisateur sans identité (protection contre l'énumération).
 * @param {{ identities?: unknown[] } | null | undefined} user
 */
export function isExistingAccount(user) {
  return Array.isArray(user?.identities) && user.identities.length === 0
}

/** Délai avant de pouvoir redemander un email (Supabase refuse un second envoi sous 60 s) */
export const RESEND_COOLDOWN_S = 60
