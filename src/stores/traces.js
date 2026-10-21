/**
 * Store Traces — traces immuables (Supabase), traces créées par le joueur depuis le Laboratoire,
 * et interprétations associées (onglet Artefacts)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

const OBS_TYPE_TO_TRACE_TYPE = {
  SIGNAL: 'SIGNAL_RADIO',
  PLANETE: 'ORBITAL_ANOMALY',
  MINEUR: 'INTERSTELLAR_OBJECT',
  OBJET: 'PHYSICAL_ARTIFACT',
  ATMOSPHERE: 'CHEMICAL_ANOMALY',
  ETOILE: 'STELLAR_ANOMALY',
}

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

  async function fetchImmutableTraces() {
    if (!useSupabaseStore().isConfigured()) {
      immutableTraces.value = FALLBACK_TRACES
      return
    }
    tracesLoading.value = true
    tracesError.value = null
    const { data, error } = await supabase
      .from('traces')
      .select('id, designation, type, system_id, difficulty, description, discovered')
      .eq('origin', 'IMMUABLE')
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

  /** Ajoute une interprétation (HYPOTHÈSE) ; lève une erreur si l'insertion échoue */
  async function addInterpretation(traceId, text) {
    if (isLocalTrace(traceId)) {
      const interp = { id: 'local-' + Date.now(), text, confidence: 'HYPOTHÈSE', generation: null, galactic_date: null, created_at: new Date().toISOString() }
      const list = localInterpretations.value[traceId] || []
      localInterpretations.value = { ...localInterpretations.value, [traceId]: [...list, interp] }
      return interp
    }
    const { data, error } = await supabase
      .from('interpretations')
      .insert({ trace_id: traceId, text, confidence: 'HYPOTHÈSE', ship_id: null, generation: null })
      .select()
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
    addTrace,
    markAsRead,
    fetchImmutableTraces,
    fetchInterpretations,
    addInterpretation,
    deleteInterpretation,
  }
})
