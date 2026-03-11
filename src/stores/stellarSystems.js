/**
 * Store Systèmes stellaires — chargement Supabase pour le ciel (Observatoire)
 * Fallback : données non utilisées si Supabase non configuré (SkyCanvas utilise initStars)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

export const useStellarSystemsStore = defineStore('stellarSystems', () => {
  const list = ref([])
  const loaded = ref(false)

  async function fetch() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      loaded.value = true
      return []
    }
    const { data, error } = await supabase
      .from('stellar_systems')
      .select('id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level, coordinates')
      .order('distance', { ascending: true })
    if (error) {
      console.warn('[stellarSystems]', error.message)
      loaded.value = true
      return []
    }
    list.value = data ?? []
    loaded.value = true
    return list.value
  }

  /** Systèmes avec coordinates.ra/dec pour projection ciel (exclut SOL si souhaité) */
  function forSky(excludeSol = true) {
    return list.value.filter((s) => !excludeSol || s.id !== 'SOL')
  }

  return { list, loaded, fetch, forSky }
})
