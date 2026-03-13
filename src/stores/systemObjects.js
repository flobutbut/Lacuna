/**
 * Store Objets des systèmes — corps (étoiles, planètes, disques) par système
 * Réf. LACUNA_TRACES, LACUNA_LABORATOIRE_INSTRUMENTS
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

export const useSystemObjectsStore = defineStore('systemObjects', () => {
  const bySystem = ref({}) // { systemId: [obj, ...] }
  const loaded = ref(false)

  async function fetchAll() {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) {
      loaded.value = true
      return {}
    }
    const { data, error } = await supabase
      .from('system_objects')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) {
      console.warn('[systemObjects] Erreur fetch:', error.message)
      loaded.value = true
      return {}
    }
    const grouped = {}
    for (const row of data || []) {
      if (!grouped[row.system_id]) grouped[row.system_id] = []
      grouped[row.system_id].push(row)
    }
    bySystem.value = grouped
    loaded.value = true
    return grouped
  }

  async function fetchForSystem(systemId) {
    if (!systemId) return []
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) return []
    const { data, error } = await supabase
      .from('system_objects')
      .select('*')
      .eq('system_id', systemId)
      .order('sort_order', { ascending: true })
    if (error) {
      console.warn('[systemObjects] Erreur fetch système:', error.message)
      return []
    }
    if (!bySystem.value[systemId]) bySystem.value = { ...bySystem.value }
    bySystem.value[systemId] = data || []
    return bySystem.value[systemId]
  }

  function getForSystem(systemId) {
    return bySystem.value[systemId] ?? []
  }

  /** Convertit un system_object en format "body" pour ObservatoirePanel (type = ETOILE, PLANETE, etc.) */
  function toBodyFormat(obj, systemName) {
    const typeMap = {
      STAR: 'ETOILE',
      PLANET: 'PLANETE',
      MOON: 'PLANETE',
      MINOR_BODY: 'MINEUR',
      DEBRIS_DISK: 'MINEUR',
    }
    const anomaly = obj.in_habitable_zone ? 45 : obj.type === 'STAR' ? 8 : 22
    const displayName = obj.name || (obj.designation ? `${systemName} ${obj.designation}` : systemName)
    const bodyType = typeMap[obj.type] || 'PLANETE'
    return {
      ...obj,
      id: String(obj.designation || obj.id),
      name: displayName,
      type: bodyType,
      anomaly: obj.confirmation_status === 'DEBATED' ? 72 : anomaly,
    }
  }

  return {
    bySystem,
    loaded,
    fetchAll,
    fetchForSystem,
    getForSystem,
    toBodyFormat,
  }
})
