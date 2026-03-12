/**
 * Store Signaux — signaux captés par le récepteur (panel gauche Observatoire)
 * Branché sur table signals (fetch + INSERT). Fallback mémoire si Supabase non configuré.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useShipStore } from '@/stores/ship'
import { getOrCreateSessionId } from '@/lib/session'
import { formatFrequency, parseFrequency } from '@/lib/formatUtils'

const LIFETIME_MS = 2 * 60 * 60 * 1000 // 2h temps joueur par défaut

const FALLBACK_LIST = [
  { frequency: '1420 MHz', azimuth: 217, elevation: 12, distanceEst: '~340 al', receivedAt: '2341-04-12', durationSec: 72, polarization: 'circulaire', structure: 'non uniforme', support: 'EM_RADIO' },
  { frequency: '408 MHz', azimuth: 89, elevation: -5, distanceEst: null, receivedAt: '2341-04-11', durationSec: 120, polarization: 'linéaire', structure: 'pulsé', support: 'EM_RADIO' },
  { frequency: '1420.4058 MHz', azimuth: 271, elevation: 18, distanceEst: null, receivedAt: '2341-04-14', durationSec: 72, polarization: 'linéaire', structure: 'pulsé régulier', anomalous: true, support: 'EM_RADIO' },
]

function dbToSignal(row) {
  const att = row.attributes ?? {}
  const capturedAt = row.captured_at ? new Date(row.captured_at).getTime() : Date.now()
  const receivedAt = att.receivedAt ?? `2341-${new Date(row.captured_at).toISOString().slice(5, 10)}`
  return {
    id: row.id,
    frequency: formatFrequency(row.frequency_hz) || att.frequency || '1420 MHz',
    azimuth: att.azimuth ?? 0,
    elevation: att.elevation ?? 0,
    distanceEst: att.distanceEst ?? null,
    receivedAt,
    durationSec: row.duration_sec ?? 72,
    polarization: att.polarization ?? 'circulaire',
    structure: att.structure ?? 'non uniforme',
    anomalous: att.anomalous ?? false,
    support: row.support ?? 'EM_RADIO',
    createdAt: capturedAt,
    lifetimeMs: LIFETIME_MS,
  }
}

function signalToDb(payload, sessionId, shipId) {
  const att = {
    azimuth: payload.azimuth ?? 0,
    elevation: payload.elevation ?? 0,
    distanceEst: payload.distanceEst ?? null,
    polarization: payload.polarization ?? 'circulaire',
    structure: payload.structure ?? 'non uniforme',
    anomalous: payload.anomalous ?? false,
    receivedAt: payload.receivedAt ?? null,
  }
  return {
    source_type: 'UNKNOWN',
    source_object_id: null,
    source_event_id: null,
    session_id: sessionId,
    ship_id: shipId ?? null,
    frequency_hz: parseFrequency(payload.frequency),
    support: payload.support ?? 'EM_RADIO',
    duration_sec: payload.durationSec ?? 72,
    attributes: att,
  }
}

function createSignal(payload) {
  const id = `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const createdAt = Date.now()
  const receivedAt = payload.receivedAt ?? `2341-${new Date().toISOString().slice(5, 10)}`
  return {
    id,
    frequency: payload.frequency ?? '1420 MHz',
    azimuth: payload.azimuth ?? 0,
    elevation: payload.elevation ?? 0,
    distanceEst: payload.distanceEst ?? null,
    receivedAt,
    durationSec: payload.durationSec ?? 72,
    polarization: payload.polarization ?? 'circulaire',
    structure: payload.structure ?? 'non uniforme',
    anomalous: payload.anomalous ?? false,
    support: payload.support ?? 'EM_RADIO',
    createdAt,
    lifetimeMs: payload.lifetimeMs ?? LIFETIME_MS,
  }
}

export const useSignauxStore = defineStore('signaux', () => {
  const list = ref([])
  const loaded = ref(false)

  const listWithRemaining = computed(() => {
    const now = Date.now()
    return list.value.map((s) => {
      const elapsed = now - s.createdAt
      const remaining = Math.max(0, s.lifetimeMs - elapsed)
      const pct = s.lifetimeMs > 0 ? (remaining / s.lifetimeMs) * 100 : 0
      return { ...s, remainingMs: remaining, lifetimePct: pct }
    })
  })

  async function cloneSeedDemoSignals(sessionId, shipId) {
    const { data: demo } = await supabase
      .from('signals')
      .select('*')
      .eq('session_id', 'seed-demo')
      .limit(5)
    if (!demo?.length) return []
    const cloned = []
    for (const row of demo) {
      const copy = {
        source_type: row.source_type,
        source_object_id: row.source_object_id,
        source_event_id: row.source_event_id,
        session_id: sessionId,
        ship_id: shipId,
        frequency_hz: row.frequency_hz,
        support: row.support,
        duration_sec: row.duration_sec,
        attributes: row.attributes ?? {},
      }
      const { data, err } = await supabase.from('signals').insert(copy).select('id, frequency_hz, support, duration_sec, captured_at, attributes').single()
      if (!err && data) cloned.push(dbToSignal(data))
    }
    return cloned
  }

  async function fetch() {
    const supabaseStore = useSupabaseStore()
    const shipStore = useShipStore()
    if (!supabaseStore.isConfigured()) {
      if (list.value.length === 0) {
        list.value = FALLBACK_LIST.map((p) => createSignal(p))
      }
      loaded.value = true
      return list.value
    }
    const sessionId = getOrCreateSessionId()
    const { data, error } = await supabase
      .from('signals')
      .select('id, source_type, source_object_id, source_event_id, frequency_hz, support, duration_sec, captured_at, attributes')
      .eq('session_id', sessionId)
      .order('captured_at', { ascending: false })
    if (error) {
      console.warn('[signaux] Erreur fetch:', error.message)
      if (list.value.length === 0) list.value = FALLBACK_LIST.map((p) => createSignal(p))
    } else {
      list.value = (data ?? []).map(dbToSignal)
      if (list.value.length === 0) {
        const cloned = await cloneSeedDemoSignals(sessionId, shipStore.ship?.id ?? null)
        if (cloned.length) list.value = cloned
      }
    }
    loaded.value = true
    return list.value
  }

  async function addSignal(payload) {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      const signal = createSignal(payload)
      list.value.push(signal)
      return signal.id
    }
    const sessionId = getOrCreateSessionId()
    const shipStore = useShipStore()
    const shipId = shipStore.ship?.id ?? null
    const row = signalToDb(payload, sessionId, shipId)
    const { data, error } = await supabase.from('signals').insert(row).select('id, frequency_hz, support, duration_sec, captured_at, attributes').single()
    if (error) {
      console.warn('[signaux] Erreur insert:', error.message)
      const signal = createSignal(payload)
      list.value.push(signal)
      return signal.id
    }
    const signal = dbToSignal(data)
    list.value.unshift(signal)
    return signal.id
  }

  function removeSignal(id) {
    list.value = list.value.filter((s) => s.id !== id)
    const supabaseStore = useSupabaseStore()
    if (supabaseStore.isConfigured() && /^[0-9a-f-]{36}$/i.test(id)) {
      supabase.from('signals').delete().eq('id', id).then(() => {}).catch((e) => console.warn('[signaux] Erreur delete:', e?.message))
    }
  }

  function removeExpired() {
    const now = Date.now()
    list.value = list.value.filter((s) => now - s.createdAt < s.lifetimeMs)
  }

  /** Capture les signaux des objets émetteurs (system_objects) du système courant */
  async function captureFromSystemObjects() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) return []
    const shipStore = useShipStore()
    const systemId = shipStore.currentSystemId || 'SOL'
    const sessionId = getOrCreateSessionId()
    const shipId = shipStore.ship?.id ?? null
    const { data: objects, error: objErr } = await supabase
      .from('system_objects')
      .select('id, name, system_id, emission_support, emission_frequency_hz')
      .eq('system_id', systemId)
      .eq('emits_signals', true)
    if (objErr || !objects?.length) return []
    const { data: existing } = await supabase
      .from('signals')
      .select('source_object_id')
      .eq('session_id', sessionId)
      .eq('source_type', 'OBJECT')
    const existingIds = new Set((existing ?? []).map((r) => r.source_object_id).filter(Boolean))
    const { data: sys } = await supabase
      .from('stellar_systems')
      .select('coordinates')
      .eq('id', systemId)
      .single()
    const coord = sys?.coordinates ?? { ra: 0, dec: 0 }
    const azimuth = Number(coord.ra ?? coord.x ?? 0)
    const elevation = Number(coord.dec ?? coord.y ?? 0)
    const receivedAt = `2341-${new Date().toISOString().slice(5, 10)}`
    const inserted = []
    for (const obj of objects) {
      if (existingIds.has(obj.id)) continue
      const freqHz = obj.emission_frequency_hz
      const freqHzStored = freqHz != null && freqHz < 1e3 ? 1420e6 : (freqHz ?? 1420e6)
      const row = {
        source_type: 'OBJECT',
        source_object_id: obj.id,
        source_event_id: null,
        session_id: sessionId,
        ship_id: shipId,
        frequency_hz: freqHzStored,
        support: obj.emission_support ?? 'EM_RADIO',
        duration_sec: 72,
        attributes: { azimuth, elevation, receivedAt, sourceName: obj.name },
      }
      const { data, err } = await supabase.from('signals').insert(row).select('id, frequency_hz, support, duration_sec, captured_at, attributes').single()
      if (!err && data) {
        existingIds.add(obj.id)
        inserted.push(dbToSignal(data))
      }
    }
    if (inserted.length) list.value = [...inserted, ...list.value]
    return inserted
  }

  return {
    list,
    listWithRemaining,
    loaded,
    fetch,
    addSignal,
    removeSignal,
    removeExpired,
    captureFromSystemObjects,
  }
})
