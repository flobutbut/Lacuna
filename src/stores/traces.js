/**
 * Store Traces — traces immuables (Supabase), artefacts déposés par le joueur depuis un verdict
 * du Laboratoire (RPC create_artifact, LACUNA_VERDICT.md §6.3), et interprétations associées (onglet Artefacts)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useShipStore } from '@/stores/ship'

const TRACE_COLUMNS = 'id, designation, type, origin, system_id, difficulty, description, discovered, player_subtype'

// Données de repli si Supabase non configuré
const FALLBACK_TRACES = [
  { id: '1', designation: 'WOW-1977-A', type: 'SIGNAL_RADIO', system_id: 'SOL', difficulty: '1', description: 'Signal radio de 72 secondes détecté à 1420 MHz, correspondant exactement à la raie de l\'hydrogène. Non reproduit depuis. Non expliqué.', discovered: '1977-08-15', unread: true },
  { id: '2', designation: 'OUMUAMUA-2017', type: 'INTERSTELLAR_OBJECT', system_id: 'SOL', difficulty: '1', description: 'Objet interstellaire détecté en 2017. Trajectoire hyperbolique. Accélération non-gravitationnelle observée. Forme allongée suggérée. Origine inconnue.', discovered: '2017-10-19', unread: true },
  { id: '3', designation: 'BENNU-NB-2023', type: 'CHEMICAL_ANOMALY', system_id: 'SOL', difficulty: '2', description: 'Nucléobases (uracile, niacine) découvertes dans les échantillons de Bennu et Ryugu. Composition suggérant une origine prébiotique.', discovered: '2023-03-21', unread: false },
]

const INTERPRETATION_COLUMNS = 'id, text, confidence, generation, galactic_date, created_at'

/** Interprétation conservée en mémoire (trace joueur ou Supabase non configuré) */
function isLocalTrace(traceId) {
  return traceId.startsWith('player-') || !useSupabaseStore().isConfigured()
}

export const useTracesStore = defineStore('traces', () => {
  const playerTraces = ref([])
  const immutableTraces = ref([])
  const tracesLoading = ref(false)
  const tracesError = ref(null)
  /** Interprétations en mémoire, par trace : { traceId: [interp] } */
  const localInterpretations = ref({})

  /** Traces joueur (récentes en tête) puis traces immuables */
  const artefacts = computed(() => [...playerTraces.value, ...immutableTraces.value])

  /** Artefacts déposés par ce vaisseau (traces JOUEUR reliées par ship_traces), récents en tête */
  async function fetchPlayerTraces() {
    if (!useSupabaseStore().isConfigured()) return
    const shipStore = useShipStore()
    if (!shipStore.loaded) await shipStore.fetch()
    const shipId = shipStore.ship?.id
    if (!shipId) return
    const { data, error } = await supabase
      .from('ship_traces')
      .select(`discovered_at, traces!inner(${TRACE_COLUMNS})`)
      .eq('ship_id', shipId)
      .eq('traces.origin', 'JOUEUR')
      .order('discovered_at', { ascending: false })
    if (error) {
      console.warn('[traces] Erreur fetch artefacts joueur:', error.message)
      return
    }
    const unread = new Set(playerTraces.value.filter((t) => t.unread).map((t) => t.id))
    playerTraces.value = (data || []).map((row) => ({ ...row.traces, unread: unread.has(row.traces.id) }))
  }

  /**
   * Dépose un artefact depuis le verdict courant d'une observation (LACUNA_VERDICT.md §6.3).
   * En ligne : RPC create_artifact (trace JOUEUR permanente, écarts mesurés, interprétation).
   * Hors ligne : trace et interprétation gardées en mémoire.
   * @param {{ verdict: object, observation: object, designation: string, subtype: string,
   *           interpretation: string, deviationLines: string[] }} payload
   * @returns {Promise<{ traceId: string, designation: string }>} lève une erreur si le dépôt échoue
   */
  async function createArtifact({ verdict, observation, designation, subtype, interpretation, deviationLines }) {
    if (!useSupabaseStore().isConfigured() || String(verdict.id).startsWith('local-')) {
      const id = `player-${Date.now()}`
      const trace = {
        id,
        designation: designation.trim(),
        type: 'PLAYER_TRACE',
        origin: 'JOUEUR',
        player_subtype: subtype,
        system_id: observation.system_id ?? '—',
        difficulty: '1',
        description: deviationLines.length ? deviationLines.join('\n') : 'Aucun écart mesuré au-delà du bruit.',
        discovered: verdict.shipDate,
        unread: true,
      }
      playerTraces.value = [trace, ...playerTraces.value]
      const interp = {
        id: 'local-' + Date.now(),
        text: interpretation.trim() || verdict.note || '',
        confidence: verdict.confidence,
        generation: verdict.generation,
        galactic_date: verdict.shipDate,
        created_at: new Date().toISOString(),
      }
      localInterpretations.value = { ...localInterpretations.value, [id]: [interp] }
      return { traceId: id, designation: trace.designation }
    }
    const { data, error } = await supabase.rpc('create_artifact', {
      p_verdict_id: verdict.id,
      p_designation: designation,
      p_subtype: subtype,
      p_interpretation: interpretation?.trim() || null,
    })
    if (error) throw error
    await fetchPlayerTraces()
    const created = playerTraces.value.find((t) => t.id === data.trace_id)
    if (created) created.unread = true
    return { traceId: data.trace_id, designation: data.designation }
  }

  function markAsRead(id) {
    const t = playerTraces.value.find((tr) => tr.id === id)
    if (t) t.unread = false
  }

  async function fetchImmutableTraces() {
    if (!useSupabaseStore().isConfigured()) {
      immutableTraces.value = FALLBACK_TRACES
      return
    }
    tracesLoading.value = true
    tracesError.value = null
    const { data, error } = await supabase
      .from('traces')
      .select('id, designation, type, origin, system_id, difficulty, description, discovered, precursor_generation')
      .in('origin', ['IMMUABLE', 'PRÉCURSEUR'])
      .order('discovered', { ascending: true })
    tracesLoading.value = false
    if (error) {
      console.warn('[traces] Erreur fetch traces:', error.message)
      tracesError.value = error.message
      immutableTraces.value = FALLBACK_TRACES
      return
    }
    immutableTraces.value = (data || []).map((t) => ({ ...t, unread: false }))
  }

  /**
   * Débloque côté serveur les lectures de traces accessibles depuis les observations du système courant
   * (RPC unlock_trace_levels), puis recharge la collection si quelque chose a été découvert.
   */
  async function unlockLevels() {
    if (!useSupabaseStore().isConfigured()) return
    const { data, error } = await supabase.rpc('unlock_trace_levels')
    if (error) {
      console.warn('[traces] unlock_trace_levels:', error.message)
      return
    }
    if (data?.levels > 0 || data?.traces > 0) await fetchImmutableTraces()
  }

  /** Lectures débloquées d'une trace (par niveau d'observation croissant) ; vide pour une trace sans niveaux */
  async function fetchLevels(traceId) {
    if (isLocalTrace(traceId)) return []
    const { data, error } = await supabase.rpc('get_trace_levels', { p_trace_id: traceId })
    if (error) {
      console.warn('[traces] get_trace_levels:', error.message)
      return []
    }
    return data || []
  }

  /** Interprétations d'une trace, dans l'ordre chronologique */
  async function fetchInterpretations(traceId) {
    if (isLocalTrace(traceId)) return localInterpretations.value[traceId] || []
    const { data, error } = await supabase
      .from('interpretations')
      .select(INTERPRETATION_COLUMNS)
      .eq('trace_id', traceId)
      .order('created_at', { ascending: true })
    if (error) {
      console.warn('[traces] Erreur fetch interpretations:', error.message)
      return []
    }
    return data || []
  }

  /**
   * Ajoute une interprétation (HYPOTHÈSE) ; lève une erreur si l'insertion échoue.
   * ship_id identifie l'auteur pour les règles d'accès (jamais affiché) ; la génération date l'interprétation.
   */
  async function addInterpretation(traceId, text) {
    if (isLocalTrace(traceId)) {
      const interp = { id: 'local-' + Date.now(), text, confidence: 'HYPOTHÈSE', generation: null, galactic_date: null, created_at: new Date().toISOString() }
      const list = localInterpretations.value[traceId] || []
      localInterpretations.value = { ...localInterpretations.value, [traceId]: [...list, interp] }
      return interp
    }
    const shipStore = useShipStore()
    if (!shipStore.loaded) await shipStore.fetch()
    const ship = shipStore.ship
    const { data, error } = await supabase
      .from('interpretations')
      .insert({ trace_id: traceId, text, confidence: 'HYPOTHÈSE', ship_id: ship?.id ?? null, generation: ship?.generation ?? null })
      .select(INTERPRETATION_COLUMNS)
      .single()
    if (error) throw error
    return data
  }

  /** Supprime une interprétation ; lève une erreur si la suppression échoue (ex. RLS) */
  async function deleteInterpretation(traceId, interpId) {
    if (isLocalTrace(traceId)) {
      const list = (localInterpretations.value[traceId] || []).filter((i) => i.id !== interpId)
      localInterpretations.value = { ...localInterpretations.value, [traceId]: list }
      return
    }
    const { error } = await supabase.from('interpretations').delete().eq('id', interpId)
    if (error) throw error
  }

  return {
    playerTraces,
    immutableTraces,
    tracesLoading,
    tracesError,
    artefacts,
    fetchPlayerTraces,
    createArtifact,
    markAsRead,
    fetchImmutableTraces,
    unlockLevels,
    fetchLevels,
    fetchInterpretations,
    addInterpretation,
    deleteInterpretation,
  }
})
