/**
 * Store Admin — modération des joueurs (migration 00070)
 * Tout passe par des RPC réservées aux comptes admin : un joueur ne lit toujours que son propre profil.
 * Les erreurs sont relancées telles quelles (les RPC lèvent des messages en français, voir adminErrorMessage).
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

/** Message affichable pour une erreur de RPC admin (les messages métier des RPC sont déjà en français) */
export function adminErrorMessage(err) {
  if (err?.code === '42501') return 'Action refusée : ce compte ne peut pas être modéré, ou vos droits ont changé.'
  if (['P0002', '22023'].includes(err?.code) && err.message) return err.message
  return 'Action impossible. Réessayez dans un instant.'
}

export const useAdminStore = defineStore('admin', () => {
  const players = ref([])
  const playersLoaded = ref(false)
  const interpretations = ref([])
  const interpretationsLoaded = ref(false)
  const actions = ref([])
  const actionsLoaded = ref(false)

  async function rpc(name, args) {
    const { data, error } = await supabase.rpc(name, args)
    if (error) throw error
    return data
  }

  async function fetchPlayers() {
    players.value = (await rpc('admin_list_players')) ?? []
    playersLoaded.value = true
  }

  async function fetchInterpretations() {
    interpretations.value = (await rpc('admin_list_interpretations', { p_limit: 100, p_offset: 0 })) ?? []
    interpretationsLoaded.value = true
  }

  async function fetchActions() {
    actions.value = (await rpc('admin_list_actions', { p_limit: 100 })) ?? []
    actionsLoaded.value = true
  }

  /** Les listes affichées changent après chaque action : on recharge ce qui a pu bouger */
  async function refresh() {
    await Promise.all([fetchPlayers(), fetchActions(), interpretationsLoaded.value ? fetchInterpretations() : null])
  }

  async function setSuspension(userId, suspended, reason = '') {
    await rpc('admin_set_suspension', { p_user: userId, p_suspended: suspended, p_reason: reason })
    await refresh()
  }

  /** Un champ vide laisse la valeur actuelle */
  async function renamePlayer(userId, { pseudo = '', shipName = '' }) {
    await rpc('admin_rename_player', { p_user: userId, p_pseudo: pseudo, p_ship_name: shipName })
    await refresh()
  }

  async function deletePlayer(userId) {
    await rpc('admin_delete_player', { p_user: userId })
    await refresh()
  }

  async function deleteInterpretation(id) {
    await rpc('admin_delete_interpretation', { p_id: id })
    await refresh()
  }

  return {
    players,
    playersLoaded,
    interpretations,
    interpretationsLoaded,
    actions,
    actionsLoaded,
    fetchPlayers,
    fetchInterpretations,
    fetchActions,
    setSuspension,
    renamePlayer,
    deletePlayer,
    deleteInterpretation,
  }
})
