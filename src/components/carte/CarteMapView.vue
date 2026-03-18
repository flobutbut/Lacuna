<script setup>
import { computed, ref, toRef } from 'vue'
import { useMapNodesStore } from '@/stores/mapNodes'
import { useShipStore } from '@/stores/ship'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useCarteMapProjection } from '@/composables/useCarteMapProjection'
import { useCarteMapPanZoom } from '@/composables/useCarteMapPanZoom'
import { getStarIconUrlForNode } from '@/assets/illustrations/stars'

const props = defineProps({
  selectedSystemId: { type: String, default: null },
})
const emit = defineEmits(['select-system'])
const selectedSystemIdRef = toRef(props, 'selectedSystemId')

const mapStore = useMapNodesStore()
const shipStore = useShipStore()
const stellarStore = useStellarSystemsStore()

const stellarBySystemId = computed(() => {
  const m = {}
  for (const s of stellarStore.list) m[s.id] = s
  return m
})

const nodesRef = computed(() => mapStore.nodes)
const { positions, viewBox } = useCarteMapProjection(nodesRef, stellarBySystemId)

/** Arêtes dérivées de ship_travels (snake_case ou camelCase) ; si vide, fallback sur l'ordre chronologique des nœuds visités */
const edges = computed(() => {
  const posMap = positions.value
  const nodeIds = new Set(mapStore.nodes.map((n) => n.systemId))
  const result = []

  const travels = shipStore.travels ?? []
  for (const t of travels) {
    const fromId = t.origin_system_id ?? t.originSystemId
    const toId = t.destination_system_id ?? t.destinationSystemId
    if (!fromId || !toId || !nodeIds.has(fromId) || !nodeIds.has(toId)) continue
    const fromPos = posMap.get(fromId)
    const toPos = posMap.get(toId)
    if (!fromPos || !toPos) continue
    const x1 = Number(fromPos.x)
    const y1 = Number(fromPos.y)
    const x2 = Number(toPos.x)
    const y2 = Number(toPos.y)
    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) continue
    result.push({ from: fromId, to: toId, x1, y1, x2, y2 })
  }

  if (result.length === 0 && mapStore.nodes.length >= 2) {
    const withVisit = mapStore.nodes.filter((n) => n.visitedAt).sort((a, b) => new Date(a.visitedAt) - new Date(b.visitedAt))
    for (let i = 0; i < withVisit.length - 1; i++) {
      const fromId = withVisit[i].systemId
      const toId = withVisit[i + 1].systemId
      const fromPos = posMap.get(fromId)
      const toPos = posMap.get(toId)
      if (!fromPos || !toPos) continue
      const x1 = Number(fromPos.x)
      const y1 = Number(fromPos.y)
      const x2 = Number(toPos.x)
      const y2 = Number(toPos.y)
      if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) continue
      result.push({ from: fromId, to: toId, x1, y1, x2, y2 })
    }
  }
  return result
})

/** systemId ayant au moins une arête = visité */
const visitedSystemIds = computed(() => {
  const set = new Set()
  for (const e of edges.value) {
    set.add(e.from)
    set.add(e.to)
  }
  return set
})

const containerRef = ref(null)

const { effectiveViewBox, orbitAngle, orbitPivot, onWheel, onMouseDown, onMouseMove, onMouseUp, onMouseLeave, isDragging } = useCarteMapPanZoom(
  computed(() => viewBox?.value ?? null),
  positions,
  selectedSystemIdRef,
  containerRef
)

function onSelectSystem(systemId) {
  emit('select-system', systemId)
}
</script>

<template>
  <div ref="containerRef" class="carte-map-container carte-map-container--projected">
    <template v-if="mapStore.nodes.length === 0">
      <div class="carte-map-empty">
        Aucun système sur la carte. Ajoutez-en depuis l'Observatoire ou le Laboratoire.
      </div>
    </template>
    <template v-else-if="effectiveViewBox">
      <svg
        class="carte-projected-svg"
        :class="{ 'carte-projected-svg--dragging': isDragging }"
        :viewBox="effectiveViewBox.minX + ' ' + effectiveViewBox.minY + ' ' + effectiveViewBox.width + ' ' + effectiveViewBox.height"
        preserveAspectRatio="xMidYMid meet"
        @click.self="onSelectSystem(null)"
        @wheel.prevent="onWheel"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
      >
        <!-- Groupe orbit : rotation autour du barycentre ou de l’étoile sélectionnée (comme OrbitControls en 3D) -->
        <g
          :transform="'rotate(' + orbitAngle + ' ' + orbitPivot.x + ' ' + orbitPivot.y + ')'"
          class="carte-projected__orbit-group"
        >
        <!-- Nœuds = systèmes (étoiles SVG, comme vue 3D) -->
        <g class="carte-projected__nodes">
          <g
            v-for="node in mapStore.nodes"
            :key="node.systemId"
            class="carte-projected__node"
            :class="{
              'carte-node--current': node.systemId === shipStore.currentSystemId,
              'carte-node--selected': props.selectedSystemId === node.systemId,
              'carte-projected__node--visited': visitedSystemIds.has(node.systemId),
            }"
            :transform="'translate(' + (positions.get(node.systemId)?.x ?? 0) + ', ' + (positions.get(node.systemId)?.y ?? 0) + ')'"
            @click.stop="onSelectSystem(node.systemId)"
          >
            <image
              class="carte-projected__node-icon"
              :href="getStarIconUrlForNode(node, stellarBySystemId)"
              x="-0.5"
              y="-0.5"
              width="1"
              height="1"
              preserveAspectRatio="xMidYMid meet"
            />
            <title>{{ node.name }}</title>
          </g>
        </g>
        <!-- Arêtes = transits (voyages) — dessinées au-dessus des nœuds pour rester visibles -->
        <g class="carte-projected__edges">
          <line
            v-for="(edge, i) in edges"
            :key="edge.from + '-' + edge.to + '-' + i"
            class="carte-projected__edge"
            :x1="edge.x1"
            :y1="edge.y1"
            :x2="edge.x2"
            :y2="edge.y2"
          />
        </g>
        </g>
      </svg>
    </template>
    <div v-else class="carte-map-empty">
      Chargement des positions…
    </div>
  </div>
</template>

<style scoped>
.carte-map-container--projected {
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-height: 0;
}

.carte-projected-svg {
  width: 100%;
  height: 100%;
  min-height: 0;
  cursor: grab;
}

.carte-projected-svg--dragging {
  cursor: grabbing;
}

.carte-projected__edge {
  stroke: var(--color-cyan);
  stroke-width: 1px;
  stroke-opacity: 0.9;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
}

.carte-projected__node {
  cursor: pointer;
  transition: opacity var(--transition-base);
}

.carte-projected__node:hover {
  opacity: 1;
}

.carte-projected__node-icon {
  pointer-events: none;
  opacity: 0.95;
}

.carte-projected__node:hover .carte-projected__node-icon {
  opacity: 1;
}

.carte-node--current .carte-projected__node-icon {
  filter: drop-shadow(0 0 6px var(--color-cyan-glow));
}

.carte-node--selected .carte-projected__node-icon {
  filter: drop-shadow(0 0 6px var(--color-cyan-glow));
}

.carte-projected__node--visited .carte-projected__node-icon {
  opacity: 1;
}
</style>
