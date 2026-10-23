/**
 * Administration — lecture des comptes joueurs (RPC admin_list_players) et du journal de modération.
 * Fonctions pures, testées : statut d'un compte, filtre de la liste, libellés des actions.
 */

/** Filtres de la liste des joueurs */
export const PLAYER_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'active', label: 'Actifs' },
  { id: 'suspended', label: 'Suspendus' },
  { id: 'no-game', label: 'Sans partie' },
]

const STATUS_LABELS = {
  active: 'Actif',
  suspended: 'Suspendu',
  unconfirmed: 'Email non confirmé',
  'no-game': 'Sans partie',
}

/** @param {{ banned_until?: string|null }} player */
export function isSuspended(player, now = Date.now()) {
  return !!player.banned_until && new Date(player.banned_until).getTime() > now
}

/**
 * Statut d'un compte, par ordre de priorité : suspendu, email non confirmé, sans partie, actif.
 * @returns {'suspended'|'unconfirmed'|'no-game'|'active'}
 */
export function playerStatus(player, now = Date.now()) {
  if (isSuspended(player, now)) return 'suspended'
  if (!player.email_confirmed) return 'unconfirmed'
  if (!player.ship_id) return 'no-game'
  return 'active'
}

export function playerStatusLabel(player, now = Date.now()) {
  return STATUS_LABELS[playerStatus(player, now)]
}

/** Minuscules sans accents, pour une recherche tolérante */
function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Filtre la liste par statut puis par texte (email, pseudo, nom du vaisseau).
 * @param {object[]} players
 * @param {{ query?: string, filter?: string }} options
 */
export function filterPlayers(players, { query = '', filter = 'all' } = {}, now = Date.now()) {
  const needle = fold(query.trim())
  return players.filter((p) => {
    const status = playerStatus(p, now)
    if (filter === 'active' && status !== 'active') return false
    if (filter === 'suspended' && status !== 'suspended') return false
    if (filter === 'no-game' && status !== 'no-game' && status !== 'unconfirmed') return false
    if (!needle) return true
    return [p.email, p.pseudo, p.ship_name].some((v) => fold(v).includes(needle))
  })
}

/** Date et heure en français, « — » si absente */
export function formatAdminDate(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ACTION_LABELS = {
  suspend: 'Suspension',
  unsuspend: 'Réactivation',
  rename: 'Renommage',
  delete_player: 'Suppression du compte',
  delete_interpretation: 'Interprétation supprimée',
}

/**
 * Libellé et détail d'une entrée du journal de modération.
 * @param {{ action: string, details?: Record<string, any> }} entry
 * @returns {{ label: string, detail: string }}
 */
export function describeAction(entry) {
  const details = entry.details ?? {}
  const label = ACTION_LABELS[entry.action] ?? entry.action
  const lines = []
  if (details.reason) lines.push(`Motif : ${details.reason}`)
  if (details.pseudo) lines.push(`Pseudo : ${details.pseudo.before} → ${details.pseudo.after}`)
  if (details.ship_name) lines.push(`Vaisseau : ${details.ship_name.before} → ${details.ship_name.after}`)
  if (details.text) lines.push(`« ${details.text} »`)
  return { label, detail: lines.join(' · ') }
}
