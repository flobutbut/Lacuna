/**
 * Store Signaux — signaux captés par le récepteur (panel gauche Observatoire)
 * Branché sur table signals, filtrée par vaisseau du joueur (ship_id). Fallback mémoire si Supabase non configuré.
 * Les signaux de démo d'un nouveau joueur sont copiés par start_new_game.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useShipStore } from '@/stores/ship'
import { useRadarStore } from '@/stores/radar'
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
  const distanceEst = att.distanceEst ?? (att.distance_al != null ? `~${att.distance_al} al` : null)
  return {
    id: row.id,
    frequency: formatFrequency(row.frequency_hz) || att.frequency || '1420 MHz',
    sourceName: att.sourceName ?? null,
    azimuth: att.azimuth ?? 0,
    elevation: att.elevation ?? 0,
    distanceEst,
    receivedAt,
    durationSec: row.duration_sec ?? 72,
    polarization: att.polarization ?? 'circulaire',
    structure: att.structure ?? 'non uniforme',
    anomalous: att.anomalous ?? false,
    support: row.support ?? 'EM_RADIO',
    createdAt: capturedAt,
    lifetimeMs: LIFETIME_MS,
    sourceType: row.source_type ?? 'UNKNOWN',
    band: att.band ?? null,
    fluxRelative: att.flux_relative ?? null,
    pulsePeriodS: att.pulse_period_s ?? null,
    rotationFrequencyHz: att.rotation_frequency_hz
      ? Number(att.rotation_frequency_hz)
      : null,
    isPeriodic: att.is_periodic ?? false,
    sourceSystemId: row.source_system_id ?? null,
    frequencyHz: row.frequency_hz
      ? Number(row.frequency_hz)
      : null,
  }
}

function signalToDb(payload, shipId) {
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
    ship_id: shipId,
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
    sourceName: payload.sourceName ?? null,
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
    const mapped = list.value.map((s) => {
      const elapsed = now - s.createdAt
      const remaining = Math.max(0, s.lifetimeMs - elapsed)
      const pct = s.lifetimeMs > 0 ? (remaining / s.lifetimeMs) * 100 : 0
      return { ...s, remainingMs: remaining, lifetimePct: pct }
    })
    const activeBand = useRadarStore().radarFrequencyBand
    const filtered = mapped.filter((s) => !s.band || s.band === activeBand)
    if (import.meta.env.DEV) {
      console.log('[signaux:listWithRemaining]', {
        activeBand,
        total: mapped.length,
        withBand: mapped.filter((s) => s.band != null).length,
        visible: filtered.length,
      })
    }
    return filtered
  })

  const activePulsarSignals = computed(() =>
    list.value.filter(s =>
      s.sourceType === 'PULSAR' &&
      s.fluxRelative != null &&
      s.frequencyHz != null
    )
  )

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
    if (!shipStore.loaded) await shipStore.fetch()
    const shipId = shipStore.ship?.id
    if (!shipId) {
      list.value = []
      loaded.value = true
      return list.value
    }
    const { data, error } = await supabase
      .from('signals')
      .select('id, source_type, source_object_id, source_event_id, source_system_id, frequency_hz, support, duration_sec, captured_at, attributes')
      .eq('ship_id', shipId)
      .order('captured_at', { ascending: false })
    if (error) {
      console.warn('[signaux] Erreur fetch:', error.message)
      if (list.value.length === 0) list.value = FALLBACK_LIST.map((p) => createSignal(p))
    } else {
      list.value = (data ?? []).map(dbToSignal)
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
    const shipStore = useShipStore()
    const shipId = shipStore.ship?.id
    if (!shipId) {
      const signal = createSignal(payload)
      list.value.push(signal)
      return signal.id
    }
    const row = signalToDb(payload, shipId)
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
      supabase
        .from('signals')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.warn('[signaux] Erreur delete:', error.message)
        })
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
    const shipId = shipStore.ship?.id
    if (!shipId) return []
    const { data: objects, error: objErr } = await supabase
      .from('system_objects')
      .select('id, name, system_id, emission_support, emission_frequency_hz')
      .eq('system_id', systemId)
      .eq('emits_signals', true)
    if (objErr || !objects?.length) return []
    const { data: existing } = await supabase
      .from('signals')
      .select('source_object_id')
      .eq('ship_id', shipId)
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
        ship_id: shipId,
        frequency_hz: freqHzStored,
        support: obj.emission_support ?? 'EM_RADIO',
        duration_sec: 72,
        attributes: { azimuth, elevation, receivedAt, sourceName: obj.name },
      }
      const { data, error } = await supabase.from('signals').insert(row).select('id, frequency_hz, support, duration_sec, captured_at, attributes').single()
      if (error) {
        console.warn('[signaux] Erreur insert signal objet:', error.message)
      } else if (data) {
        existingIds.add(obj.id)
        inserted.push(dbToSignal(data))
      }
    }
    if (inserted.length) list.value = [...inserted, ...list.value]
    return inserted
  }

  /** Calcule côté base les signaux pulsars visibles dans la bande (RPC), puis recharge la liste si besoin */
  async function computePulsarSignals(band = 'L') {
    const shipStore = useShipStore()
    const shipId = shipStore.ship?.id
    if (!shipId) return
    const { data, error } = await supabase.rpc('compute_pulsar_signals', { p_ship_id: shipId, p_band: band })
    if (error) {
      console.warn('[signaux] compute_pulsar_signals:', error.message)
      return
    }
    if (data?.inserted > 0) {
      await fetch()
    }
  }

  return {
    computePulsarSignals,
    list,
    listWithRemaining,
    activePulsarSignals,
    loaded,
    fetch,
    addSignal,
    removeSignal,
    removeExpired,
    captureFromSystemObjects,
  }
})
