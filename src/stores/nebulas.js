/**
 * Store Nébuleuses — nuages de gaz (formes étendues, visibles en IR)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

export const useNebulasStore = defineStore('nebulas', () => {
  const list = ref([])
  const loaded = ref(false)

  async function fetch() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      loaded.value = true
      return []
    }
    const { data, error } = await supabase
      .from('nebulas')
      .select('id, name, designation, distance, coordinates, shape_type, shape_params, ir_only')
    if (error) {
      console.warn('[nebulas]', error.message)
      loaded.value = true
      return []
    }
    list.value = data ?? []
    loaded.value = true
    return list.value
  }

  /** Nébuleuses visibles en bande IR (toutes si ir_only, ou toutes pour l'instant) */
  function forSky(band = 'visible') {
    if (band !== 'ir') return []
    return list.value
  }

  return { list, loaded, fetch, forSky }
})
