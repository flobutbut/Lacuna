/**
 * Store Équation de Drake — chargement depuis Supabase
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

export const useDrakeStore = defineStore('drake', () => {
  const row = ref(null)
  const loaded = ref(false)

  const n = computed(() => row.value?.n ?? 12.4)
  const lastDelta = computed(() => row.value?.last_delta ?? 0)
  const lastUpdated = computed(() => row.value?.last_updated ?? null)

  const terms = computed(() => {
    const r = row.value
    if (!r) return null
    return [
      { symbol: 'R*', label: 'Taux de formation stellaire', val: `${r.r_star} /an`, raw: r.r_star },
      { symbol: 'fp', label: 'Fraction étoiles avec planètes', val: String(Number(r.fp).toFixed(2)), raw: r.fp },
      { symbol: 'ne', label: 'Planètes en zone habitable', val: String(r.ne), raw: r.ne },
      { symbol: 'fl', label: 'Apparition de la vie', val: String(r.fl), raw: r.fl },
      { symbol: 'fi', label: 'Vie intelligente', val: String(r.fi), raw: r.fi },
      { symbol: 'fc', label: 'Technologie détectable', val: String(r.fc), raw: r.fc },
      { symbol: 'L', label: 'Durée de communication', val: `${Number(r.l_val).toLocaleString('fr')} ans`, raw: r.l_val },
    ]
  })

  async function fetch() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      loaded.value = true
      return null
    }
    const { data, error } = await supabase.from('drake_equation').select('*').limit(1).single()
    if (error) {
      console.warn('[drake]', error.message)
      loaded.value = true
      return null
    }
    row.value = data
    loaded.value = true
    return data
  }

  return { row, loaded, n, lastDelta, lastUpdated, terms, fetch }
})
