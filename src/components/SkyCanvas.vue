<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useObservatoireStore } from '@/stores/observatoire'
import { useSignauxStore } from '@/stores/signaux'
import { useRadarStore } from '@/stores/radar'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useShipStore } from '@/stores/ship'
import { useNebulasStore } from '@/stores/nebulas'
import { useMapNodesStore } from '@/stores/mapNodes'
import { projectStarInFov, xyzToRaDec } from '@/lib/stellarProjection'
import { distanceToSegment, lerpAngle } from '@/lib/geometry'
import { getSystemXyz } from '@/lib/stellarCoordinates'
import { drawCurvedGrid, drawMilkyWay, drawNebulas, drawStars, drawSignals, drawSpectralBorder, drawConstellationLines } from '@/lib/skyRenderers'
import { useSkyStars } from '@/composables/useSkyStars'
import { supernovaState, SUPERNOVA_STAR_ID } from '@/lib/supernova'
import { useStarSelection } from '@/composables/useStarSelection'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

const observatoireStore = useObservatoireStore()
const { selectStar: selectStarForFocus } = useStarSelection({ mode: 'observatoire' })
const nebulasStore = useNebulasStore()
const { spectralFilter, exoplanetFilter, searchedStarId, constellationsEnabled } = storeToRefs(observatoireStore)

const CONSTELLATION_HOVER_THRESHOLD = 12

const signauxStore = useSignauxStore()
const radarStore = useRadarStore()
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

/** Signaux affichés sur le ciel : encore actifs, et seulement quand le radar est allumé */
function visibleSignals(now) {
  if (!radarStore.radarEnabled) return []
  // Un émetteur du système courant et une bouffée de neutrinos n'ont pas de direction sur le ciel
  return signauxStore.list.filter(
    (s) => s.sourceType !== 'EMITTER' && s.support !== 'NEUTRINO' && now - s.createdAt < s.lifetimeMs
  )
}

const PAN_SENSITIVITY = 0.15
const PAN_DRAG_THRESHOLD = 5
const LERP_SPEED = 0.05

const { buildStarsFromDb, updateStarBandParams } = useSkyStars(spectralFilter, exoplanetFilter)

function getViewerCoords() {
  // Pendant un transit, on utilise une position interpolée entre système courant et destination
  const currentId = shipStore.currentSystemId
  const destId = shipStore.travelDestination
  const isTransit = shipStore.isInTransit && destId && shipStore.travelDepartureAt && shipStore.travelArrivalAt

  const currentSystem = stellarSystemsStore.list.find((s) => s.id === currentId)
  const currentCoords = currentSystem ? getSystemXyz(currentSystem) : { x: 0, y: 0, z: 0 }

  if (!isTransit) {
    return currentCoords
  }

  const destSystem = stellarSystemsStore.list.find((s) => s.id === destId)
  const destCoords = destSystem ? getSystemXyz(destSystem) : null
  if (!destCoords) {
    // Si la destination n'est pas connue dans le catalogue actuel, rester au système courant
    return currentCoords
  }

  const depMs = new Date(shipStore.travelDepartureAt).getTime()
  const arrMs = new Date(shipStore.travelArrivalAt).getTime()
  const now = Date.now()
  let t = 0
  if (arrMs > depMs) {
    t = (now - depMs) / (arrMs - depMs)
  }
  if (t < 0) t = 0
  if (t > 1) t = 1
  // Profil d'avancement légèrement ease-in-out pour adoucir l'animation
  const eased = t <= 0 ? 0 : t >= 1 ? 1 : 3 * t * t - 2 * t * t * t

  return {
    x: currentCoords.x + (destCoords.x - currentCoords.x) * eased,
    y: currentCoords.y + (destCoords.y - currentCoords.y) * eased,
    z: currentCoords.z + (destCoords.z - currentCoords.z) * eased,
  }
}

function rebuildStars() {
  if (!canvasEl) return
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

function onSpectralFilterChange() {
  if (canvasEl && stars.value?.length > 0) {
    updateStarBandParams(stars.value, spectralFilter.value)
  } else {
    rebuildStars()
  }
}

let ctx = null
let animId = null

function recenterOnTransitTarget() {
  if (!shipStore.isInTransit || !shipStore.travelDestination) return
  const destId = shipStore.travelDestination
  const star = stars.value.find((s) => s.id === destId)
  if (!star) return
  const ra = star.ra
  const dec = star.dec
  // On ne met à jour que la cible : la vue courante va interpoler progressivement
  observatoireStore.setTargetViewDirectionValue({ ra, dec })
}

function draw(canvas, starsRef) {
  if (!canvas || !ctx) return
  const starList = starsRef.value
  const w = canvas.width
  const h = canvas.height

  if (!isPanning.value) {
    const vd = observatoireStore.viewDirection?.value ?? observatoireStore.viewDirection?.value ?? observatoireStore.viewDirection
    const tv = observatoireStore.targetViewDirection?.value ?? observatoireStore.targetViewDirection?.value ?? observatoireStore.targetViewDirection
    const k = 1 - Math.pow(1 - LERP_SPEED, 1.5)
    observatoireStore.setViewDirectionValue({
      ra: lerpAngle(vd.ra, tv.ra, k),
      dec: vd.dec + (tv.dec - vd.dec) * k,
    })
  }

  const vd = observatoireStore.viewDirection?.value ?? observatoireStore.viewDirection
  const viewerCoords = getViewerCoords()
  const band = spectralFilter.value

  ctx.clearRect(0, 0, w, h)
  drawCurvedGrid(ctx, w, h)
  drawMilkyWay(ctx, w, h)

  if (band === 'ir') {
    drawNebulas(ctx, nebulasStore.forSky('ir'), vd.ra, vd.dec, w, h, getViewerCoords())
  }

  let selected = observatoireStore.selectedStar
  const activeSignals = visibleSignals(Date.now())

  // Pendant un transit, marquer la destination comme cible de cap (highlight spécifique)
  if (shipStore.isInTransit && shipStore.travelDestination) {
    const destId = shipStore.travelDestination
    starList.forEach((s) => {
      s.isCapTarget = s.id === destId
    })
  } else {
    starList.forEach((s) => {
      s.isCapTarget = false
    })
  }

  const projectedPositions = new Map()
  starList.forEach((s) => {
    let ra = s.ra
    let dec = s.dec
    if (s.star && s.star.coordinates) {
      const coords = s.star.coordinates
      const dx = (coords.x ?? 0) - (viewerCoords.x ?? 0)
      const dy = (coords.y ?? 0) - (viewerCoords.y ?? 0)
      const dz = (coords.z ?? 0) - (viewerCoords.z ?? 0)
      const res = xyzToRaDec(dx, dy, dz)
      ra = res.ra
      dec = res.dec
    }
    const pos = projectStarInFov(ra, dec, vd.ra, vd.dec, w, h)
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

  const supernovaLevel = supernovaState(shipStore.supernovaT0).level
  const supernovaStar = starList.find((s) => s.id === SUPERNOVA_STAR_ID)
  if (supernovaStar) supernovaStar.supernovaLevel = supernovaLevel

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
  // Pas de hover/tooltip du ciel quand le pointeur est sur un élément d'interface (tuiles, barres, menus…) ;
  // le déplacement de la vue continue même si le glisser passe au-dessus de l'interface
  if (!isPanning.value && !mouseDown.value && e?.target !== canvas) {
    observatoireStore.setReticuleVisible(false)
    observatoireStore.hoveredStar = null
    observatoireStore.setHoveredSignal(null)
    observatoireStore.setHoveredConstellation(null)
    return
  }

  const vd = observatoireStore.viewDirection?.value ?? observatoireStore.viewDirection
  if (isPanning.value) {
    const dx = (e.clientX - lastPanPos.value.x) * PAN_SENSITIVITY
    const dy = (e.clientY - lastPanPos.value.y) * PAN_SENSITIVITY
    const next = {
      ra: (vd.ra + dx + 360) % 360,
      dec: Math.max(-89, Math.min(89, vd.dec + dy)),
    }
    observatoireStore.setViewDirectionValue(next)
    observatoireStore.setTargetViewDirectionValue(next)
    lastPanPos.value = { x: e.clientX, y: e.clientY }
    hasPanned.value = true
    return
  }
  if (mouseDown.value && !isPanning.value) {
    const d = Math.hypot(e.clientX - lastPanPos.value.x, e.clientY - lastPanPos.value.y)
    if (d > PAN_DRAG_THRESHOLD) {
      isPanning.value = true
      hasPanned.value = true
      observatoireStore.clearSearchedStarId()
      observatoireStore.hoveredStar = null
      observatoireStore.setHoveredSignal(null)
      observatoireStore.setHoveredConstellation(null)
      return handleMouseMove(e, starList, canvas)
    }
  }
  const { x: mx, y: my } = screenToCanvas(e, canvas)
  const w = canvas.width
  const h = canvas.height
  observatoireStore.setReticulePosition(e.clientX, e.clientY)
  observatoireStore.setReticuleVisible(true)

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

  const activeSignals = visibleSignals(Date.now())
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
    observatoireStore.hoveredStar = null
    observatoireStore.setHoveredConstellation(null)
    observatoireStore.setHoveredSignal(closestSignal)
  } else if (closestStar) {
    observatoireStore.setHoveredSignal(null)
    observatoireStore.setHoveredConstellation(null)
    observatoireStore.hoveredStar = closestStar
  } else {
    observatoireStore.setHoveredSignal(null)
    observatoireStore.hoveredStar = null
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
      observatoireStore.setHoveredConstellation({ abbr: closestLine.constellation_abbr, name })
    } else {
      observatoireStore.setHoveredConstellation(null)
    }
  }
}

function handleMouseLeave() {
  mouseDown.value = false
  isPanning.value = false
  observatoireStore.hoveredStar = null
  observatoireStore.setHoveredSignal(null)
  observatoireStore.setHoveredConstellation(null)
  observatoireStore.setReticuleVisible(false)
}

function handleMouseDown(e) {
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
  const tv = observatoireStore.targetViewDirection?.value ?? observatoireStore.targetViewDirection
  const step = 8
  let dra = 0
  let ddec = 0
  if (e.key === 'ArrowLeft') dra = -step
  if (e.key === 'ArrowRight') dra = step
  if (e.key === 'ArrowUp') ddec = step
  if (e.key === 'ArrowDown') ddec = -step
  observatoireStore.setTargetViewDirectionValue({
    ra: (tv.ra + dra + 360) % 360,
    dec: Math.max(-89, Math.min(89, tv.dec + ddec)),
  })
}

function handleClick() {
  if (hasPanned.value) return
  if (observatoireStore.hoveredSignal) {
    observatoireStore.selectSignal(observatoireStore.hoveredSignal)
    return
  }
  const s = observatoireStore.hoveredStar
  if (s) {
    observatoireStore.selectStar(s)
    selectStarForFocus(s)
    observatoireStore.setTargetViewDirectionValue({ ra: s.ra, dec: s.dec })
  } else {
    observatoireStore.selectStar(null)
    selectStarForFocus(null)
  }
}

function handleDblClick() {
  if (hasPanned.value) return
  if (observatoireStore.hoveredSignal) {
    observatoireStore.selectSignal(observatoireStore.hoveredSignal)
    return
  }
  const s = observatoireStore.hoveredStar
  if (s) {
    observatoireStore.selectStar(s)
    observatoireStore.openObservatoire()
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
  const vd = observatoireStore.viewDirection?.value ?? observatoireStore.viewDirection
  if (
    shipStore.currentSystemId === 'SOL' &&
    Math.abs((vd?.ra ?? 180) - 180) < 0.5 &&
    Math.abs(vd?.dec ?? 0) < 0.5
  ) {
    const PROXIMA_RA = 217.5
    const PROXIMA_DEC = -62.7
    observatoireStore.setViewDirectionValue({ ra: PROXIMA_RA, dec: PROXIMA_DEC })
    observatoireStore.setTargetViewDirectionValue({ ra: PROXIMA_RA, dec: PROXIMA_DEC })
  }

  draw(canvasEl, stars)

  // Chargement progressif : passe 1 → passe 2 → passe 3 (visibleForSky mis à jour à chaque fois, watch déclenche rebuildStars)
  stellarSystemsStore.fetchVisibleForSky(shipStore.currentSystemId, 18)
  // Constellations en parallèle, sans bloquer l'affichage des étoiles
  stellarSystemsStore.fetchConstellationLines()

  onResize = () => handleResize(canvasEl)
  onMove = (e) => handleMouseMove(e, stars.value, canvasEl)
  onDown = (e) => handleMouseDown(e)
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
    <div v-if="shipStore.isInTransit" class="sky-transit-overlay">
      <div class="sky-transit-box" @click.stop="recenterOnTransitTarget">
        <div class="sky-transit-line sky-transit-line--primary">
          {{ shipStore.currentTransitPhase || 'IN_TRANSIT' }}
        </div>
      </div>
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
  bottom: var(--space-6);
  left: var(--space-6);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  color: var(--color-muted);
  opacity: 0.4;
  font-family: var(--font-mono);
}

.sky-transit-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.sky-transit-box {
  min-width: 220px;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  color: var(--color-amber);
  text-align: center;
  text-shadow: 0 0 8px var(--color-shade-90);
  transform: translateY(-40px);
  pointer-events: auto;
}

.sky-transit-line--primary {
  text-transform: uppercase;
  color: var(--color-amber);
}
</style>
