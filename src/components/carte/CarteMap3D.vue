<script setup>
/**
 * Vue 3D légère : uniquement les systèmes enregistrés sur la Carte + liens de transit.
 * Pas de chargement global (conception / visibleForSky) — données déjà présentes dans les stores Carte.
 */
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useMapNodesStore } from '@/stores/mapNodes'
import { useShipStore } from '@/stores/ship'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { getCircleSpriteTexture } from '@/lib/starSpriteTexture'
import { createHighlightSprite, updateHighlightScale, HIGHLIGHT_RING_SIZE, MIN_HIGHLIGHT_PIXELS } from '@/composables/useStarHighlight'
import { animateFocusTo, animateTargetTo } from '@/composables/useCameraFocusAnimation'
import { getSystemXyz } from '@/lib/stellarCoordinates'
import { loadStarSvgTextureForSpectralType } from '@/composables/useStarSvgTexture'
import { getSpectralLetter, getStarClassLabel } from '@/lib/starClassification'
import {
  COLOR_GREEN_BRIGHT_HEX,
  STAR_SPRITE_BASE_SIZE,
  STAR_SPRITE_MIN_PIXELS,
} from '@/constants/starDisplay'
import ObservatoireTooltip from '@/components/ObservatoireTooltip.vue'

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

const TRANSIT_LINE_OPACITY = 0.8
const BASE_CAMERA_DISTANCE = 80
const CLICK_DRAG_THRESHOLD = 5
let isFocusAnimating = false

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

const barycentre = computed(() => ({ x: 0, y: 0, z: 0 }))

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

let scene = null
let camera = null
let renderer = null
let controls = null
let pointsMesh = null
let highlightMesh = null
let transitLinesMesh = null
let rafId = null
let resizeObserver = null
let mouseDownPos = null

function applyMinSizeToPointsMaterial(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.minSize = { value: STAR_SPRITE_MIN_PIXELS }
    shader.vertexShader = shader.vertexShader
      .replace('uniform float scale;', 'uniform float scale;\nuniform float minSize;')
      .replace(
        'if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );',
        'if ( isPerspective ) gl_PointSize = max( size * ( scale / - mvPosition.z ), minSize );'
      )
  }
}

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
      color: getComputedStyle(document.documentElement).getPropertyValue('--color-white').trim() || '#e2eaef',
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

function buildTransitLinesMesh() {
  const segs = transitsSegments.value
  const posById = positionsById.value
  if (!segs.length || !posById || !(posById instanceof Map)) return null
  const vertices = []
  for (const { fromId, toId } of segs) {
    const from = posById.get(fromId)
    const to = posById.get(toId)
    if (!from || !to) continue
    vertices.push(from.x, from.y, from.z)
    vertices.push(to.x, to.y, to.z)
  }
  if (vertices.length === 0) return null
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  const material = new THREE.LineBasicMaterial({
    color: COLOR_GREEN_BRIGHT_HEX,
    transparent: true,
    opacity: TRANSIT_LINE_OPACITY,
  })
  return new THREE.LineSegments(geometry, material)
}

function initThree() {
  if (!containerRef.value) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  scene = new THREE.Scene()
  const bgHex = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim() || '#03060d'
  scene.background = new THREE.Color(bgHex)
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000)
  camera.position.set(
    BASE_CAMERA_DISTANCE,
    BASE_CAMERA_DISTANCE * 0.5,
    BASE_CAMERA_DISTANCE
  )
  camera.lookAt(0, 0, 0)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  containerRef.value.appendChild(renderer.domElement)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(0, 0, 0)
  controls.minDistance = 2
  controls.maxDistance = 3000
  controls.enablePan = true
}

function pickStarAtMouse(event) {
  if (!containerRef.value || !camera || !points.value?.length) return null
  const rect = containerRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  const width = rect.width
  const height = rect.height
  const scaleFactor =
    (0.5 * height) / Math.tan((camera.fov * Math.PI) / 360)
  const v = new THREE.Vector3()
  const hits = []
  for (let i = 0; i < points.value.length; i++) {
    const p = points.value[i]
    v.set(p.x, p.y, p.z)
    const camDist = camera.position.distanceTo(v)
    v.project(camera)
    const sx = (v.x * 0.5 + 0.5) * width
    const sy = (1 - (v.y * 0.5 + 0.5)) * height
    if (v.z > 1) continue
    const distPx = Math.hypot(mouseX - sx, mouseY - sy)
    const isHighlight = p.id === props.focusStarId
    const worldSize = isHighlight ? HIGHLIGHT_RING_SIZE : STAR_SPRITE_BASE_SIZE
    const screenSizePx = Math.max(
      STAR_SPRITE_MIN_PIXELS,
      (worldSize * scaleFactor) / Math.max(0.1, camDist)
    )
    const hitRadius = Math.max(6, screenSizePx * 0.6)
    if (distPx <= hitRadius) {
      hits.push({ index: i, star: p, distPx, depth: camDist })
    }
  }
  hits.sort((a, b) => a.depth - b.depth)
  return hits[0]?.star ?? null
}

function updatePoints() {
  if (!scene) return
  if (pointsMesh) {
    scene.remove(pointsMesh)
    if (pointsMesh.children?.length) {
      pointsMesh.children.forEach((c) => {
        c.geometry?.dispose?.()
        c.material?.dispose?.()
      })
    } else {
      pointsMesh.geometry?.dispose?.()
      pointsMesh.material?.dispose?.()
    }
  }
  if (highlightMesh) {
    scene.remove(highlightMesh)
    highlightMesh.material.dispose()
  }
  if (transitLinesMesh) {
    scene.remove(transitLinesMesh)
    transitLinesMesh.geometry.dispose()
    transitLinesMesh.material.dispose()
  }
  pointsMesh = buildPointsMesh()
  if (pointsMesh) scene.add(pointsMesh)
  highlightMesh = buildHighlightMesh()
  if (highlightMesh) scene.add(highlightMesh)
  transitLinesMesh = buildTransitLinesMesh()
  if (transitLinesMesh) scene.add(transitLinesMesh)
}

function animate() {
  rafId = requestAnimationFrame(animate)
  if (controls && !isFocusAnimating) controls.update()
  if (highlightMesh && containerRef.value && camera) {
    updateHighlightScale(highlightMesh, camera, containerRef.value.clientHeight || 1)
  }
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function resize() {
  if (!containerRef.value || !camera || !renderer) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

function focusOnStar(starId) {
  const p = points.value.find((s) => s.id === starId)
  if (!p || !camera || !controls) return
  animateFocusTo(camera, controls, { x: p.x, y: p.y, z: p.z }, {
    onStart: () => { isFocusAnimating = true },
    onComplete: () => { isFocusAnimating = false },
  })
}

function animateToBarycentre() {
  if (!camera || !controls) return
  animateTargetTo(camera, controls, { x: 0, y: 0, z: 0 }, {
    onStart: () => { isFocusAnimating = true },
    onComplete: () => { isFocusAnimating = false },
  })
}

function onCanvasMouseDown(event) {
  mouseDownPos = { x: event.clientX, y: event.clientY }
}

function onCanvasMouseMove(event) {
  const star = pickStarAtMouse(event)
  hoveredPoint.value = star ?? null
  if (star) tooltipPosition.value = { x: event.clientX, y: event.clientY }
}

function onCanvasMouseLeave() {
  hoveredPoint.value = null
}

function onCanvasClick(event) {
  if (!containerRef.value || !camera) return
  if (mouseDownPos) {
    const dist = Math.hypot(
      event.clientX - mouseDownPos.x,
      event.clientY - mouseDownPos.y
    )
    mouseDownPos = null
    if (dist > CLICK_DRAG_THRESHOLD) return
  }
  const star = pickStarAtMouse(event)
  if (star) {
    emit('focus-star', star.id)
  } else {
    emit('clear-focus')
  }
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
      animateToBarycentre()
    }
  }
)

onMounted(() => {
  initThree()
  updatePoints()
  animate()
  window.addEventListener('resize', resize)
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(containerRef.value)
    containerRef.value.addEventListener('mousedown', onCanvasMouseDown)
    containerRef.value.addEventListener('click', onCanvasClick)
    containerRef.value.addEventListener('mousemove', onCanvasMouseMove)
    containerRef.value.addEventListener('mouseleave', onCanvasMouseLeave)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  if (rafId) cancelAnimationFrame(rafId)
  if (containerRef.value) {
    resizeObserver?.unobserve(containerRef.value)
    containerRef.value.removeEventListener('mousedown', onCanvasMouseDown)
    containerRef.value.removeEventListener('click', onCanvasClick)
    containerRef.value.removeEventListener('mousemove', onCanvasMouseMove)
    containerRef.value.removeEventListener('mouseleave', onCanvasMouseLeave)
  }
  if (pointsMesh) {
    scene?.remove(pointsMesh)
    if (pointsMesh.children?.length) {
      pointsMesh.children.forEach((c) => {
        c.geometry?.dispose?.()
        c.material?.dispose?.()
      })
    } else {
      pointsMesh.geometry?.dispose?.()
      pointsMesh.material?.dispose?.()
    }
  }
  if (highlightMesh) {
    scene?.remove(highlightMesh)
    highlightMesh.material?.dispose?.()
  }
  if (transitLinesMesh) {
    scene?.remove(transitLinesMesh)
    transitLinesMesh.geometry?.dispose?.()
    transitLinesMesh.material?.dispose?.()
  }
  renderer?.dispose()
  controls?.dispose()
})
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
