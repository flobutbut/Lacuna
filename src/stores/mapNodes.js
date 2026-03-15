/**
 * Store Carte — nœuds et arêtes des systèmes visités/ajoutés
 * Branché sur map_nodes et map_edges (Supabase)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useShipStore } from '@/stores/ship'

function rowToNode(row) {
  return {
    id: row.id,
    systemId: row.system_id,
    name: row.name,
    visitedAt: row.visited_at,
    generation: row.generation,
    tracesFound: row.traces_found ?? 0,
    createdAt: row.created_at,
  }
}

function rowToEdge(row) {
  return {
    id: row.id,
    fromSystem: row.from_system,
    toSystem: row.to_system,
    travelTime: row.travel_time,
    generation: row.generation,
    createdAt: row.created_at,
  }
}

export const useMapNodesStore = defineStore('mapNodes', () => {
  const nodes = ref([])
  const edges = ref([])
  const loaded = ref(false)

  const nodeBySystemId = computed(() => {
    const map = {}
    for (const n of nodes.value) map[n.systemId] = n
    return map
  })

  const visitedSystemIds = computed(() => new Set(nodes.value.map((n) => n.systemId)))

  function isOnMap(systemId) {
    return !!nodeBySystemId.value[systemId]
  }

  async function fetch() {
    const shipStore = useShipStore()
    const ship = shipStore.ship
    const shipId = ship?.id
    const supabaseStore = useSupabaseStore()

    if (!supabaseStore.isConfigured() || !shipId) {
      loaded.value = true
      return { nodes: [], edges: [] }
    }

    const [{ data: nodesData, error: nodesErr }, { data: edgesData, error: edgesErr }] = await Promise.all([
      supabase.from('map_nodes').select('*').eq('ship_id', shipId).order('created_at', { ascending: true }),
      supabase.from('map_edges').select('*').eq('ship_id', shipId),
    ])

    if (nodesErr) {
      console.warn('[mapNodes]', nodesErr.message)
      loaded.value = true
      return { nodes: nodes.value, edges: edges.value }
    }
    if (edgesErr) {
      console.warn('[mapNodes] edges:', edgesErr.message)
    }

    nodes.value = (nodesData ?? []).map(rowToNode)
    edges.value = (edgesData ?? []).map(rowToEdge)
    loaded.value = true
    return { nodes: nodes.value, edges: edges.value }
  }

  /**
   * Ajoute un système à la carte (ou met à jour si déjà présent)
   * @param {string} systemId - ID stellar_systems (ex. PROXIMA, SOL)
   * @param {string} name - Nom affiché (ex. "Proxima Centauri")
   * @param {object} [opts] - visitedAt, generation, tracesFound
   */
  async function addNode(systemId, name, opts = {}) {
    const shipStore = useShipStore()
    const ship = shipStore.ship
    const shipId = ship?.id
    const supabaseStore = useSupabaseStore()

    if (!systemId || !name) return null

    const newNode = {
      id: `local-${systemId}-${Date.now()}`,
      systemId,
      name: name.trim() || systemId,
      visitedAt: opts.visitedAt ?? null,
      generation: opts.generation ?? shipStore.generation ?? null,
      tracesFound: opts.tracesFound ?? 0,
      createdAt: new Date().toISOString(),
    }

    if (supabaseStore.isConfigured() && shipId) {
      const payload = {
        ship_id: shipId,
        system_id: systemId,
        name: newNode.name,
        visited_at: newNode.visitedAt,
        generation: newNode.generation,
        traces_found: newNode.tracesFound,
      }

      const { data, error } = await supabase
        .from('map_nodes')
        .upsert(payload, { onConflict: 'ship_id,system_id', ignoreDuplicates: false })
        .select('*')
        .single()

      if (error) {
        console.warn('[mapNodes] addNode:', error.message)
        // Fallback local : ajout en mémoire pour la session
        const idx = nodes.value.findIndex((n) => n.systemId === systemId)
        if (idx < 0) nodes.value = [...nodes.value, newNode]
        return newNode
      }

      Object.assign(newNode, rowToNode(data))
    }

    const idx = nodes.value.findIndex((n) => n.systemId === systemId)
    if (idx >= 0) {
      nodes.value = [...nodes.value]
      nodes.value[idx] = newNode
    } else {
      nodes.value = [...nodes.value, newNode]
    }
    return newNode
  }

  /**
   * Retire un système de la carte
   * @param {string} systemId - ID du système à retirer
   */
  async function removeNode(systemId) {
    const shipStore = useShipStore()
    const ship = shipStore.ship
    const shipId = ship?.id
    const supabaseStore = useSupabaseStore()

    if (!supabaseStore.isConfigured() || !shipId || !systemId) {
      return false
    }

    const { error } = await supabase
      .from('map_nodes')
      .delete()
      .eq('ship_id', shipId)
      .eq('system_id', systemId)

    if (error) {
      console.warn('[mapNodes] removeNode:', error.message)
      return false
    }

    nodes.value = nodes.value.filter((n) => n.systemId !== systemId)
    edges.value = edges.value.filter((e) => e.fromSystem !== systemId && e.toSystem !== systemId)
    return true
  }

  return {
    nodes,
    edges,
    loaded,
    nodeBySystemId,
    visitedSystemIds,
    isOnMap,
    fetch,
    addNode,
    removeNode,
  }
})
