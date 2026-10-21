/**
 * Garde d'authentification — décisions de redirection (fonctions pures, testées)
 *
 * meta.public    : route accessible sans compte (pages d'authentification)
 * meta.guestOnly : route réservée aux visiteurs non connectés (connexion, inscription…)
 */

/**
 * Chemin de retour après connexion, limité aux chemins internes (évite les redirections ouvertes).
 * @param {unknown} path
 * @returns {string|null}
 */
export function safeRedirect(path) {
  if (typeof path !== 'string') return null
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return null
  return path
}

/**
 * @param {{ fullPath: string, meta: Record<string, unknown> }} to
 * @param {{ configured: boolean, authenticated: boolean }} state
 * @returns {true | { name: string, query?: Record<string, string> }}
 */
export function resolveAuthRedirect(to, { configured, authenticated }) {
  // Hors ligne (Supabase non configuré) : mode démo sans compte
  if (!configured) return to.meta.public ? { name: 'observatoire' } : true

  if (!authenticated && !to.meta.public) {
    return to.fullPath === '/' ? { name: 'connexion' } : { name: 'connexion', query: { redirect: to.fullPath } }
  }
  if (authenticated && to.meta.guestOnly) return { name: 'observatoire' }
  return true
}
