/**
 * Store Vaisseau — chargement depuis Supabase
 * Prototype : vaisseau avec user_id NULL (policy Anon can read)
 * Données techniques : table ship_systems (systèmes, carburant, capacités)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useStellarSystemsStore } from '@/stores/stellarSystems'

export const useShipStore = defineStore('ship', () => {
  const ship = ref(null)
  const shipSystems = ref(null)
  const population = ref(null)
  /** Historique des voyages (ship_travels) — ordre chronologique des visites */
  const travels = ref([])
  const loaded = ref(false)
  const nowTick = ref(Date.now())
  let transitIntervalId = null
  // Ratios simplifiés des phases de transit — alignés grossièrement sur computeTransit
  const PHASE_ACCEL_END = 0.4
  const PHASE_COAST_END = 0.6
  const PHASE_TURN_END = 0.7

  const currentSystemId = computed(() => ship.value?.current_system_id ?? 'SOL')
  const travelState = computed(() => ship.value?.travel_state ?? 'IDLE')
  const isInTransit = computed(() => travelState.value === 'IN_TRANSIT')
  const travelDepartureAt = computed(() => ship.value?.travel_departure_at ?? null)
  const travelArrivalAt = computed(() => ship.value?.travel_arrival_at ?? null)
  const travelDestination = computed(() => ship.value?.travel_destination ?? null)

  const transitProgress = computed(() => {
    if (!isInTransit.value || !travelDepartureAt.value || !travelArrivalAt.value) return 0
    const start = new Date(travelDepartureAt.value).getTime()
    const end = new Date(travelArrivalAt.value).getTime()
    const now = nowTick.value
    if (!start || !end || end <= start) return 0
    const ratio = (now - start) / (end - start)
    if (ratio <= 0) return 0
    if (ratio >= 1) return 1
    return ratio
  })

  const currentTransitPhase = computed(() => {
    if (!isInTransit.value) return null
    const p = transitProgress.value
    if (p <= PHASE_ACCEL_END) return 'ACCELERATING'
    if (p <= PHASE_COAST_END) return 'COASTING'
    if (p <= PHASE_TURN_END) return 'TURNING'
    return 'DECELERATING'
  })

  const name = computed(() => ship.value?.name ?? 'ARCA')
  const classe = computed(() => ship.value?.classe ?? 'Vaisseau générationnel de classe I')
  const builtYear = computed(() => ship.value?.built_year ?? null)
  const voyage = computed(() => ship.value?.voyage ?? 1)
  const generation = computed(() => ship.value?.generation ?? 1)

  // Format legacy pour PageSystemes (propulsion, hull, plasmaShield, etc.)
  const systems = computed(() => {
    const s = shipSystems.value
    if (!s) return {}
    return {
      propulsion: s.propulsion,
      hull: s.hull,
      plasmaShield: s.plasma_shield,
      observatory: s.observatory,
      reservoir: s.reservoir,
      alimentation: s.alimentation,
      atmosphere: s.atmosphere,
      medical: s.medical,
    }
  })

  // Format legacy (ratios 0–1)
  const fuel = computed(() => {
    const s = shipSystems.value
    if (!s || !s.he3_max || !s.deuterium_max) return { he3: 0.742, deuterium: 0.81 }
    return {
      he3: s.he3_max ? Number(s.he3_current) / Number(s.he3_max) : 0.742,
      deuterium: s.deuterium_max ? Number(s.deuterium_current) / Number(s.deuterium_max) : 0.81,
    }
  })

  const dryMass = computed(() => shipSystems.value?.dry_mass ?? 800000)
  const capacity = computed(() => shipSystems.value?.capacity ?? 12000)

  function ensureTransitInterval() {
    if (transitIntervalId || !isInTransit.value || !travelArrivalAt.value) return
    transitIntervalId = window.setInterval(() => {
      nowTick.value = Date.now()
      const arrival = new Date(travelArrivalAt.value).getTime()
      if (!arrival) return
      if (Date.now() >= arrival) {
        window.clearInterval(transitIntervalId)
        transitIntervalId = null
        completeTransit().catch((err) => {
          console.warn('[ship] completeTransit error', err)
        })
      }
    }, 500)
  }

  async function startTransit(destinationId, distanceAl, transitMeta) {
    if (!destinationId) {
      console.warn('[ship] startTransit appelé sans destination')
      return null
    }
    if (!ship.value) {
      console.warn('[ship] startTransit sans vaisseau chargé')
      return null
    }

    const supabaseStore = useSupabaseStore()
    const hasSupabase = supabaseStore.isConfigured()

    const distance = parseFloat(distanceAl) || 0
    const tJoueurSec = transitMeta?.tJoueurSec ?? 0
    // Par défaut : mode test 5s pour Proxima (5 / 3600 ≈ 0.00138889)
    const baseScale = 5 / 3600
    const envScale = Number(import.meta.env.VITE_TRANSIT_TIME_SCALE ?? baseScale)
    const scale = Number.isFinite(envScale) && envScale > 0 ? envScale : baseScale

    const durationMs = Math.max(1000, Math.round(tJoueurSec * 1000 * scale))
    const departure = new Date()
    const arrival = new Date(departure.getTime() + durationMs)

    const updates = {
      travel_state: 'IN_TRANSIT',
      travel_destination: destinationId,
      travel_departure_at: departure.toISOString(),
      travel_arrival_at: arrival.toISOString(),
      // NOTE: distance non stockée en base pour l’instant (pas de colonne dédiée)
    }

    // S'assurer que la destination est présente dans le store des systèmes
    const stellarStore = useStellarSystemsStore()
    if (!stellarStore.list.find((s) => s.id === destinationId)) {
      try {
        await stellarStore.fetch()
      } catch (e) {
        console.warn('[ship] startTransit — unable to ensure destination in stellarSystemsStore', e)
      }
    }

    if (hasSupabase) {
      const { data, error } = await supabase
        .from('ships')
        .update(updates)
        .eq('id', ship.value.id)
        .select('id, name, classe, built_year, voyage, generation, current_system_id, travel_state, travel_destination, travel_departure_at, travel_arrival_at')
        .single()

      if (error) {
        console.warn('[ship] startTransit — fallback local (Supabase error)', error.message)
        // Fallback local : on applique quand même le transit côté client
        ship.value = {
          ...ship.value,
          ...updates,
        }
      } else {
        ship.value = data
      }
    } else {
      // Mode déconnecté : on modifie seulement l'état local
      ship.value = {
        ...ship.value,
        ...updates,
      }
    }
    nowTick.value = Date.now()
    ensureTransitInterval()
    return ship.value
  }

  async function completeTransit() {
    if (!travelDestination.value) return null
    if (!ship.value) return null

    const supabaseStore = useSupabaseStore()
    const hasSupabase = supabaseStore.isConfigured()

    const originSystemId = ship.value.current_system_id
    const destinationSystemId = travelDestination.value
    const departureAt = ship.value.travel_departure_at
    const arrivalAt = new Date().toISOString()

    const updates = {
      current_system_id: destinationSystemId,
      travel_state: 'IDLE',
      travel_destination: null,
      travel_departure_at: null,
      travel_arrival_at: null,
      voyage: (ship.value.voyage ?? 0) + 1,
    }

    if (hasSupabase) {
      const { data, error } = await supabase
        .from('ships')
        .update(updates)
        .eq('id', ship.value.id)
        .select('id, name, classe, built_year, voyage, generation, current_system_id, travel_state, travel_destination, travel_departure_at, travel_arrival_at')
        .single()

      if (error) {
        console.warn('[ship] completeTransit — fallback local (Supabase error)', error.message)
        ship.value = {
          ...ship.value,
          ...updates,
        }
      } else {
        ship.value = data
        // Historique des voyages — insertion dans ship_travels
        const { error: insertError } = await supabase.from('ship_travels').insert({
          ship_id: ship.value.id,
          voyage_number: ship.value.voyage,
          origin_system_id: originSystemId,
          destination_system_id: destinationSystemId,
          departure_at: departureAt ?? arrivalAt,
          arrival_at: arrivalAt,
        })
        if (insertError) {
          console.warn('[ship] completeTransit — unable to insert ship_travels', insertError.message)
        }
      }
    } else {
      ship.value = {
        ...ship.value,
        ...updates,
      }
    }
    return ship.value
  }

  /** Charge l'historique des voyages (ship_travels) pour le vaisseau courant — ordre chronologique. */
  async function fetchTravels() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured() || !ship.value?.id) {
      travels.value = []
      return []
    }
    const { data, error } = await supabase
      .from('ship_travels')
      .select('origin_system_id, destination_system_id, arrival_at')
      .eq('ship_id', ship.value.id)
      .order('arrival_at', { ascending: true })
    if (error) {
      console.warn('[ship] fetchTravels:', error.message)
      travels.value = []
      return []
    }
    travels.value = Array.isArray(data) ? data : []
    return travels.value
  }

  async function fetch() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      loaded.value = true
      return null
    }
    const { data: ships, error } = await supabase
      .from('ships')
      .select('id, name, classe, built_year, voyage, generation, current_system_id, travel_state, travel_destination, travel_departure_at, travel_arrival_at')
      .is('user_id', null)
      .limit(1)
    if (error) {
      console.warn('[ship]', error.message)
      loaded.value = true
      return null
    }
    ship.value = ships?.[0] ?? null
    if (ship.value) {
      const [{ data: sys }, { data: pops }] = await Promise.all([
        supabase.from('ship_systems').select('*').eq('ship_id', ship.value.id).limit(1),
        supabase.from('populations').select('total, generation, average_age, birth_rate, will, social_cohesion, food_supply, medical_care, culture, governance').eq('ship_id', ship.value.id).limit(1),
      ])
      shipSystems.value = sys?.[0] ?? null
      population.value = pops?.[0] ?? null
    } else {
      shipSystems.value = null
      population.value = null
    }
    loaded.value = true
    if (ship.value && ship.value.travel_state === 'IN_TRANSIT') {
      nowTick.value = Date.now()
      ensureTransitInterval()
    }
    return ship.value
  }

  return {
    ship,
    shipSystems,
    population,
    loaded,
    currentSystemId,
    travelState,
    isInTransit,
    travelDepartureAt,
    travelArrivalAt,
    travelDestination,
    transitProgress,
    systems,
    fuel,
    dryMass,
    capacity,
    name,
    classe,
    builtYear,
    voyage,
    generation,
    startTransit,
    completeTransit,
    fetch,
    travels,
    fetchTravels,
  }
})
