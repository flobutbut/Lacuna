<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useSignauxStore } from '@/stores/signaux'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useShipStore } from '@/stores/ship'
import { useNebulasStore } from '@/stores/nebulas'
import { useMapNodesStore } from '@/stores/mapNodes'
import { projectStarInFov } from '@/lib/stellarProjection'
import { drawCurvedGrid, drawMilkyWay, drawNebulas, drawStars, drawSignals, drawSpectralBorder, drawConstellationLines } from '@/lib/skyRenderers'
import { useSkyStars } from '@/composables/useSkyStars'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

const ui = useUIStore()
const nebulasStore = useNebulasStore()
const { spectralFilter, exoplanetFilter, searchedStarId, constellationsEnabled } = storeToRefs(ui)

const CONSTELLATION_HOVER_THRESHOLD = 12

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - x1, py - y1)
  let t = ((px - x1) * dx + (py - y1) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  return Math.hypot(px - projX, py - projY)
}
const signauxStore = useSignauxStore()
const stellarSystemsStore = useStellarSystemsStore()
const shipStore = useShipStore()
const mapStore = useMapNodesStore()
const canvasRef = ref(null)
const stars = ref([])
/** Liste complète (sans filtre exoplanètes) pour positions des segments de constellation quand filtre exoplanètes actif */
const starsForConstellations = ref([])
const isPanning = ref(false)
const lastPanPos = ref({ x: 0, y: 0 })
const hasPanned = ref(false)
const mouseDown = ref(false)

const PAN_SENSITIVITY = 0.15
const PAN_DRAG_THRESHOLD = 5
const LERP_SPEED = 0.05

const { buildStarsFromDb, updateStarBandParams } = useSkyStars(spectralFilter, exoplanetFilter)

function getViewerCoords() {
  const viewerSystem = stellarSystemsStore.list.find((s) => s.id === shipStore.currentSystemId)
  const coords = viewerSystem?.coordinates ?? { x: 0, y: 0, z: 0 }
  return coords
}

function rebuildStars() {
  if (canvasEl) {
    const coords = getViewerCoords()
    const prevList = stars.value
    const nextList = buildStarsFromDb(coords) ?? []
    nextList.forEach((s) => {
      const prev = prevList.find((p) => p.id === s.id)
      if (prev != null && prev.opacityCurrent != null) {
        s.opacityCurrent = prev.opacityCurrent
      }
    })
    stars.value = nextList
    if (exoplanetFilter.value && constellationsEnabled.value) {
      starsForConstellations.value = buildStarsFromDb(coords, { skipExoplanetFilter: true }) ?? []
    } else {
      starsForConstellations.value = []
    }
  }
}

function onSpectralFilterChange() {
  if (canvasEl && stars.value?.length > 0) {
    updateStarBandParams(stars.value, spectralFilter.value)
  } else {
    rebuildStars()
  }
}

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
    drawNebulas(ctx, nebulasStore.forSky('ir'), vd.ra, vd.dec, w, h, getViewerCoords())
  }

  const selected = ui.selectedStar
  const now = Date.now()
  const activeSignals = signauxStore.list.filter((s) => now - s.createdAt < s.lifetimeMs)

  const projectedPositions = new Map()
  starList.forEach((s) => {
    const pos = projectStarInFov(s.ra, s.dec, vd.ra, vd.dec, w, h)
    if (pos) projectedPositions.set(s.id, pos)
  })

  if (constellationsEnabled.value && stellarSystemsStore.constellationLines.length) {
    const listForConstellations = exoplanetFilter.value && starsForConstellations.value.length ? starsForConstellations.value : starList
    const constellationPositions = new Map()
    listForConstellations.forEach((s) => {
      const pos = projectStarInFov(s.ra, s.dec, vd.ra, vd.dec, w, h)
      if (pos) constellationPositions.set(s.id, pos)
    })
    const constellationOpacity = exoplanetFilter.value ? 0.15 : 0.35
    drawConstellationLines(ctx, stellarSystemsStore.constellationLines, constellationPositions, w, h, constellationOpacity)
  }

  drawStars(ctx, starList, vd.ra, vd.dec, w, h, selected, searchedStarId.value, projectedPositions)
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
      ui.hoveredStar = null
      ui.setHoveredSignal(null)
      ui.setHoveredConstellation(null)
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
    ui.setHoveredConstellation(null)
    ui.setHoveredSignal(closestSignal)
  } else if (closestStar) {
    ui.setHoveredSignal(null)
    ui.setHoveredConstellation(null)
    ui.hoveredStar = closestStar
  } else {
    ui.setHoveredSignal(null)
    ui.hoveredStar = null
    let closestLine = null
    let minLineDist = CONSTELLATION_HOVER_THRESHOLD
    if (constellationsEnabled.value && stellarSystemsStore.constellationLines.length) {
      const listForConstellations = exoplanetFilter.value && starsForConstellations.value.length ? starsForConstellations.value : starList
      const projectedPositions = new Map()
      listForConstellations.forEach((s) => {
        const pos = projectStarInFov(s.ra, s.dec, vd.ra, vd.dec, w, h)
        if (pos) projectedPositions.set(s.id, pos)
      })
      stellarSystemsStore.constellationLines.forEach((seg) => {
        const posFrom = projectedPositions.get(seg.star_from)
        const posTo = projectedPositions.get(seg.star_to)
        if (!posFrom || !posTo) return
        const d = distanceToSegment(mx, my, posFrom.x, posFrom.y, posTo.x, posTo.y)
        if (d < minLineDist) {
          minLineDist = d
          closestLine = seg
        }
      })
    }
    if (closestLine) {
      const c = closestLine.constellations
      const name = c?.name_fr || c?.name_latin || closestLine.constellation_abbr || ''
      ui.setHoveredConstellation({ abbr: closestLine.constellation_abbr, name })
    } else {
      ui.setHoveredConstellation(null)
    }
  }
}

function handleMouseLeave() {
  mouseDown.value = false
  isPanning.value = false
  ui.hoveredStar = null
  ui.setHoveredSignal(null)
  ui.setHoveredConstellation(null)
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
  await ensureStoresLoaded(mapStore)

  // Premier affichage immédiat (list ou fallback procédural) — chargement progressif en arrière-plan
  rebuildStars()

  // Vue initiale : centrer sur Proxima quand à SOL (ra 180, dec 0 met Proxima hors FOV ~69°)
  const vd = ui.viewDirection?.value ?? ui.viewDirection
  if (
    shipStore.currentSystemId === 'SOL' &&
    Math.abs((vd?.ra ?? 180) - 180) < 0.5 &&
    Math.abs(vd?.dec ?? 0) < 0.5
  ) {
    const PROXIMA_RA = 217.5
    const PROXIMA_DEC = -62.7
    ui.setViewDirectionValue({ ra: PROXIMA_RA, dec: PROXIMA_DEC })
    ui.setTargetViewDirectionValue({ ra: PROXIMA_RA, dec: PROXIMA_DEC })
  }

  draw(canvasEl, stars)

  // Chargement progressif : passe 1 → passe 2 → passe 3 (visibleForSky mis à jour à chaque fois, watch déclenche rebuildStars)
  stellarSystemsStore.fetchVisibleForSky(shipStore.currentSystemId, 18)
  // Constellations en parallèle, sans bloquer l'affichage des étoiles
  stellarSystemsStore.fetchConstellationLines()

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

// Reconstruire les étoiles quand la carte change (visited)
watch(
  () => mapStore.nodes,
  () => {
    if (canvasEl) rebuildStars()
  },
  { deep: true }
)

watch(spectralFilter, onSpectralFilterChange)
watch(exoplanetFilter, () => {
  if (canvasEl) rebuildStars()
})

watch(constellationsEnabled, () => {
  if (constellationsEnabled.value && exoplanetFilter.value && canvasEl) rebuildStars()
})

watch(
  () => stellarSystemsStore.visibleForSky.length,
  () => {
    if (canvasEl) rebuildStars()
  },
  { immediate: false }
)

watch(
  () => shipStore.currentSystemId,
  (newId) => {
    stellarSystemsStore.fetchVisibleForSky(newId, 18)
    // rebuildStars déclenché par le watch sur visibleForSky.length à chaque passe
  }
)

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
    <div
      v-if="stellarSystemsStore.skyLoadingPass2 || stellarSystemsStore.skyLoadingPass3"
      class="sky-loading-indicator"
    >
      CATALOGUE EN COURS…
    </div>
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
.sky-loading-indicator {
  position: absolute;
  bottom: 12px;
  left: 12px;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--color-muted);
  opacity: 0.4;
  font-family: var(--font-mono);
}
</style>
