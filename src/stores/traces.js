/**
 * Store Traces — traces créées par le joueur depuis le Laboratoire
 * Complément des traces immuables (Supabase) pour l'onglet Artefacts
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

const OBS_TYPE_TO_TRACE_TYPE = {
  SIGNAL: 'SIGNAL_RADIO',
  PLANETE: 'ORBITAL_ANOMALY',
  MINEUR: 'INTERSTELLAR_OBJECT',
  OBJET: 'PHYSICAL_ARTIFACT',
  ATMOSPHERE: 'CHEMICAL_ANOMALY',
  ETOILE: 'STELLAR_ANOMALY',
}

export const useTracesStore = defineStore('traces', () => {
  const playerTraces = ref([])

  function addTrace({ designation, type, systemId, description, discovered }) {
    const id = `player-${Date.now()}`
    const trace = {
      id,
      designation,
      type: OBS_TYPE_TO_TRACE_TYPE[type] ?? 'PLAYER_TRACE',
      system_id: systemId ?? '—',
      difficulty: '1',
      description: description ?? '',
      discovered: discovered ?? '',
      unread: true,
      origin: 'JOUEUR',
    }
    playerTraces.value = [trace, ...playerTraces.value]
    return id
  }

  function markAsRead(id) {
    const t = playerTraces.value.find((tr) => tr.id === id)
    if (t) t.unread = false
  }

  return { playerTraces, addTrace, markAsRead }
})
