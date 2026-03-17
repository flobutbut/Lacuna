<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useStars3DConception } from '@/composables/useStars3DConception'

const props = defineProps({
  /** ID de l'étoile à focus (caméra se déplace vers elle) */
  focusStarId: { type: String, default: null },
  /** Filtre spectral (visible, ir, uv, r) — même que Observatoire */
  spectralFilter: { type: String, default: 'visible' },
  /** Filtre exoplanètes */
  exoplanetFilter: { type: Boolean, default: false },
})

const containerRef = ref(null)
const spectralFilterRef = computed(() => props.spectralFilter)
const exoplanetFilterRef = computed(() => props.exoplanetFilter)
const { points, getStarPositionById } = useStars3DConception(spectralFilterRef, exoplanetFilterRef)

let scene = null
let camera = null
let renderer = null
let controls = null
let pointsMesh = null
let highlightMesh = null
let rafId = null
let resizeObserver = null

const BASE_CAMERA_DISTANCE = 80
const FOCUS_ANIM_DURATION_MS = 800

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
  controls.maxDistance = 500
  controls.enablePan = true
}

/** Couleur cyan design system pour highlight */
const HIGHLIGHT_COLOR = new THREE.Color(0x00b4c8)
const HIGHLIGHT_SIZE = 3.2

function buildPointsMesh() {
  const pts = points.value
  if (!pts.length) return null

  const positions = new Float32Array(pts.length * 3)
  const colors = new Float32Array(pts.length * 3)

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]
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
    size: 0.8,
    vertexColors: true,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.9,
  })

  return new THREE.Points(geometry, material)
}

function buildHighlightMesh() {
  const pts = points.value
  const highlightId = props.focusStarId
  if (!highlightId || !pts.length) return null

  const p = pts.find((s) => s.id === highlightId)
  if (!p) return null

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([p.x, p.y, p.z], 3))

  const material = new THREE.PointsMaterial({
    size: HIGHLIGHT_SIZE,
    color: HIGHLIGHT_COLOR,
    sizeAttenuation: true,
    transparent: true,
    opacity: 1,
  })

  return new THREE.Points(geometry, material)
}

function updatePoints() {
  if (!scene) return
  if (pointsMesh) {
    scene.remove(pointsMesh)
    pointsMesh.geometry.dispose()
    pointsMesh.material.dispose()
  }
  if (highlightMesh) {
    scene.remove(highlightMesh)
    highlightMesh.geometry.dispose()
    highlightMesh.material.dispose()
  }
  pointsMesh = buildPointsMesh()
  if (pointsMesh) {
    scene.add(pointsMesh)
  }
  highlightMesh = buildHighlightMesh()
  if (highlightMesh) {
    scene.add(highlightMesh)
  }
}

function animate() {
  rafId = requestAnimationFrame(animate)
  if (controls) controls.update()
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
  const pos = getStarPositionById(starId)
  if (!pos || !camera || !controls) return

  const target = new THREE.Vector3(pos.x, pos.y, pos.z)
  const dist = Math.hypot(pos.x, pos.y, pos.z)
  const camDist = Math.max(15, Math.min(200, dist * 2))

  controls.target.copy(target)

  const startPos = camera.position.clone()
  const endPos = target.clone().add(
    new THREE.Vector3(camDist * 0.6, camDist * 0.3, camDist * 0.6).normalize().multiplyScalar(camDist)
  )

  const startTime = performance.now()
  function lerpCam(now) {
    const t = Math.min(1, (now - startTime) / FOCUS_ANIM_DURATION_MS)
    const eased = 1 - (1 - t) ** 2
    camera.position.lerpVectors(startPos, endPos, eased)
    if (t < 1) requestAnimationFrame(lerpCam)
  }
  requestAnimationFrame(lerpCam)
}

watch(
  () => [points.value, props.focusStarId],
  () => updatePoints(),
  { deep: true }
)

watch(
  () => props.focusStarId,
  (id) => {
    if (id) focusOnStar(id)
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
  }
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('resize', resize)
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
  if (containerRef.value && renderer?.domElement) {
    containerRef.value.removeChild(renderer.domElement)
  }
  if (pointsMesh) {
    pointsMesh.geometry?.dispose()
    pointsMesh.material?.dispose()
  }
  if (highlightMesh) {
    highlightMesh.geometry?.dispose()
    highlightMesh.material?.dispose()
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
