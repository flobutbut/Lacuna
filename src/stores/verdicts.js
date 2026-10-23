/**
 * Store Verdicts — verdicts du joueur sur ses observations (table lab_verdicts, migration 00075)
 * Écriture par la RPC record_verdict : génération et date du vaisseau fixées par le serveur.
 * Un verdict n'est jamais modifié ; une révision en ajoute un. Réf. LACUNA_VERDICT.md §5.
 * Hors ligne (mode démo) : verdicts gardés en mémoire.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useShipStore } from '@/stores/ship'
import { DEPARTURE_YEAR } from '@/constants/calendar'

const COLUMNS = 'id, observation_id, reading, confidence, note, family, generation, ship_date, created_at'

function rowToVerdict(row) {
  return {
    id: row.id,
    observationId: row.observation_id,
    reading: row.reading,
    confidence: row.confidence,
    note: row.note ?? '',
    family: row.family ?? null,
    generation: row.generation,
    shipDate: row.ship_date,
    createdAt: row.created_at,
  }
}

const isUuid = (id) => /^[0-9a-f-]{36}$/i.test(id)

export const useVerdictsStore = defineStore('verdicts', () => {
  /** Verdicts par observation, du plus récent au plus ancien */
  const byObs = ref({})

  async function fetchForObservations(observationIds) {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) return byObs.value
    const ids = observationIds.filter(isUuid)
    if (ids.length === 0) return byObs.value
    const { data, error } = await supabase
      .from('lab_verdicts')
      .select(COLUMNS)
      .in('observation_id', ids)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[verdicts] Erreur fetch:', error.message)
      return byObs.value
    }
    const next = { ...byObs.value }
    for (const id of ids) delete next[id]
    for (const row of data ?? []) {
      const v = rowToVerdict(row)
      next[v.observationId] = [...(next[v.observationId] ?? []), v]
    }
    byObs.value = next
    return byObs.value
  }

  /**
   * Rend un verdict (ou en révise un) sur une observation.
   * @returns {Promise<{ verdict: object|null, error: string|null }>}
   */
  async function record(observationId, { reading, confidence, note, family }) {
    const supabaseStore = useSupabaseStore()
    let verdict
    if (supabaseStore.isConfigured() && isUuid(observationId)) {
      const { data, error } = await supabase.rpc('record_verdict', {
        p_observation_id: observationId,
        p_reading: reading,
        p_confidence: confidence,
        p_note: note?.trim() || null,
        p_family: family ?? null,
      })
      if (error) {
        console.warn('[verdicts] record_verdict:', error.message)
        return { verdict: null, error: error.message }
      }
      verdict = rowToVerdict(data)
    } else {
      const shipStore = useShipStore()
      verdict = {
        id: `local-${Date.now()}`,
        observationId,
        reading,
        confidence,
        note: note?.trim() ?? '',
        family: family ?? null,
        generation: shipStore.generation,
        shipDate: `${DEPARTURE_YEAR}-01-01`,
        createdAt: new Date().toISOString(),
      }
    }
    byObs.value = { ...byObs.value, [observationId]: [verdict, ...(byObs.value[observationId] ?? [])] }
    return { verdict, error: null }
  }

  /** Verdict courant d'une observation (le plus récent), ou null */
  function getCurrent(observationId) {
    return byObs.value[observationId]?.[0] ?? null
  }

  /** Tous les verdicts d'une observation, du plus récent au plus ancien */
  function getHistory(observationId) {
    return byObs.value[observationId] ?? []
  }

  function clearForObs(observationId) {
    const next = { ...byObs.value }
    delete next[observationId]
    byObs.value = next
  }

  return { byObs, fetchForObservations, record, getCurrent, getHistory, clearForObs }
})
