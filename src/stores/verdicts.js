/**
 * Store Verdicts — verdicts du joueur sur ses observations (table lab_verdicts, migration 00075)
 * Écriture par la RPC record_verdict : génération et date du vaisseau fixées par le serveur.
 * Un verdict n'est jamais modifié ; une révision en ajoute un. Réf. LACUNA_VERDICT.md §5.
 * Hors ligne (mode démo) : verdicts gardés en mémoire.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useShipStore } from '@/stores/ship'
import { useJournalStore } from '@/stores/journal'
import { DEPARTURE_YEAR } from '@/constants/calendar'
import { buildVerdictJournalText } from '@/lib/verdicts'

const COLUMNS = 'id, observation_id, reading, confidence, note, family, generation, ship_date, logbook_entry_id, trace_id, created_at'

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
    logbookEntryId: row.logbook_entry_id ?? null,
    traceId: row.trace_id ?? null,
    createdAt: row.created_at,
  }
}

const isUuid = (id) => /^[0-9a-f-]{36}$/i.test(id)

export const useVerdictsStore = defineStore('verdicts', () => {
  /** Verdicts par observation, du plus récent au plus ancien */
  const byObs = ref({})

  /** Verdict courant de chaque observation (seuls ceux-là comptent pour le Drake de bord) */
  const currentVerdicts = computed(() => Object.values(byObs.value).map((list) => list[0]).filter(Boolean))

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
   * Rend un verdict (ou en révise un) sur une observation ; avec logToJournal, une entrée MANUEL
   * « Verdict — [observation] » est écrite au journal (LACUNA_VERDICT.md §6.2).
   * @param {string} observationId
   * @param {{ reading: string, confidence: string, note?: string, family: string|null,
   *           logToJournal?: boolean, observationName?: string, sightings?: number }} payload
   * @returns {Promise<{ verdict: object|null, error: string|null }>}
   */
  async function record(observationId, { reading, confidence, note, family, logToJournal = false, observationName = '', sightings = 0 }) {
    const journalStore = useJournalStore()
    const supabaseStore = useSupabaseStore()
    let verdict
    if (supabaseStore.isConfigured() && isUuid(observationId)) {
      const { data, error } = await supabase.rpc('record_verdict', {
        p_observation_id: observationId,
        p_reading: reading,
        p_confidence: confidence,
        p_note: note?.trim() || null,
        p_family: family ?? null,
        p_log_to_journal: logToJournal,
      })
      if (error) {
        console.warn('[verdicts] record_verdict:', error.message)
        return { verdict: null, error: error.message }
      }
      verdict = rowToVerdict(data)
      if (verdict.logbookEntryId && journalStore.loaded) await journalStore.fetch()
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
        logbookEntryId: null,
        traceId: null,
        createdAt: new Date().toISOString(),
      }
      if (logToJournal) {
        const entry = journalStore.addLocal({
          title: `Verdict — ${observationName}`.slice(0, 120),
          text: buildVerdictJournalText({ reading, confidence, family, sightings, note }),
          date: verdict.shipDate,
          generation: verdict.generation,
        })
        verdict.logbookEntryId = entry.id
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

  /** Relie un verdict à l'artefact déposé depuis lui (create_artifact) */
  function setTrace(observationId, verdictId, traceId) {
    const list = byObs.value[observationId] ?? []
    byObs.value = { ...byObs.value, [observationId]: list.map((v) => (v.id === verdictId ? { ...v, traceId } : v)) }
  }

  function clearForObs(observationId) {
    const next = { ...byObs.value }
    delete next[observationId]
    byObs.value = next
  }

  return { byObs, currentVerdicts, fetchForObservations, record, getCurrent, getHistory, setTrace, clearForObs }
})
