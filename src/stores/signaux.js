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
import { useObservatoireStore } from '@/stores/observatoire'
import { pulsarsInBeam } from '@/lib/radarSpectrum'
import { formatFrequency, parseFrequency } from '@/lib/formatUtils'
import { parseSignalWindow } from '@/lib/signalWindow'
import { parseLpt, lptPulse } from '@/lib/lpt'
import { START_PULSARS } from '@/lib/startSources'

const LIFETIME_MS = 2 * 60 * 60 * 1000 // 2h temps joueur par défaut

const FALLBACK_LIST = [
  { frequency: '1420 MHz', azimuth: 217, elevation: 12, distanceEst: '~340 al', receivedAt: '2341-04-12', durationSec: 72, polarization: 'circulaire', structure: 'non uniforme', support: 'EM_RADIO' },
  { frequency: '408 MHz', azimuth: 89, elevation: -5, distanceEst: null, receivedAt: '2341-04-11', durationSec: 120, polarization: 'linéaire', structure: 'pulsé', support: 'EM_RADIO' },
  { frequency: '1420.4058 MHz', azimuth: 271, elevation: 18, distanceEst: null, receivedAt: '2341-04-14', durationSec: 72, polarization: 'linéaire', structure: 'pulsé régulier', anomalous: true, support: 'EM_RADIO' },
]

function dbToSignal(row) {
  const att = row.attributes ?? {}
  const capturedAt = row.captured_at ? new Date(row.captured_at).getTime() : Date.now()
  // Émetteur du système courant : présent tant que le vaisseau y est, jamais retiré à l'analyse
  const persistent = row.source_type === 'EMITTER'
  // Signal de 22 minutes (LPT-001) : reste dans la liste et accumule ses impulsions
  const lpt = parseLpt(att.lpt)
  const receivedAt = att.receivedAt ?? `2341-${new Date(row.captured_at).toISOString().slice(5, 10)}`
  const distanceEst = att.distanceEst ?? (att.distance_al != null ? `~${att.distance_al} al` : null)
  return {
    id: row.id,
    // Un détecteur de neutrinos compte des événements : pas de fréquence
    // Sans fréquence en base (signal large bande, LPT-001) : le libellé stocké dans les attributs
    frequency: row.support === 'NEUTRINO'
      ? 'Neutrinos'
      : (row.frequency_hz == null && att.frequency) || formatFrequency(row.frequency_hz) || att.frequency || '1420 MHz',
    sourceName: att.sourceName ?? null,
    azimuth: att.azimuth ?? 0,
    elevation: att.elevation ?? 0,
    distanceEst,
    receivedAt,
    durationSec: lpt ? lptPulse(lpt, lpt.firstK).durationS : (row.duration_sec ?? 72),
    polarization: att.polarization ?? 'circulaire',
    structure: att.structure ?? 'non uniforme',
    anomalous: att.anomalous ?? false,
    support: row.support ?? 'EM_RADIO',
    createdAt: capturedAt,
    lifetimeMs: persistent || lpt ? Infinity : (Number(att.lifetime_ms) || LIFETIME_MS),
    persistent,
    lpt,
    lptRaw: att.lpt ?? null,
    window: parseSignalWindow(att.window),
    neutrino: att.neutrino ?? null,
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
    frequency: payload.support === 'NEUTRINO' ? 'Neutrinos' : (payload.frequency ?? '1420 MHz'),
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
    neutrino: payload.neutrino ?? null,
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

  /**
   * Sources captées par le radar, dans la bande active : pulsars dans le faisceau pointé vers la direction de la vue ciel
   * (chacun avec son gain `beamGain`), et émetteurs du système courant
   */
  const activePulsarSignals = computed(() => {
    const activeBand = useRadarStore().radarFrequencyBand
    // Pulsars captés, plus ceux du ciel de départ (PSR B1919+21), qui émettent même sans signal dans la liste
    const bandPulsars = [...list.value, ...START_PULSARS].filter(s =>
      s.sourceType === 'PULSAR' &&
      s.band === activeBand &&
      s.fluxRelative != null &&
      s.frequencyHz != null
    )
    const pulsarsInView = pulsarsInBeam(bandPulsars, useObservatoireStore().viewDirection, activeBand)
    // Émetteurs du système où se trouve le vaisseau : pas de direction à viser, gain de faisceau plein
    const systemId = useShipStore().currentSystemId
    const emitters = list.value
      .filter(s =>
        s.sourceType === 'EMITTER' &&
        s.sourceSystemId === systemId &&
        s.band === activeBand &&
        s.pulsePeriodS > 0 &&
        s.fluxRelative != null &&
        s.frequencyHz != null
      )
      .map(s => ({ ...s, beamGain: 1 }))
    return [...pulsarsInView, ...emitters]
  })

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

  /** Capture côté base les émetteurs du système courant (RPC capture_system_signals), puis recharge la liste si besoin */
  async function captureSystemEmitters() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) return
    const { data, error } = await supabase.rpc('capture_system_signals')
    if (error) {
      console.warn('[signaux] capture_system_signals:', error.message)
      return
    }
    if (data?.inserted > 0) {
      await fetch()
    }
  }

  /** Capte côté base la bouffée de neutrinos de la supernova, une fois son T0 passé (RPC capture_supernova_neutrinos) */
  async function captureSupernovaNeutrinos() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) return
    const { data, error } = await supabase.rpc('capture_supernova_neutrinos')
    if (error) {
      console.warn('[signaux] capture_supernova_neutrinos:', error.message)
      return
    }
    if (data?.inserted > 0) {
      await fetch()
    }
  }

  /**
   * Capte côté base la première impulsion de LPT-001 (RPC capture_lpt_signal), recharge la liste si besoin.
   * @returns {Promise<number|null>} Heure (ms) de la première impulsion si elle n'est pas encore arrivée
   */
  async function captureLptSignal() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) return null
    const { data, error } = await supabase.rpc('capture_lpt_signal')
    if (error) {
      console.warn('[signaux] capture_lpt_signal:', error.message)
      return null
    }
    if (data?.inserted > 0) {
      await fetch()
      return null
    }
    const firstAt = Date.parse(data?.first_at)
    return Number.isFinite(firstAt) && firstAt > Date.now() ? firstAt : null
  }

  /** Signal de 22 minutes (LPT-001), s'il a été capté */
  const lptSignal = computed(() => list.value.find((s) => s.lpt) ?? null)

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
    captureSystemEmitters,
    captureSupernovaNeutrinos,
    captureLptSignal,
    lptSignal,
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
