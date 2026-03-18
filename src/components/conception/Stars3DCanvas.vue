<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useStars3DConception } from '@/composables/useStars3DConception'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { getCircleSpriteTexture } from '@/lib/starSpriteTexture'
import { createHighlightSprite, updateHighlightScale, HIGHLIGHT_RING_SIZE, MIN_HIGHLIGHT_PIXELS } from '@/composables/useStarHighlight'
import { animateFocusTo, animateTargetTo } from '@/composables/useCameraFocusAnimation'
import { getVisibleConstellationSegments } from '@/lib/constellationSegments'
import { loadStarSvgTextureForSpectralType } from '@/composables/useStarSvgTexture'
import { getSpectralLetter } from '@/lib/starClassification'
import {
  COLOR_GREEN_BRIGHT_HEX,
  STAR_SPRITE_BASE_SIZE,
  STAR_SPRITE_MIN_PIXELS,
} from '@/constants/starDisplay'

const props = defineProps({
  /** ID de l'étoile à focus (caméra se déplace vers elle) */
  focusStarId: { type: String, default: null },
  /** Filtre spectral (visible, ir, uv, r) — même que Observatoire */
  spectralFilter: { type: String, default: 'visible' },
  /** Filtre exoplanètes */
  exoplanetFilter: { type: Boolean, default: false },
  /** Filtre par type d'étoile (all | pulsar | d | lty | oba | fgkm) */
  typeFilter: { type: String, default: 'all' },
  /** Afficher les lignes de constellation */
  constellationsEnabled: { type: Boolean, default: false },
  /** Afficher les lignes des transits (systèmes visités dans l'ordre) */
  transitsEnabled: { type: Boolean, default: false },
  /** Segments de trajets [{ fromId, toId }, ...] — ordre chronologique des visites (ship_travels) */
  transitsSegments: { type: Array, default: () => [] },
})

const emit = defineEmits(['focus-star', 'clear-focus'])

const containerRef = ref(null)
const stellarSystemsStore = useStellarSystemsStore()
const spectralFilterRef = computed(() => props.spectralFilter)
const exoplanetFilterRef = computed(() => props.exoplanetFilter)
const typeFilterRef = computed(() => props.typeFilter)
const { points, getStarPositionById, constellationPositionsById, barycentre } = useStars3DConception(
  spectralFilterRef,
  exoplanetFilterRef,
  typeFilterRef
)

let scene = null
let camera = null
let renderer = null
let controls = null
let pointsMesh = null // THREE.Group (sprites par type spectral)
let highlightMesh = null
let constellationLinesMesh = null
let transitLinesMesh = null
let rafId = null
let resizeObserver = null
let raycaster = null
let mouse = null
let mouseDownPos = null
let isFocusAnimating = false
const CLICK_DRAG_THRESHOLD = 5

const BASE_CAMERA_DISTANCE = 80

function initThree() {
  if (!containerRef.value) return

  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x03060d)

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000)
  camera.position.set(BASE_CAMERA_DISTANCE, BASE_CAMERA_DISTANCE * 0.5, BASE_CAMERA_DISTANCE)
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

  raycaster = new THREE.Raycaster()
  raycaster.params.Points.threshold = 3
  mouse = new THREE.Vector2()
}

/** Picking personnalisé : hitbox proportionnelle à la taille apparente de chaque étoile (espace écran). */
function pickStarAtMouse(event) {
  if (!containerRef.value || !camera || !points.value?.length) return null
  const rect = containerRef.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  const width = rect.width
  const height = rect.height
  const scaleFactor = (0.5 * height) / Math.tan((camera.fov * Math.PI) / 360)
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
    const worldSize = isHighlight ? HIGHLIGHT_RING_SIZE : ((p.size ?? STAR_SPRITE_BASE_SIZE) || STAR_SPRITE_BASE_SIZE)
    const screenSizePx = Math.max(STAR_SPRITE_MIN_PIXELS, (worldSize * scaleFactor) / Math.max(0.1, camDist))
    const hitRadius = Math.max(6, screenSizePx * 0.6)
    if (distPx <= hitRadius) {
      hits.push({ index: i, star: p, distPx, depth: camDist })
    }
  }
  hits.sort((a, b) => a.depth - b.depth)
  return hits[0]?.star ?? null
}

// Opacité des segments de constellation dans la vue 3D de conception.
const CONSTELLATION_OPACITY = 0.5
// Couleur et opacité des segments de transits (trajets visités) — token vert lumineux.
const TRANSIT_LINE_COLOR = COLOR_GREEN_BRIGHT_HEX
const TRANSIT_LINE_OPACITY = 0.8

const circleTexture = getCircleSpriteTexture()

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
    const st = p.star?.spectral_type ?? p.spectral ?? 'M'
    const letter = getSpectralLetter(st)
    if (!byLetter.has(letter)) byLetter.set(letter, [])
    byLetter.get(letter).push(p)
  }

  const group = new THREE.Group()
  for (const [letter, list] of byLetter.entries()) {
    const positions = new Float32Array(list.length * 3)
    const colors = new Float32Array(list.length * 3)
    for (let i = 0; i < list.length; i++) {
      const p = list[i]
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
      colors[i * 3] = p.r
      colors[i * 3 + 1] = p.g
      colors[i * 3 + 2] = p.b
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
      size: STAR_SPRITE_BASE_SIZE,
      map: circleTexture, // placeholder, remplacé async par texture SVG
      vertexColors: true,
      sizeAttenuation: true,
      transparent: true,
      // Quand les constellations sont affichées, réduire fortement l'opacité des étoiles pour mettre les segments en avant.
      opacity: props.constellationsEnabled ? 0.3 : 0.95,
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
  const pts = points.value
  const highlightId = props.focusStarId
  if (!highlightId || !pts.length) return null

  let x, y, z
  const p = pts.find((s) => s.id === highlightId)
  if (p) {
    x = p.x
    y = p.y
    z = p.z
  } else {
    const system = stellarSystemsStore.list.find((s) => s.id === highlightId)
    const coords = system?.coordinates || {}
    const bc = barycentre.value ?? { x: 0, y: 0, z: 0 }
    if (coords.x == null) return null
    x = (coords.x ?? 0) - (bc.x ?? 0)
    y = (coords.y ?? 0) - (bc.y ?? 0)
    z = (coords.z ?? 0) - (bc.z ?? 0)
  }

  return createHighlightSprite(x, y, z)
}

function buildConstellationLinesMesh() {
  if (!props.constellationsEnabled) return null
  const lines = stellarSystemsStore.constellationLines || []
  const positionsById = constellationPositionsById.value
  const segments = getVisibleConstellationSegments(lines, positionsById)
  if (!segments.length) return null

  const vertices = []
  for (const { from, to } of segments) {
    vertices.push(from.x, from.y, from.z)
    vertices.push(to.x, to.y, to.z)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  const material = new THREE.LineBasicMaterial({
    color: HIGHLIGHT_CYAN_HEX,
    transparent: true,
    opacity: CONSTELLATION_OPACITY,
  })

  return new THREE.LineSegments(geometry, material)
}

function buildTransitLinesMesh() {
  if (!props.transitsEnabled || !props.transitsSegments?.length) return null
  const positionsById = constellationPositionsById.value
  if (!positionsById || !(positionsById instanceof Map)) return null

  const vertices = []
  for (const { fromId, toId } of props.transitsSegments) {
    const from = positionsById.get(fromId)
    const to = positionsById.get(toId)
    if (!from || !to) continue
    vertices.push(from.x, from.y, from.z)
    vertices.push(to.x, to.y, to.z)
  }
  if (vertices.length === 0) return null

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  const material = new THREE.LineBasicMaterial({
    color: TRANSIT_LINE_COLOR,
    transparent: true,
    opacity: TRANSIT_LINE_OPACITY,
  })
  return new THREE.LineSegments(geometry, material)
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
  if (constellationLinesMesh) {
    scene.remove(constellationLinesMesh)
    constellationLinesMesh.geometry.dispose()
    constellationLinesMesh.material.dispose()
  }
  if (transitLinesMesh) {
    scene.remove(transitLinesMesh)
    transitLinesMesh.geometry.dispose()
    transitLinesMesh.material.dispose()
  }
  pointsMesh = buildPointsMesh()
  if (pointsMesh) {
    scene.add(pointsMesh)
  }
  highlightMesh = buildHighlightMesh()
  if (highlightMesh) {
    scene.add(highlightMesh)
  }
  constellationLinesMesh = buildConstellationLinesMesh()
  if (constellationLinesMesh) {
    scene.add(constellationLinesMesh)
  }
  transitLinesMesh = buildTransitLinesMesh()
  if (transitLinesMesh) {
    scene.add(transitLinesMesh)
  }
}

function animate() {
  rafId = requestAnimationFrame(animate)
  if (controls && !isFocusAnimating) controls.update()
  if (highlightMesh && containerRef.value && camera) {
    updateHighlightScale(highlightMesh, camera, containerRef.value.clientHeight || 1)
  }
  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }
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
  // Utiliser la position depuis points (même source que le rendu) pour éviter tout décalage (pulsars, D, O-B-A, etc.)
  let pos = null
  const p = points.value.find((s) => s.id === starId)
  if (p && p.x != null && p.y != null && p.z != null) {
    pos = { x: p.x, y: p.y, z: p.z }
  }
  if (!pos) pos = getStarPositionById(starId)
  if (!pos) {
    const system = stellarSystemsStore.list.find((s) => s.id === starId)
    const coords = system?.coordinates || {}
    const bc = barycentre.value ?? { x: 0, y: 0, z: 0 }
    if (coords.x != null) {
      pos = { x: (coords.x ?? 0) - (bc.x ?? 0), y: (coords.y ?? 0) - (bc.y ?? 0), z: (coords.z ?? 0) - (bc.z ?? 0) }
    } else if (coords.ra != null && coords.dec != null) {
      const ra = (coords.ra ?? 0) * (Math.PI / 180)
      const dec = (coords.dec ?? 0) * (Math.PI / 180)
      const d = parseFloat(system?.distance) || 1
      const x = d * Math.cos(dec) * Math.cos(ra) - (bc.x ?? 0)
      const y = d * Math.cos(dec) * Math.sin(ra) - (bc.y ?? 0)
      const z = d * Math.sin(dec) - (bc.z ?? 0)
      pos = { x, y, z }
    }
  }
  if (!pos || !camera || !controls) return

  animateFocusTo(camera, controls, pos, {
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

function onCanvasClick(event) {
  if (!containerRef.value || !camera) return
  if (mouseDownPos) {
    const dist = Math.hypot(event.clientX - mouseDownPos.x, event.clientY - mouseDownPos.y)
    mouseDownPos = null
    if (dist > CLICK_DRAG_THRESHOLD) return
  }
  const star = pickStarAtMouse(event)
  if (star) {
    emit('focus-star', star)
  } else {
    emit('clear-focus')
  }
}

watch(
  () => [
    points.value,
    props.constellationsEnabled,
    props.transitsEnabled,
    props.transitsSegments,
    constellationPositionsById.value,
  ],
  () => updatePoints(),
  { deep: true }
)

// focusStarId : lancer l’animation de caméra d’abord, puis mettre à jour le highlight à la frame suivante pour éviter le sursaut au clic
watch(
  () => props.focusStarId,
  (id) => {
    if (id) {
      focusOnStar(id)
    } else {
      animateToBarycentre()
    }
    requestAnimationFrame(() => updatePoints())
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
  }
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
  if (containerRef.value) {
    containerRef.value.removeEventListener('mousedown', onCanvasMouseDown)
    containerRef.value.removeEventListener('click', onCanvasClick)
    if (resizeObserver) resizeObserver.unobserve(containerRef.value)
    if (renderer?.domElement) containerRef.value.removeChild(renderer.domElement)
  }
  if (pointsMesh) {
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
    highlightMesh.material?.dispose()
  }
  if (constellationLinesMesh) {
    constellationLinesMesh.geometry?.dispose()
    constellationLinesMesh.material?.dispose()
  }
  if (transitLinesMesh) {
    transitLinesMesh.geometry?.dispose()
    transitLinesMesh.material?.dispose()
  }
  renderer?.dispose()
})
</script>

<template>
  <div ref="containerRef" class="stars-3d-canvas" />
</template>

<style scoped>
.stars-3d-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
