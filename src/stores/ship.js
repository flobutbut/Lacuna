/**
 * Store Vaisseau — chargement depuis Supabase
 * Vaisseau du joueur connecté (ships.user_id = auth.uid()), créé par start_new_game
 * Données techniques : table ship_systems (systèmes, carburant, capacités)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useAuthStore } from '@/stores/auth'
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
  // Délai avant de redemander l'arrivée si l'horloge du serveur n'y est pas encore
  const COMPLETE_RETRY_MS = 2000
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
  /** Bouffée de neutrinos de la supernova de Bételgeuse pour cette partie (src/lib/supernova.js) */
  const supernovaT0 = computed(() => ship.value?.supernova_t0 ?? null)
  /** Création de la partie (ms), null si inconnue */
  const gameStartMs = computed(() => {
    const t = Date.parse(ship.value?.created_at)
    return Number.isFinite(t) ? t : null
  })

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

  /**
   * Lance le transit vers un système (RPC start_transit) : distance, durée et heure
   * d'arrivée sont fixées par le serveur. Renvoie le vaisseau, ou null en cas d'échec.
   */
  async function startTransit(destinationId) {
    if (!destinationId || !ship.value) return null

    // S'assurer que la destination est présente dans le store des systèmes
    const stellarStore = useStellarSystemsStore()
    if (!stellarStore.list.find((s) => s.id === destinationId)) {
      try {
        await stellarStore.fetch()
      } catch (e) {
        console.warn('[ship] startTransit — unable to ensure destination in stellarSystemsStore', e)
      }
    }

    const { data, error } = await supabase.rpc('start_transit', { p_destination: destinationId })
    if (error) {
      console.warn('[ship] startTransit:', error.message)
      return null
    }
    ship.value = data
    nowTick.value = Date.now()
    ensureTransitInterval()
    return ship.value
  }

  /**
   * Termine le transit (RPC complete_transit). Le serveur refuse une arrivée avant
   * l'heure prévue selon son horloge : le vaisseau revient alors inchangé, on réessaie.
   */
  async function completeTransit() {
    if (!isInTransit.value) return null
    const { data, error } = await supabase.rpc('complete_transit')
    if (error) throw error
    ship.value = data
    if (isInTransit.value) {
      window.setTimeout(() => ensureTransitInterval(), COMPLETE_RETRY_MS)
    } else {
      fetchTravels()
    }
    return ship.value
  }

  /**
   * Renomme le vaisseau du joueur (2 à 32 caractères, contrainte SQL ships_name_length).
   * Lève l'erreur Supabase en cas d'échec.
   */
  async function renameShip(newName) {
    const name = (newName ?? '').trim()
    if (!ship.value?.id) throw new Error('Aucun vaisseau chargé')
    const { data, error } = await supabase.from('ships').update({ name }).eq('id', ship.value.id).select('name').single()
    if (error) throw error
    ship.value = { ...ship.value, name: data.name }
    return data.name
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

  let fetchPromise = null

  /** Charge le vaisseau du joueur ; les appels simultanés partagent le même chargement */
  function fetch() {
    if (!fetchPromise) fetchPromise = loadShip().finally(() => { fetchPromise = null })
    return fetchPromise
  }

  async function loadShip() {
    const supabaseStore = useSupabaseStore()
    // Le header peut demander le vaisseau avant que la garde du routeur ait chargé la session
    const authStore = useAuthStore()
    await authStore.init()
    const userId = authStore.user?.id
    if (!supabaseStore.isConfigured() || !userId) {
      loaded.value = true
      return null
    }
    const { data: ships, error } = await supabase
      .from('ships')
      .select('id, name, classe, built_year, voyage, generation, current_system_id, travel_state, travel_destination, travel_departure_at, travel_arrival_at, supernova_t0, created_at')
      .eq('user_id', userId)
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
    renameShip,
    loaded,
    currentSystemId,
    travelState,
    isInTransit,
    travelDepartureAt,
    travelArrivalAt,
    travelDestination,
    supernovaT0,
    gameStartMs,
    transitProgress,
    currentTransitPhase,
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
