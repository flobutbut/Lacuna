/**
 * Store Observations — file d'observations Laboratoire
 * Persisté en base (observations, filtrées par vaisseau du joueur : ship_id) quand Supabase configuré, sinon mémoire uniquement
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useShipStore } from '@/stores/ship'
import { formatSignalObservationName } from '@/lib/formatUtils'

const OBS_STATES = { PENDING: 'En attente', RUNNING: 'Analyse en cours', DONE: 'Analysé' }
const NIVEAUX = { PASSIF: 'Passif', SYSTEME: 'Système', ORBITE: 'Orbite proche', CONTACT: 'Contact' }

const OBSERVATIONS_SELECT_COLUMNS =
  'id, type, system_id, system_display, name, state, niveau, coords, distance, support, structure, duration_sec, date, anomalous'

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
    structure: row.structure ?? null,
    durationSec: row.duration_sec,
    anomalous: row.anomalous ?? false,
  }
}

function obsToDb(obs, shipId) {
  const niveauKey = Object.keys(NIVEAUX).find((k) => NIVEAUX[k] === obs.niveau) || 'PASSIF'
  return {
    ship_id: shipId,
    type: obs.type,
    system_id: obs.system_id || null,
    system_display: obs.system ?? null,
    name: obs.name,
    state: obs.state ?? 'PENDING',
    niveau: niveauKey,
    coords: obs.coords ?? null,
    distance: obs.distance ?? null,
    support: obs.type === 'SIGNAL' ? (obs.support ?? 'EM_RADIO') : null,
    structure: obs.type === 'SIGNAL' ? (obs.structure ?? null) : null,
    duration_sec: obs.type === 'SIGNAL' ? (obs.durationSec ?? 72) : null,
    date: obs.date ?? null,
    anomalous: obs.type === 'SIGNAL' ? (obs.anomalous ?? false) : null,
  }
}

const FALLBACK_LIST = [
  { id: '1', name: 'HD44594-b · Atmosphère', type: 'ATMOSPHERE', system: 'HD 44594', system_id: 'HD44594', date: '2341-05-22', state: OBS_STATES.RUNNING, niveau: NIVEAUX.ORBITE, coords: '12.4, -3.1, 0.2', distance: '11,4 al' },
  { id: '2', name: 'Ross128 · Signal', type: 'SIGNAL', support: 'EM_RADIO', structure: 'non uniforme', system: 'Ross 128', system_id: 'ROSS128', date: '2341-03-15', state: OBS_STATES.DONE, niveau: NIVEAUX.PASSIF, coords: '11.0, 2.1, 0.5', distance: '10,9 al', durationSec: 72 },
  { id: '3', name: 'Proxima c · Corps planétaire', type: 'PLANETE', system: 'Proxima Centauri', system_id: 'PROXIMA', date: '2341-01-08', state: OBS_STATES.PENDING, niveau: NIVEAUX.SYSTEME, coords: '4.2, -1.1, 0.0', distance: '4,2 al' },
  { id: '4', name: 'GRB-2341-X7 · Signal', type: 'SIGNAL', support: 'GAMMA_X', structure: 'sursaut', system: 'Champ profond', system_id: null, date: '2341-04-12', state: OBS_STATES.PENDING, niveau: NIVEAUX.PASSIF, coords: '—', distance: '—', durationSec: 42 },
  { id: '5', name: 'PSR B1919+21 · Signal', type: 'SIGNAL', support: 'EM_RADIO', structure: 'pulsé régulier', system: 'PSR B1919', system_id: 'PSR_B1919', date: '2341-04-10', state: OBS_STATES.DONE, niveau: NIVEAUX.PASSIF, coords: '19.3, 21.6, 0.0', distance: '~2 kpc', durationSec: 72 },
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
      const hasGammaX = list.value.some((o) => o.type === 'SIGNAL' && o.support === 'GAMMA_X')
      if (!hasGammaX) {
        const grbDemo = FALLBACK_LIST.find((o) => o.support === 'GAMMA_X')
        if (grbDemo) list.value = [grbDemo, ...list.value]
      }
      return list.value
    }
    const shipStore = useShipStore()
    if (!shipStore.loaded) await shipStore.fetch()
    const shipId = shipStore.ship?.id
    const { data, error } = shipId
      ? await supabase
        .from('observations')
        .select(OBSERVATIONS_SELECT_COLUMNS)
        .eq('ship_id', shipId)
        .order('created_at', { ascending: false })
      : { data: [], error: null }
    if (error) {
      console.warn('[observations] Erreur fetch:', error.message)
      list.value = [...FALLBACK_LIST]
    } else {
      list.value = (data ?? []).map(dbToObs)
    }
    const hasGammaX = list.value.some((o) => o.type === 'SIGNAL' && o.support === 'GAMMA_X')
    if (!hasGammaX) {
      const grbDemo = FALLBACK_LIST.find((o) => o.support === 'GAMMA_X')
      if (grbDemo) list.value = [grbDemo, ...list.value]
    }
    loaded.value = true
    return list.value
  }

  function hasUnanalyzed() {
    return list.value.some(
      (o) => o.state === OBS_STATES_VAL.PENDING || o.state === OBS_STATES_VAL.RUNNING
    )
  }

  /** Trouve une observation SIGNAL correspondant au signal (même name = fréquence · azimut) */
  function findObservationForSignal(signal) {
    if (!signal) return null
    const expectedName = formatSignalObservationName(signal)
    return list.value.find(
      (o) => o.type === 'SIGNAL' && o.name === expectedName
    ) ?? null
  }

  /** Trouve une observation correspondant à un corps (body + star) */
  function findObservationForBody(body, star, bodyNameLabel) {
    if (!body || !star) return null
    const expectedName = `${body.name} · ${bodyNameLabel}`
    return list.value.find(
      (o) =>
        o.type === body.type &&
        o.system_id === star.id &&
        o.name === expectedName
    ) ?? null
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
      structure: obs.type === 'SIGNAL' ? (obs.structure ?? null) : undefined,
      durationSec: obs.type === 'SIGNAL' ? (obs.durationSec ?? 72) : undefined,
      anomalous: obs.type === 'SIGNAL' ? (obs.anomalous ?? false) : undefined,
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

    const shipStore = useShipStore()
    if (!shipStore.loaded) await shipStore.fetch()
    const shipId = shipStore.ship?.id
    const { data, error } = shipId
      ? await supabase
        .from('observations')
        .insert(obsToDb(payload, shipId))
        .select(OBSERVATIONS_SELECT_COLUMNS)
        .single()
      : { data: null, error: { message: 'Aucun vaisseau' } }

    if (error) {
      console.warn('[observations] Erreur insert:', error.message)
      const id = String(Date.now())
      list.value.unshift({ id, ...payload, state: OBS_STATES.PENDING })
      return id
    }
    const item = { ...dbToObs(data), anomalous: payload.anomalous }
    list.value = [item, ...list.value]
    return item.id
  }

  async function removeObservation(id) {
    const previous = list.value
    list.value = list.value.filter((o) => o.id !== id)
    const supabaseStore = useSupabaseStore()
    if (supabaseStore.isConfigured()) {
      const { error } = await supabase.from('observations').delete().eq('id', id)
      if (error) {
        console.warn('[observations] Erreur delete:', error.message)
        list.value = previous
      }
    }
  }

  async function updateObservationState(id, state) {
    const obs = list.value.find((o) => o.id === id)
    const previousState = obs?.state
    if (obs) obs.state = state
    const supabaseStore = useSupabaseStore()
    if (supabaseStore.isConfigured()) {
      const { error } = await supabase.from('observations').update({ state }).eq('id', id)
      if (error) {
        console.warn('[observations] Erreur update state:', error.message)
        if (obs) obs.state = previousState
      }
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
    findObservationForSignal,
    findObservationForBody,
    OBS_STATES,
    NIVEAUX,
  }
})
