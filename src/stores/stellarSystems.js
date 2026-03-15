/**
 * Store Systèmes stellaires — chargement Supabase pour le ciel (Observatoire)
 * Fallback : données non utilisées si Supabase non configuré (SkyCanvas utilise initStars)
 * Filtre visibilité : fetchVisibleForSky(viewerId) via RPC get_visible_systems
 * Chargement trois passes : ciel réel (mag≤6.5), systèmes proches (≤100 al), ciel profond (6.5–18)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

const SKY_COLUMNS = 'id, name, spectral_type, distance, age, planets, habitable_zone, anomaly_level, coordinates, apparent_magnitude, luminosity, color_index'

export const useStellarSystemsStore = defineStore('stellarSystems', () => {
  const list = ref([])
  const loaded = ref(false)
  /** Systèmes visibles depuis le point de vue courant (chargés en trois passes) */
  const visibleForSky = ref([])
  const skyLoadingPass1 = ref(false)
  const skyLoadingPass2 = ref(false)
  const skyLoadingPass3 = ref(false)
  const skyFullyLoaded = ref(false)
  /** Segments stick-figure (star_from, star_to, constellation_abbr) pour dessiner les constellations */
  const constellationLines = ref([])

  async function fetchConstellationLines() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      constellationLines.value = []
      return []
    }
    const { data, error } = await supabase
      .from('constellation_lines')
      .select('star_from, star_to, constellation_abbr, constellations(name_latin, name_fr)')
    if (error) {
      console.warn('[stellarSystems] fetchConstellationLines:', error.message)
      constellationLines.value = []
      return []
    }
    constellationLines.value = data ?? []
    return constellationLines.value
  }

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

  /** Fusionne des systèmes dans visibleForSky sans doublons (premier id gagne). */
  function _mergeWithoutDuplicates(existing, incoming) {
    const byId = new Map(existing.map((s) => [s.id, s]))
    for (const s of incoming) {
      if (s?.id && !byId.has(s.id)) byId.set(s.id, s)
    }
    return [...byId.values()]
  }

  /**
   * Charge les systèmes visibles en trois passes : ciel réel (mag≤6.5), systèmes proches (≤100 al), ciel profond (6.5–18).
   * @param {string} viewerSystemId - ID du système où se trouve le vaisseau (ex. SOL)
   * @param {number} magnitudeLimit - Magnitude apparente max pour passe 3 (défaut 18)
   */
  async function fetchVisibleForSky(viewerSystemId = 'SOL', magnitudeLimit = 18) {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      visibleForSky.value = []
      skyFullyLoaded.value = false
      return []
    }

    skyFullyLoaded.value = false
    skyLoadingPass1.value = true
    visibleForSky.value = []

    // — Passe 1 : Ciel réel (magnitude ≤ 6.5) —
    const { data: pass1, error: err1 } = await supabase.rpc('get_visible_systems', {
      p_viewer_system_id: viewerSystemId,
      p_magnitude_limit: 6.5,
      p_magnitude_min: null,
      p_limit: 6000,
      p_offset: 0,
    })
    if (err1) {
      console.warn('[stellarSystems] get_visible_systems pass1:', err1.message)
      skyLoadingPass1.value = false
      return []
    }
    visibleForSky.value = Array.isArray(pass1) ? pass1 : []
    skyLoadingPass1.value = false

    // — Passe 2 : Systèmes proches navigables (distance ≤ 100 al) —
    skyLoadingPass2.value = true
    const { data: pass2, error: err2 } = await supabase
      .from('stellar_systems')
      .select(SKY_COLUMNS)
      .neq('id', viewerSystemId)
      .lte('distance', 100)
      .gt('apparent_magnitude', 6.5)
      .order('distance', { ascending: true })
    if (err2) {
      console.warn('[stellarSystems] pass2 nearby:', err2.message)
    } else if (pass2?.length) {
      visibleForSky.value = _mergeWithoutDuplicates(visibleForSky.value, pass2)
    }
    skyLoadingPass2.value = false

    // — Passe 3 : Ciel profond (magnitude 6.5–18) par pages de 10000 —
    skyLoadingPass3.value = true
    let offset = 0
    const PAGE = 10000

    while (true) {
      const { data: page, error: err3 } = await supabase.rpc('get_visible_systems', {
        p_viewer_system_id: viewerSystemId,
        p_magnitude_limit: magnitudeLimit,
        p_magnitude_min: 6.5,
        p_limit: PAGE,
        p_offset: offset,
      })

      if (err3) {
        console.warn('[stellarSystems] get_visible_systems pass3:', err3.message)
        break
      }
      if (!page || page.length === 0) break

      visibleForSky.value = _mergeWithoutDuplicates(visibleForSky.value, page)
      offset += PAGE

      await new Promise((resolve) => setTimeout(resolve, 100))

      if (page.length < PAGE) break
    }

    skyLoadingPass3.value = false
    skyFullyLoaded.value = true
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

  /**
   * Recherche systèmes par name ou id (case-insensitive, contains).
   * Interroge directement Supabase — ne dépend ni de list ni de visibleForSky.
   * Utilisé par la recherche Observatoire pour trouver toute étoile (ex. Polaris).
   * @param {string} q - Chaîne de recherche (sera trim + lower)
   * @returns {Promise<Array>} Systèmes correspondants (id, name, coordinates, spectral_type, distance, etc.)
   */
  async function searchSystems(q) {
    const qClean = String(q ?? '').trim().toLowerCase()
    if (!qClean) return []
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      // Fallback : recherche dans list
      return list.value.filter((s) => {
        if (s.id === 'SOL') return false
        const name = (s.name ?? '').toLowerCase()
        const id = (s.id ?? '').toLowerCase()
        return name.includes(qClean) || id.includes(qClean)
      })
    }
    const escaped = qClean.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
    const pattern = `%${escaped}%`
    const { data, error } = await supabase
      .from('stellar_systems')
      .select('id, name, spectral_type, distance, coordinates, apparent_magnitude, luminosity, color_index')
      .neq('id', 'SOL')
      .or(`name.ilike.${pattern},id.ilike.${pattern}`)
      .order('distance', { ascending: true })
      .limit(50)
    if (error) {
      console.warn('[stellarSystems] searchSystems:', error.message)
      return []
    }
    return Array.isArray(data) ? data : []
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

  return {
    list,
    loaded,
    visibleForSky,
    skyLoadingPass1,
    skyLoadingPass2,
    skyLoadingPass3,
    skyFullyLoaded,
    constellationLines,
    fetch,
    fetchVisibleForSky,
    fetchConstellationLines,
    searchSystems,
    forSky,
    getVisibilityStats,
  }
})
