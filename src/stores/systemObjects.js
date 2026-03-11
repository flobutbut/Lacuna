/**
 * Store Objets des systèmes — corps (étoiles, planètes, disques) par système
 * Réf. LACUNA_TRACES, LACUNA_LABORATOIRE_INSTRUMENTS
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

const OBJECT_TYPE_LABELS = {
  STAR: 'Étoile',
  PLANET: 'Corps planétaire',
  MOON: 'Lune',
  MINOR_BODY: 'Corps mineur',
  DEBRIS_DISK: 'Disque de débris',
}

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

  /** Convertit un system_object en format "body" pour ObservatoirePanel */
  function toBodyFormat(obj, systemName) {
    const typeMap = {
      STAR: 'ETOILE',
      PLANET: 'PLANETE',
      MOON: 'PLANETE',
      MINOR_BODY: 'MINEUR',
      DEBRIS_DISK: 'MINEUR',
    }
    const anomaly = obj.in_habitable_zone ? 45 : obj.type === 'STAR' ? 8 : 22
    const displayName = obj.designation ? `${systemName} ${obj.designation}` : obj.name
    return {
      id: String(obj.designation || obj.id),
      name: displayName,
      type: typeMap[obj.type] || 'PLANETE',
      anomaly: obj.confirmation_status === 'DEBATED' ? 72 : anomaly,
      ...obj,
    }
  }

  return {
    bySystem,
    loaded,
    fetchAll,
    fetchForSystem,
    getForSystem,
    toBodyFormat,
    OBJECT_TYPE_LABELS,
  }
})
