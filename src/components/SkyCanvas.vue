<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useSignauxStore } from '@/stores/signaux'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useShipStore } from '@/stores/ship'
import { useNebulasStore } from '@/stores/nebulas'
import { projectStarInFov } from '@/lib/stellarProjection'
import { drawMilkyWay, drawCurvedGrid, drawNebulas, drawStars, drawSignals, drawSpectralBorder } from '@/lib/skyRenderers'
import { useSkyStars } from '@/composables/useSkyStars'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

const ui = useUIStore()
const nebulasStore = useNebulasStore()
const { spectralFilter, searchedStarId } = storeToRefs(ui)
const signauxStore = useSignauxStore()
const stellarSystemsStore = useStellarSystemsStore()
const shipStore = useShipStore()
const canvasRef = ref(null)
const stars = ref([])
const isPanning = ref(false)
const lastPanPos = ref({ x: 0, y: 0 })
const hasPanned = ref(false)
const mouseDown = ref(false)

const PAN_SENSITIVITY = 0.15
const PAN_DRAG_THRESHOLD = 5
const LERP_SPEED = 0.05

const buildStarsFromDb = useSkyStars(spectralFilter)

function lerpAngle(a, b, t) {
  let d = ((b - a + 540) % 360) - 180
  return a + d * t
}

let ctx = null
let animId = null

function draw(canvas, starsRef) {
  if (!canvas || !ctx) return
  const starList = starsRef.value
  const w = canvas.width
  const h = canvas.height

  if (!isPanning.value) {
    const vd = ui.viewDirection?.value ?? ui.viewDirection?.value ?? ui.viewDirection
    const tv = ui.targetViewDirection?.value ?? ui.targetViewDirection?.value ?? ui.targetViewDirection
    const k = 1 - Math.pow(1 - LERP_SPEED, 1.5)
    ui.setViewDirectionValue({
      ra: lerpAngle(vd.ra, tv.ra, k),
      dec: vd.dec + (tv.dec - vd.dec) * k,
    })
  }

  const vd = ui.viewDirection?.value ?? ui.viewDirection
  const band = spectralFilter.value

  ctx.clearRect(0, 0, w, h)
  drawCurvedGrid(ctx, w, h)
  drawMilkyWay(ctx, w, h)

  if (band === 'ir') {
    drawNebulas(ctx, nebulasStore.forSky('ir'), vd.ra, vd.dec, w, h)
  }

  const selected = ui.selectedStar
  const now = Date.now()
  const activeSignals = signauxStore.list.filter((s) => now - s.createdAt < s.lifetimeMs)

  drawStars(ctx, starList, vd.ra, vd.dec, w, h, selected, searchedStarId.value)
  drawSignals(ctx, activeSignals, vd.ra, vd.dec, w, h)
  drawSpectralBorder(ctx, band, w, h)

  animId = requestAnimationFrame(() => draw(canvas, starsRef))
}

function handleResize(canvas) {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

function screenToCanvas(e, canvas) {
  const rect = canvas.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function handleMouseMove(e, starList, canvas) {
  const vd = ui.viewDirection?.value ?? ui.viewDirection
  if (isPanning.value) {
    const dx = (e.clientX - lastPanPos.value.x) * PAN_SENSITIVITY
    const dy = (e.clientY - lastPanPos.value.y) * PAN_SENSITIVITY
    const next = {
      ra: (vd.ra + dx + 360) % 360,
      dec: Math.max(-89, Math.min(89, vd.dec + dy)),
    }
    ui.setViewDirectionValue(next)
    ui.setTargetViewDirectionValue(next)
    lastPanPos.value = { x: e.clientX, y: e.clientY }
    hasPanned.value = true
    return
  }
  if (mouseDown.value && !isPanning.value) {
    const d = Math.hypot(e.clientX - lastPanPos.value.x, e.clientY - lastPanPos.value.y)
    if (d > PAN_DRAG_THRESHOLD) {
      isPanning.value = true
      hasPanned.value = true
      ui.clearSearchedStarId()
      return handleMouseMove(e, starList, canvas)
    }
  }
  const { x: mx, y: my } = screenToCanvas(e, canvas)
  const w = canvas.width
  const h = canvas.height
  ui.setReticulePosition(e.clientX, e.clientY)
  ui.setReticuleVisible(true)

  let closestStar = null
  let minStarDist = 18
  starList.forEach((s) => {
    const pos = projectStarInFov(s.ra, s.dec, vd.ra, vd.dec, w, h)
    if (!pos) return
    const d = Math.hypot(pos.x - mx, pos.y - my)
    if (d < minStarDist) {
      minStarDist = d
      closestStar = s
    }
  })

  const now = Date.now()
  const activeSignals = signauxStore.list.filter((s) => now - s.createdAt < s.lifetimeMs)
  let closestSignal = null
  let minSignalDist = 16
  activeSignals.forEach((sig) => {
    const ra = sig.ra ?? sig.azimuth ?? 0
    const dec = sig.dec ?? sig.elevation ?? 0
    const pos = projectStarInFov(ra, dec, vd.ra, vd.dec, w, h)
    if (!pos) return
    const d = Math.hypot(pos.x - mx, pos.y - my)
    if (d < minSignalDist) {
      minSignalDist = d
      closestSignal = sig
    }
  })

  if (closestSignal && (!closestStar || minSignalDist < minStarDist)) {
    ui.hoveredStar = null
    ui.setHoveredSignal(closestSignal)
  } else {
    ui.setHoveredSignal(null)
    ui.hoveredStar = closestStar
  }
}

function handleMouseLeave() {
  mouseDown.value = false
  isPanning.value = false
  ui.hoveredStar = null
  ui.setHoveredSignal(null)
  ui.setReticuleVisible(false)
}

function handleMouseDown(e, canvas) {
  if (e.button !== 0) return
  mouseDown.value = true
  isPanning.value = false
  hasPanned.value = false
  lastPanPos.value = { x: e.clientX, y: e.clientY }
}

function handleMouseUp(e) {
  if (e.button !== 0) return
  mouseDown.value = false
  isPanning.value = false
}

function handleKeyDown(e, canvas) {
  if (!canvas) return
  if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  if (!keys.includes(e.key)) return
  e.preventDefault()
  const tv = ui.targetViewDirection?.value ?? ui.targetViewDirection
  const step = 8
  let dra = 0
  let ddec = 0
  if (e.key === 'ArrowLeft') dra = -step
  if (e.key === 'ArrowRight') dra = step
  if (e.key === 'ArrowUp') ddec = step
  if (e.key === 'ArrowDown') ddec = -step
  ui.setTargetViewDirectionValue({
    ra: (tv.ra + dra + 360) % 360,
    dec: Math.max(-89, Math.min(89, tv.dec + ddec)),
  })
}

function handleClick() {
  if (hasPanned.value) return
  if (ui.hoveredSignal) {
    ui.selectSignal(ui.hoveredSignal)
    return
  }
  const s = ui.hoveredStar
  if (s) {
    ui.selectStar(s)
  } else {
    ui.selectStar(null)
  }
}

function handleDblClick() {
  if (hasPanned.value) return
  if (ui.hoveredSignal) {
    ui.selectSignal(ui.hoveredSignal)
    return
  }
  const s = ui.hoveredStar
  if (s) {
    ui.selectStar(s)
    ui.openObservatoire()
  }
}

let canvasEl = null
let onResize = null
let onMove = null
let onDown = null
let onClick = null
let onDblClick = null
let onKeyDown = null

onMounted(async () => {
  canvasEl = canvasRef.value
  if (!canvasEl) return
  const w = window.innerWidth
  const h = window.innerHeight
  canvasEl.width = w
  canvasEl.height = h
  ctx = canvasEl.getContext('2d')

  await ensureStoresLoaded(shipStore, stellarSystemsStore, nebulasStore)
  await stellarSystemsStore.fetchVisibleForSky(shipStore.currentSystemId, 14)
  stars.value = buildStarsFromDb()

  draw(canvasEl, stars)

  onResize = () => handleResize(canvasEl)
  onMove = (e) => handleMouseMove(e, stars.value, canvasEl)
  onDown = (e) => handleMouseDown(e, canvasEl)
  onClick = handleClick
  onDblClick = handleDblClick
  onKeyDown = (e) => handleKeyDown(e, canvasEl)

  window.addEventListener('resize', onResize)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('mousemove', onMove)
  canvasEl.addEventListener('mousedown', onDown)
  canvasEl.addEventListener('mouseleave', handleMouseLeave)
  canvasEl.addEventListener('click', onClick)
  canvasEl.addEventListener('dblclick', onDblClick)
})

watch(spectralFilter, () => {
  if (canvasEl) {
    stars.value = buildStarsFromDb()
  }
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('mousemove', onMove)
  if (canvasEl) {
    canvasEl.removeEventListener('mousedown', onDown)
    canvasEl.removeEventListener('mouseleave', handleMouseLeave)
    canvasEl.removeEventListener('click', onClick)
    canvasEl.removeEventListener('dblclick', onDblClick)
  }
})
</script>

<template>
  <div class="sky-wrapper">
    <canvas
      ref="canvasRef"
      class="sky-canvas"
      :class="{ 'sky-canvas--panning': isPanning }"
    />
  </div>
</template>

<style scoped>
.sky-wrapper {
  position: fixed;
  inset: 0;
  z-index: 0;
}
.sky-canvas {
  position: absolute;
  inset: 0;
  cursor: grab;
}
.sky-canvas--panning {
  cursor: grabbing;
}
</style>
