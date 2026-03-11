/**
 * Store Observations — file d'observations Laboratoire
 * Persisté en base (observations) quand Supabase configuré, sinon mémoire uniquement
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

const OBS_STATES = { PENDING: 'En attente', RUNNING: 'Analyse en cours', DONE: 'Analysé' }
const NIVEAUX = { PASSIF: 'Passif', SYSTEME: 'Système', ORBITE: 'Orbite proche', CONTACT: 'Contact' }
const SESSION_KEY = 'lacuna_session_id'

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `sess-${crypto.randomUUID()}`
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function dbToObs(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    system: row.system_display ?? row.system_id ?? '—',
    system_id: row.system_id,
    date: row.date ?? '—',
    state: row.state,
    niveau: NIVEAUX[row.niveau] ?? NIVEAUX.PASSIF,
    coords: row.coords ?? '—',
    distance: row.distance ?? '—',
    support: row.support,
    durationSec: row.duration_sec,
  }
}

function obsToDb(obs, sessionId) {
  const niveauKey = Object.keys(NIVEAUX).find((k) => NIVEAUX[k] === obs.niveau) || 'PASSIF'
  return {
    session_id: sessionId,
    type: obs.type,
    system_id: obs.system_id || null,
    system_display: obs.system ?? null,
    name: obs.name,
    state: obs.state ?? 'PENDING',
    niveau: niveauKey,
    coords: obs.coords ?? null,
    distance: obs.distance ?? null,
    support: obs.type === 'SIGNAL' ? (obs.support ?? 'EM_RADIO') : null,
    duration_sec: obs.type === 'SIGNAL' ? (obs.durationSec ?? 72) : null,
    date: obs.date ?? null,
  }
}

const FALLBACK_LIST = [
  { id: '1', name: 'HD44594-b · Atmosphère', type: 'ATMOSPHERE', system: 'HD 44594', system_id: 'HD44594', date: '2341-05-22', state: OBS_STATES.RUNNING, niveau: NIVEAUX.ORBITE, coords: '12.4, -3.1, 0.2', distance: '11,4 al' },
  { id: '2', name: 'Ross128 · Signal', type: 'SIGNAL', support: 'EM_RADIO', system: 'Ross 128', system_id: 'ROSS128', date: '2341-03-15', state: OBS_STATES.DONE, niveau: NIVEAUX.PASSIF, coords: '11.0, 2.1, 0.5', distance: '10,9 al', durationSec: 72 },
  { id: '3', name: 'Proxima c · Corps planétaire', type: 'PLANETE', system: 'Proxima Centauri', system_id: 'PROXIMA', date: '2341-01-08', state: OBS_STATES.PENDING, niveau: NIVEAUX.SYSTEME, coords: '4.2, -1.1, 0.0', distance: '4,2 al' },
]

export const useObservationsStore = defineStore('observations', () => {
  const list = ref([])
  const loaded = ref(false)

  const OBS_STATES_VAL = { PENDING: 'En attente', RUNNING: 'Analyse en cours', DONE: 'Analysé' }

  async function fetch() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      if (list.value.length === 0) list.value = [...FALLBACK_LIST]
      loaded.value = true
      return list.value
    }
    const sessionId = getOrCreateSessionId()
    const { data, error } = await supabase
      .from('observations')
      .select('id, type, system_id, system_display, name, state, niveau, coords, distance, support, duration_sec, date')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[observations] Erreur fetch:', error.message)
      list.value = [...FALLBACK_LIST]
    } else {
      list.value = (data ?? []).map(dbToObs)
    }
    loaded.value = true
    return list.value
  }

  function hasUnanalyzed() {
    return list.value.some(
      (o) => o.state === OBS_STATES_VAL.PENDING || o.state === OBS_STATES_VAL.RUNNING
    )
  }

  async function addObservation(obs) {
    const payload = {
      name: obs.name,
      type: obs.type,
      system: obs.system ?? '—',
      system_id: obs.system_id ?? null,
      date: obs.date ?? '2341-' + new Date().toISOString().slice(5, 10),
      niveau: obs.niveau ?? NIVEAUX.PASSIF,
      coords: obs.coords ?? '—',
      distance: obs.distance ?? '—',
      support: obs.type === 'SIGNAL' ? (obs.support ?? 'EM_RADIO') : undefined,
      durationSec: obs.type === 'SIGNAL' ? (obs.durationSec ?? 72) : undefined,
      ...obs,
    }

    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      const id = String(Date.now())
      list.value.unshift({
        id,
        ...payload,
        state: OBS_STATES.PENDING,
      })
      return id
    }

    const sessionId = getOrCreateSessionId()
    const { data, error } = await supabase
      .from('observations')
      .insert(obsToDb(payload, sessionId))
      .select('id, type, system_id, system_display, name, state, niveau, coords, distance, support, duration_sec, date')
      .single()

    if (error) {
      console.warn('[observations] Erreur insert:', error.message)
      const id = String(Date.now())
      list.value.unshift({ id, ...payload, state: OBS_STATES.PENDING })
      return id
    }
    const item = dbToObs(data)
    list.value = [item, ...list.value]
    return item.id
  }

  async function removeObservation(id) {
    list.value = list.value.filter((o) => o.id !== id)
    const supabaseStore = useSupabaseStore()
    if (supabaseStore.isConfigured()) {
      await supabase.from('observations').delete().eq('id', id)
    }
  }

  async function updateObservationState(id, state) {
    const obs = list.value.find((o) => o.id === id)
    if (obs) obs.state = state
    const supabaseStore = useSupabaseStore()
    if (supabaseStore.isConfigured()) {
      await supabase.from('observations').update({ state }).eq('id', id)
    }
  }

  return {
    list,
    loaded,
    fetch,
    addObservation,
    removeObservation,
    updateObservationState,
    hasUnanalyzed,
    OBS_STATES,
    NIVEAUX,
  }
})
