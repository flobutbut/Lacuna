/**
 * Garde d'authentification — décisions de redirection (fonctions pures, testées)
 *
 * meta.public     : route accessible sans compte (pages d'authentification)
 * meta.guestOnly  : route réservée aux visiteurs non connectés (connexion, inscription…)
 * meta.onboarding : création de partie (/bienvenue), réservée aux joueurs connectés sans vaisseau
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
 * @param {{ configured: boolean, authenticated: boolean, hasShip?: boolean|null }} state
 *   hasShip : null = inconnu (non chargé ou erreur) → on ne bloque pas le joueur
 * @returns {true | { name: string, query?: Record<string, string> }}
 */
export function resolveAuthRedirect(to, { configured, authenticated, hasShip = null }) {
  // Hors ligne (Supabase non configuré) : mode démo sans compte
  if (!configured) return to.meta.public || to.meta.onboarding ? { name: 'observatoire' } : true

  if (!authenticated && !to.meta.public) {
    return to.fullPath === '/' ? { name: 'connexion' } : { name: 'connexion', query: { redirect: to.fullPath } }
  }
  if (authenticated && to.meta.guestOnly) return { name: 'observatoire' }
  // Partie à créer : toute page du jeu renvoie vers /bienvenue
  if (authenticated && hasShip === false && !to.meta.public && !to.meta.onboarding) return { name: 'bienvenue' }
  // Partie déjà créée : /bienvenue n'a plus lieu d'être
  if (to.meta.onboarding && hasShip === true) return { name: 'observatoire' }
  return true
}
