/**
 * Store Systèmes stellaires — chargement Supabase pour le ciel (Observatoire)
 * Fallback : données non utilisées si Supabase non configuré (SkyCanvas utilise initStars)
 * Filtre visibilité : fetchVisibleForSky(viewerId) via RPC get_visible_systems
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

export const useStellarSystemsStore = defineStore('stellarSystems', () => {
  const list = ref([])
  const loaded = ref(false)
  /** Systèmes visibles depuis le point de vue courant (RPC get_visible_systems) */
  const visibleForSky = ref([])

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

  /**
   * Charge les systèmes visibles depuis un point (magnitude apparente ≤ limite).
   * Utilise la RPC get_visible_systems. Stocke le résultat dans visibleForSky.
   * @param {string} viewerSystemId - ID du système où se trouve le vaisseau (ex. SOL)
   * @param {number} magnitudeLimit - Magnitude apparente max (défaut 8, œil nu ~6.5)
   * @returns {Promise<Array>} Systèmes visibles (format même structure que list)
   */
  async function fetchVisibleForSky(viewerSystemId = 'SOL', magnitudeLimit = 12) {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      visibleForSky.value = []
      return []
    }
    const { data, error } = await supabase.rpc('get_visible_systems', {
      p_viewer_system_id: viewerSystemId,
      p_magnitude_limit: magnitudeLimit,
    })
    if (error) {
      console.warn('[stellarSystems] get_visible_systems:', error.message, '(fallback: liste complète)')
      visibleForSky.value = []
      return []
    }
    visibleForSky.value = Array.isArray(data) && data.length > 0 ? data : []
    return visibleForSky.value
  }

  /** Systèmes pour projection ciel : visibles si RPC a retourné des résultats, sinon liste complète (exclut SOL).
   * Fusionne les naines brunes (L/T/Y) — invisibles en optique mais visibles en IR — pour le filtre spectral. */
  function forSky(excludeSol = true) {
    let base = visibleForSky.value.length > 0 ? visibleForSky.value : list.value
    const ids = new Set(base.map((s) => s.id))
    const brownDwarfs = list.value.filter((s) => /^[LTY]/.test(s.spectral_type || ''))
    brownDwarfs.forEach((b) => {
      if (!ids.has(b.id) && (b.id !== 'SOL' || !excludeSol)) {
        base = [...base, b]
        ids.add(b.id)
      }
    })
    return excludeSol ? base.filter((s) => s.id !== 'SOL') : base
  }

  /** Statistiques visibilité : total, affichés, filtrés (exclut le système courant) */
  function getVisibilityStats() {
    const total = list.value.length
    const displayed = forSky().length
    const excluded = 1
    const couldBeShown = Math.max(0, total - excluded)
    const filtered = visibleForSky.value.length > 0 ? couldBeShown - displayed : 0
    return {
      total,
      displayed,
      filtered,
      usingRpc: visibleForSky.value.length > 0,
    }
  }

  return { list, loaded, visibleForSky, fetch, fetchVisibleForSky, forSky, getVisibilityStats }
})
