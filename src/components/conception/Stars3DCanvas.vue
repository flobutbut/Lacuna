<script setup>
import { ref, watch, computed } from 'vue'
import * as THREE from 'three'
import { useStars3DConception } from '@/composables/useStars3DConception'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { getCircleSpriteTexture } from '@/lib/starSpriteTexture'
import { createHighlightSprite, updateHighlightScale } from '@/composables/useStarHighlight'
import { useThreeStarScene, applyMinSizeToPointsMaterial } from '@/composables/useThreeStarScene'
import { getVisibleConstellationSegments } from '@/lib/constellationSegments'
import { loadStarSvgTextureForSpectralType } from '@/composables/useStarSvgTexture'
import { getSpectralLetter } from '@/lib/starClassification'
import { HIGHLIGHT_CYAN_HEX, STAR_SPRITE_BASE_SIZE } from '@/constants/starDisplay'
import { buildTransitLinesMesh } from '@/composables/useTransitLines3d'

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

let pointsMesh = null // THREE.Group (sprites par type spectral)
let highlightMesh = null
let constellationLinesMesh = null
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
    if (star) emit('focus-star', star)
    else emit('clear-focus')
  },
})

// Opacité des segments de constellation dans la vue 3D de conception.
const CONSTELLATION_OPACITY = 0.5

const circleTexture = getCircleSpriteTexture()

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

function buildTransitLinesMeshLocal() {
  if (!props.transitsEnabled || !props.transitsSegments?.length) return null
  return buildTransitLinesMesh(props.transitsSegments, constellationPositionsById.value)
}

function updatePoints() {
  if (!three.scene) return
  pointsMesh = replaceObject(pointsMesh, buildPointsMesh())
  highlightMesh = replaceObject(highlightMesh, buildHighlightMesh())
  constellationLinesMesh = replaceObject(constellationLinesMesh, buildConstellationLinesMesh())
  transitLinesMesh = replaceObject(transitLinesMesh, buildTransitLinesMeshLocal())
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
  focusOn(pos)
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
      focusBarycentre()
    }
    requestAnimationFrame(() => updatePoints())
  }
)
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
