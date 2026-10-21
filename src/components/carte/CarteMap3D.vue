<script setup>
/**
 * Vue 3D légère : uniquement les systèmes enregistrés sur la Carte + liens de transit.
 * Pas de chargement global (conception / visibleForSky) — données déjà présentes dans les stores Carte.
 */
import { ref, watch, computed } from 'vue'
import * as THREE from 'three'
import { useMapNodesStore } from '@/stores/mapNodes'
import { useShipStore } from '@/stores/ship'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { getCircleSpriteTexture } from '@/lib/starSpriteTexture'
import { createHighlightSprite, updateHighlightScale } from '@/composables/useStarHighlight'
import { useThreeStarScene, applyMinSizeToPointsMaterial } from '@/composables/useThreeStarScene'
import { getSystemXyz } from '@/lib/stellarCoordinates'
import { getCssVar } from '@/lib/cssVars'
import { loadStarSvgTextureForSpectralType } from '@/composables/useStarSvgTexture'
import { getSpectralLetter, getStarClassLabel } from '@/lib/starClassification'
import { STAR_SPRITE_BASE_SIZE } from '@/constants/starDisplay'
import { buildTransitLinesMesh } from '@/composables/useTransitLines3d'
import ObservatoireTooltip from '@/components/observatoire/ObservatoireTooltip.vue'

const props = defineProps({
  /** ID du système à mettre en focus (caméra) */
  focusStarId: { type: String, default: null },
})

const emit = defineEmits(['focus-star', 'clear-focus'])

const containerRef = ref(null)
const mapStore = useMapNodesStore()
const shipStore = useShipStore()
const stellarStore = useStellarSystemsStore()

const circleTexture = getCircleSpriteTexture()

/** Tooltip au survol : point sous le curseur et position écran */
const hoveredPoint = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

/** Points 3D centrés : uniquement les nœuds carte qui ont des coordonnées stellaires. */
const points = computed(() => {
  const nodes = mapStore.nodes ?? []
  const list = stellarStore.list ?? []
  const byId = {}
  for (const s of list) byId[s.id] = s
  const raw = []
  for (const node of nodes) {
    const stellar = byId[node.systemId]
    if (!stellar) continue
    const xyz = getSystemXyz(stellar)
    if (
      !Number.isFinite(xyz.x) ||
      !Number.isFinite(xyz.y) ||
      !Number.isFinite(xyz.z)
    )
      continue
    raw.push({
      id: node.systemId,
      name: node.name ?? node.systemId,
      x: xyz.x,
      y: xyz.y,
      z: xyz.z,
      spectralType: stellar.spectral_type ?? 'M',
    })
  }
  if (raw.length === 0) return []
  const bc = {
    x: raw.reduce((s, p) => s + p.x, 0) / raw.length,
    y: raw.reduce((s, p) => s + p.y, 0) / raw.length,
    z: raw.reduce((s, p) => s + p.z, 0) / raw.length,
  }
  return raw.map((p) => ({
    ...p,
    x: p.x - bc.x,
    y: p.y - bc.y,
    z: p.z - bc.z,
  }))
})


/** Positions par id pour les segments de transit (clés normalisées string) */
const positionsById = computed(() => {
  const m = new Map()
  for (const p of points.value) m.set(String(p.id), { x: p.x, y: p.y, z: p.z })
  return m
})

/** Segments de transit : ship_travels + map_edges + chaîne chronologique (fallback), dédupliqués */
const transitsSegments = computed(() => {
  const pts = points.value
  const ids = new Set(pts.map((p) => String(p.id)))
  const segs = []
  const seen = new Set()
  const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  const add = (fromId, toId) => {
    const f = String(fromId)
    const t = String(toId)
    if (!f || !t || !ids.has(f) || !ids.has(t)) return
    const k = key(f, t)
    if (seen.has(k)) return
    seen.add(k)
    segs.push({ fromId: f, toId: t })
  }

  // 1) ship_travels (voyages réels)
  const travels = shipStore.travels ?? []
  for (const t of travels) {
    add(t.origin_system_id ?? t.originSystemId, t.destination_system_id ?? t.destinationSystemId)
  }

  // 2) map_edges
  const edges = mapStore.edges ?? []
  for (const e of edges) {
    add(e.from_system ?? e.fromSystem, e.to_system ?? e.toSystem)
  }

  // 3) Chaîne chronologique des nœuds visités (toujours ajoutée pour avoir tous les transits même si travels est vide ou partiel)
  const visitedNodes = (mapStore.nodes ?? [])
    .filter((n) => n.visitedAt)
    .sort((a, b) => new Date(a.visitedAt) - new Date(b.visitedAt))
  for (let i = 0; i < visitedNodes.length - 1; i++) {
    add(visitedNodes[i].systemId, visitedNodes[i + 1].systemId)
  }

  return segs
})

let pointsMesh = null
let highlightMesh = null
let transitLinesMesh = null

const { three, replaceObject, pickStarAtMouse, focusOn, focusBarycentre } = useThreeStarScene(containerRef, {
  onReady: updatePoints,
  onFrame: ({ camera }) => {
    if (highlightMesh && containerRef.value) {
      updateHighlightScale(highlightMesh, camera, containerRef.value.clientHeight || 1)
    }
  },
  onClick: (event) => {
    const star = pickStarAtMouse(event, points.value, props.focusStarId)
    if (star) emit('focus-star', star.id)
    else emit('clear-focus')
  },
  onMouseMove: (event) => {
    const star = pickStarAtMouse(event, points.value, props.focusStarId)
    hoveredPoint.value = star ?? null
    if (star) tooltipPosition.value = { x: event.clientX, y: event.clientY }
  },
  onMouseLeave: () => {
    hoveredPoint.value = null
  },
})

function buildPointsMesh() {
  const pts = points.value
  if (!pts.length) return null
  const byLetter = new Map()
  for (const p of pts) {
    const letter = getSpectralLetter(p.spectralType ?? 'M')
    if (!byLetter.has(letter)) byLetter.set(letter, [])
    byLetter.get(letter).push(p)
  }
  const group = new THREE.Group()
  for (const [letter, list] of byLetter.entries()) {
    const positions = new Float32Array(list.length * 3)
    for (let i = 0; i < list.length; i++) {
      positions[i * 3] = list[i].x
      positions[i * 3 + 1] = list[i].y
      positions[i * 3 + 2] = list[i].z
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      size: STAR_SPRITE_BASE_SIZE,
      map: circleTexture,
      color: getCssVar('--color-white', '#e2eaef'),
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.95,
      alphaTest: 0.01,
    })
    applyMinSizeToPointsMaterial(material)
    const mesh = new THREE.Points(geometry, material)
    mesh.userData = { spectralLetter: letter }
    group.add(mesh)
  }
  ;(async () => {
    for (const child of group.children) {
      const letter = child.userData?.spectralLetter
      if (!letter) continue
      const tex = await loadStarSvgTextureForSpectralType(letter)
      if (child.material && child.material.map !== tex) {
        child.material.map = tex
        child.material.needsUpdate = true
      }
    }
  })()
  return group
}

function buildHighlightMesh() {
  const highlightId = props.focusStarId
  if (!highlightId || !points.value.length) return null
  const p = points.value.find((s) => s.id === highlightId)
  if (!p) return null
  return createHighlightSprite(p.x, p.y, p.z)
}

function buildTransitLinesMeshLocal() {
  return buildTransitLinesMesh(transitsSegments.value, positionsById.value)
}

function updatePoints() {
  if (!three.scene) return
  pointsMesh = replaceObject(pointsMesh, buildPointsMesh())
  highlightMesh = replaceObject(highlightMesh, buildHighlightMesh())
  transitLinesMesh = replaceObject(transitLinesMesh, buildTransitLinesMeshLocal())
}

function focusOnStar(starId) {
  const p = points.value.find((s) => s.id === starId)
  if (p) focusOn({ x: p.x, y: p.y, z: p.z })
}

watch(
  () => [
    points.value,
    props.focusStarId,
    transitsSegments.value,
    positionsById.value,
  ],
  () => updatePoints(),
  { deep: true }
)

watch(
  () => props.focusStarId,
  (id) => {
    if (id) {
      focusOnStar(id)
    } else {
      focusBarycentre()
    }
  }
)
</script>

<template>
  <div class="carte-map-3d-wrapper">
    <div ref="containerRef" class="carte-map-3d" />
    <ObservatoireTooltip
      v-if="hoveredPoint"
      :visible="!!hoveredPoint"
      :position="tooltipPosition"
      :title="hoveredPoint?.name ?? ''"
      :rows="[{ key: 'Type', value: getStarClassLabel(hoveredPoint?.spectralType ?? '') || 'Système stellaire' }]"
      action-label=""
    />
  </div>
</template>
