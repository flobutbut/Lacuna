/**
 * Session client — identifiant localStorage pour prototype sans auth
 * Partagé entre observations, signaux, etc.
 */

const SESSION_KEY = 'lacuna_session_id'

/** Réinitialise la session prototype (nouveaux signaux, observations vides). Pour dev/démo. */
export function resetPrototypeSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `sess-${crypto.randomUUID()}`
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}
