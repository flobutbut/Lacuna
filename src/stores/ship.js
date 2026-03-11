/**
 * Store Vaisseau — chargement depuis Supabase
 * Prototype : vaisseau avec user_id NULL (policy Anon can read)
 * Données techniques : table ship_systems (systèmes, carburant, capacités)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

export const useShipStore = defineStore('ship', () => {
  const ship = ref(null)
  const shipSystems = ref(null)
  const population = ref(null)
  const loaded = ref(false)

  const currentSystemId = computed(() => ship.value?.current_system_id ?? 'SOL')
  const travelState = computed(() => ship.value?.travel_state ?? 'IDLE')
  const name = computed(() => ship.value?.name ?? 'ARCA')
  const classe = computed(() => ship.value?.classe ?? 'Vaisseau générationnel de classe I')
  const builtYear = computed(() => ship.value?.built_year ?? null)
  const voyage = computed(() => ship.value?.voyage ?? 1)
  const generation = computed(() => ship.value?.generation ?? 1)
  const travelDestination = computed(() => ship.value?.travel_destination ?? null)

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
    return ship.value
  }

  return {
    ship,
    shipSystems,
    population,
    loaded,
    currentSystemId,
    travelState,
    systems,
    fuel,
    dryMass,
    capacity,
    name,
    classe,
    builtYear,
    voyage,
    generation,
    travelDestination,
    fetch,
  }
})
