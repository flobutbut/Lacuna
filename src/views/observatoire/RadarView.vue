<script setup>
/**
 * Vue Radar — spectrogramme temps réel + courbe d'intensité.
 * Écrit une colonne par tick d'acquisition dans le buffer partagé (lu aussi par RadarMiniature),
 * même masquée. Dessine seulement quand la vue est visible et que l'image a changé.
 */
import { ref, computed, onMounted, onUnmounted, watch, inject, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRadarStore } from '@/stores/radar'
import { useSignauxStore } from '@/stores/signaux'
import { useObservatoireStore } from '@/stores/observatoire'
import { computeSpectrogramColumn, SAMPLE_RATE } from '@/lib/spectrogramData'
import { getCssVar } from '@/lib/cssVars'
import {
  RADAR_FREQ_BINS as FREQ_BINS,
  RADAR_TICK_MS as TICK_MS,
  ageAtPx,
  ageLabelInterval,
  binAtY,
  binToHz,
  binsToYRange,
  columnIndexAt,
  dbDisplayScale,
  dbToLevel,
  formatAgeLabel,
  freqRangeToBins,
  injectPulsarSignals,
  magnitudeToDb,
  ticksPerPixel,
} from '@/lib/radarSpectrum'
import * as d3 from 'd3'

const emit = defineEmits(['signal-selected'])

const radarSpectrogram = inject('radarSpectrogram')
const radarColumnBuffer = inject('radarColumnBuffer')
const {
  tickCount,
  getBufferSnapshotAt,
  WINDOW_SIZE,
  HISTORY_SIZE,
} = radarSpectrogram

const radarStore = useRadarStore()
const signauxStore = useSignauxStore()
const observatoireStore = useObservatoireStore()
const {
  radarPaused,
  radarSelectionMode,
  radarTimeScale,
  radarIntensityThreshold,
  radarFreqLow,
  radarFreqHigh,
  radarNoiseEnabled,
  radarEnabled,
} = storeToRefs(radarStore)

/** La vue radar est montée en permanence (v-show) : ne dessiner que lorsqu'elle est affichée */
const isVisible = computed(() => observatoireStore.observatoireViewMode === 'radar')

const containerRef = ref(null)
const chartsWrapRef = ref(null)
const spectrogramCanvasRef = ref(null)
const intensityCanvasRef = ref(null)

const margin = { left: 58, right: 8, top: 8, bottom: 24 }
/** Échantillons acquis par tick (pas entre deux colonnes) */
const SAMPLES_PER_TICK = Math.round((SAMPLE_RATE * TICK_MS) / 1000)

/** Palette Viridis précalculée (256 × RGB) pour écrire les pixels sans parser de couleur */
const VIRIDIS_LUT = (() => {
  const lut = new Uint8ClampedArray(256 * 3)
  for (let i = 0; i < 256; i++) {
    const c = d3.rgb(d3.interpolateViridis(i / 255))
    lut[i * 3] = c.r
    lut[i * 3 + 1] = c.g
    lut[i * 3 + 2] = c.b
  }
  return lut
})()

let lastAppendedTick = tickCount.value
let rafId = null
let needsDraw = true
let resizeObserver = null

let selectionStartCol = null
let selectionEndCol = null
let selectionStartBin = null
let selectionEndBin = null
let isDragging = false
let dragStartBin = null

let cursorX = null
let cursorY = null
let cursorChart = null

const canvasWidth = ref(800)
const showLiveButton = ref(false)
let currentScrollOffset = 0
let targetScrollOffset = 0
const EASE_FACTOR = 0.10
const LIVE_THRESHOLD = 1

// ── Données : une colonne par tick ───────────────────────────────────────────

function appendColumnFromSnapshot(snapshot, windowSize = WINDOW_SIZE) {
  if (!snapshot || snapshot.length < windowSize) return

  const { magnitudes } =
    computeSpectrogramColumn(snapshot, FREQ_BINS)
  if (!magnitudes.length) return

  // Pulsars de la bande active, après FFT ; temps d'acquisition réel de la colonne (indépendant de l'échelle d'affichage)
  injectPulsarSignals(magnitudes, signauxStore.activePulsarSignals, {
    tSec: (radarColumnBuffer.count * TICK_MS) / 1000,
    dtSec: TICK_MS / 1000,
    freqBins: FREQ_BINS,
  })

  // Magnitudes brutes : la normalisation (dB, fenêtre visible) se fait au dessin
  radarColumnBuffer.columnBuffer[radarColumnBuffer.writeCol] = {
    magnitudes: new Float32Array(magnitudes),
  }
  radarColumnBuffer.writeCol =
    (radarColumnBuffer.writeCol + 1) % HISTORY_SIZE
  radarColumnBuffer.count += 1
}

/**
 * Ajoute une colonne pour chaque tick non encore traité (du plus ancien au plus récent),
 * chacune sur sa propre fenêtre d'échantillons : pas de doublon, même après une pause ou un onglet en arrière-plan.
 */
function catchUpColumns() {
  const missed = tickCount.value - lastAppendedTick
  if (missed <= 0) return
  const toFill = Math.min(missed, HISTORY_SIZE)
  for (let i = toFill - 1; i >= 0; i--) {
    const snapshot = getBufferSnapshotAt(i * SAMPLES_PER_TICK, WINDOW_SIZE)
    if (snapshot) appendColumnFromSnapshot(snapshot)
  }
  lastAppendedTick = tickCount.value
  needsDraw = true
}

/** Colonnes réellement disponibles dans l'historique */
function availableColumns() {
  return Math.min(radarColumnBuffer.count, HISTORY_SIZE)
}

// ── Géométrie ────────────────────────────────────────────────────────────────

function getTicksPerPx() {
  return ticksPerPixel(radarTimeScale.value)
}

/** Défilement converti en colonnes (même arrondi que columnIndexAt) */
function scrollColumns(ticksPerPx) {
  return Math.round(currentScrollOffset * ticksPerPx)
}

/** Âge (en colonnes) de la colonne la plus récente représentée au pixel px de la zone utile */
function ageAtPlotPx(px, innerW, ticksPerPx) {
  return ageAtPx(px, innerW, ticksPerPx, scrollColumns(ticksPerPx))
}

/** px = 0..innerW-1 dans la zone utile (sans marge gauche) */
function colIdxFromPlotPx(px, innerW, ticksPerPx) {
  return columnIndexAt({
    writeCol: radarColumnBuffer.writeCol,
    px,
    innerW,
    ticksPerPx,
    historySize: HISTORY_SIZE,
    scrollOffset: currentScrollOffset,
  })
}

/** Géométrie fréquences ↔ hauteur du spectrogramme (zoom fréquentiel compris) */
function specGeometry(specCanvas) {
  const { binLow, binRange } = freqRangeToBins(radarFreqLow.value, radarFreqHigh.value, FREQ_BINS)
  return {
    top: margin.top,
    innerH: specCanvas.height - margin.top - margin.bottom,
    binLow,
    binRange,
  }
}

// ── Dessin ───────────────────────────────────────────────────────────────────

function drawViewport() {
  if (!radarEnabled.value) return
  const specCanvas = spectrogramCanvasRef.value
  const intCanvas = intensityCanvasRef.value
  if (!specCanvas || !intCanvas) return

  const innerW = specCanvas.width - margin.left - margin.right
  const innerH = specCanvas.height - margin.top - margin.bottom
  const intH = intCanvas.height - margin.top - margin.bottom

  const specCtx = specCanvas.getContext('2d')
  const intCtx = intCanvas.getContext('2d')

  const bg = getCssVar('--color-bg')
  specCtx.fillStyle = bg
  specCtx.fillRect(0, 0, specCanvas.width, specCanvas.height)
  intCtx.fillStyle = bg
  intCtx.fillRect(0, 0, intCanvas.width, intCanvas.height)
  if (innerW <= 0 || innerH <= 0 || intH <= 0) return

  const ticksPerPx = getTicksPerPx()
  // Un pixel couvre au moins une colonne ; à 10 ms (zoom ×10), une colonne s'étale sur 10 pixels
  const colsPerPx = Math.max(1, Math.round(ticksPerPx))
  const threshold = radarIntensityThreshold.value
  const available = availableColumns()
  const geom = specGeometry(specCanvas)
  const binLow = geom.binLow
  const binRange = geom.binRange
  const { columnBuffer, writeCol } = radarColumnBuffer

  // 1. Magnitudes de la fenêtre visible en dB (pixel × bin de la plage zoomée), NaN sans données.
  //    Un pixel couvrant plusieurs colonnes garde le maximum (une impulsion brève reste visible).
  const winDb = new Float32Array(innerW * binRange).fill(NaN)
  for (let px = 0; px < innerW; px++) {
    const ageStart = ageAtPlotPx(px, innerW, ticksPerPx)
    // Au-delà de l'historique : pas de données (évite de reboucler sur le buffer circulaire)
    if (ageStart >= available) continue
    const ageEnd = Math.min(ageStart + colsPerPx, available)
    const base = px * binRange
    for (let age = ageStart; age < ageEnd; age++) {
      const col = columnBuffer[(writeCol - 1 - age + HISTORY_SIZE) % HISTORY_SIZE]
      if (!col) continue
      const m = col.magnitudes
      for (let i = 0; i < binRange; i++) {
        const db = magnitudeToDb(m[binLow + i] ?? 0)
        if (!(db <= winDb[base + i])) winDb[base + i] = db
      }
    }
  }

  // 2. Échelle de la fenêtre : plancher sous le bruit médian, plafond au maximum visible
  const scale = dbDisplayScale(winDb)

  // Ligne de pixels → indice dans la plage zoomée (haut = fréquence haute)
  const rowIdx = new Int16Array(innerH)
  for (let y = 0; y < innerH; y++) rowIdx[y] = (binAtY(margin.top + y + 0.5, geom) ?? binLow) - binLow

  const image = specCtx.createImageData(innerW, innerH)
  const pixels = image.data
  intCtx.fillStyle = getCssVar('--color-cyan')

  for (let px = 0; scale && px < innerW; px++) {
    const base = px * binRange
    if (Number.isNaN(winDb[base])) continue
    // Intensité du pixel : niveau du bin le plus fort de la plage affichée, sur la même échelle
    let maxDb = -Infinity
    for (let i = 0; i < binRange; i++) if (winDb[base + i] > maxDb) maxDb = winDb[base + i]
    const intensity = dbToLevel(maxDb, scale)
    if (intensity < threshold) continue

    for (let y = 0; y < innerH; y++) {
      const li = Math.round(dbToLevel(winDb[base + rowIdx[y]], scale) * 255) * 3
      const o = (y * innerW + px) * 4
      pixels[o] = VIRIDIS_LUT[li]
      pixels[o + 1] = VIRIDIS_LUT[li + 1]
      pixels[o + 2] = VIRIDIS_LUT[li + 2]
      pixels[o + 3] = 255
    }

    const barH = Math.max(1, intensity * intH)
    intCtx.fillRect(margin.left + px, intCanvas.height - margin.bottom - barH, 1, barH)
  }
  specCtx.putImageData(image, margin.left, margin.top)

  // Ligne rouge horizontale : seuil d'intensité (filtre)
  if (threshold > 0) {
    const thresholdH = threshold * intH
    const y = intCanvas.height - margin.bottom - thresholdH
    intCtx.globalAlpha = 0.9
    intCtx.strokeStyle = getCssVar('--color-red')
    intCtx.lineWidth = 1
    intCtx.beginPath()
    intCtx.moveTo(margin.left, y)
    intCtx.lineTo(margin.left + innerW, y)
    intCtx.stroke()
    intCtx.globalAlpha = 1
  }

  drawTimeLabels(specCtx, intCtx, specCanvas, intCanvas, innerW, ticksPerPx, available)
  drawAxes(specCanvas, intCanvas)
  drawSelection(specCanvas, intCanvas)
  drawCrosshair(specCanvas, intCanvas)
}

/** Axe X : repères à âge rond (30 s à 100 ms par pixel, espacement proportionnel à l'échelle) */
function drawTimeLabels(specCtx, intCtx, specCanvas, intCanvas, innerW, ticksPerPx, available) {
  const interval = ageLabelInterval(ticksPerPx)
  const scrollCols = scrollColumns(ticksPerPx)
  const lastAge = Math.min(available, scrollCols + Math.floor(innerW * ticksPerPx))
  const muted = getCssVar('--color-muted')
  for (let age = Math.ceil(scrollCols / interval) * interval; age < lastAge; age += interval) {
    const xPos = margin.left + innerW - 1 - Math.floor((age - scrollCols) / ticksPerPx)
    const label = formatAgeLabel(age, TICK_MS)
    for (const { ctx, canvasH } of [
      { ctx: specCtx, canvasH: specCanvas.height },
      { ctx: intCtx, canvasH: intCanvas.height },
    ]) {
      ctx.globalAlpha = 0.15
      ctx.strokeStyle = muted
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(xPos, margin.top)
      ctx.lineTo(xPos, canvasH - margin.bottom)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = muted
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(label, xPos, canvasH - 4)
    }
  }
}

function drawAxes(specCanvas, intCanvas) {
  const specCtx = specCanvas.getContext('2d')
  const intCtx = intCanvas.getContext('2d')
  const specH = specCanvas.height
  const specInnerH = specH - margin.top - margin.bottom
  const muted = getCssVar('--color-muted')

  specCtx.fillStyle = muted
  specCtx.font = '9px var(--font-mono)'
  intCtx.fillStyle = muted
  intCtx.font = '9px var(--font-mono)'

  const ticksY = [
    radarFreqHigh.value,
    Math.round((radarFreqLow.value + radarFreqHigh.value) / 2),
    radarFreqLow.value,
  ]
  ticksY.forEach((f, idx) => {
    const y = margin.top + (idx / 2) * specInnerH
    specCtx.textAlign = 'right'
    specCtx.fillText(f + ' Hz', margin.left - 2, y + 3)
  })

  specCtx.textAlign = 'left'
  intCtx.textAlign = 'right'
  intCtx.fillText('intens.', margin.left - 4, margin.top + 3)
  intCtx.textAlign = 'left'
}

function colToPlotX(col, innerW) {
  const ticksPerPx = getTicksPerPx()
  for (let px = 0; px < innerW; px++) {
    if (colIdxFromPlotPx(px, innerW, ticksPerPx) === col) return margin.left + px
  }
  return null
}

function drawSelection(specCanvas, intCanvas) {
  const s0 = selectionStartCol
  const s1 = selectionEndCol
  if (s0 == null || s1 == null) return

  const innerW = specCanvas.width - margin.left - margin.right
  const leftPx = colToPlotX(Math.min(s0, s1), innerW)
  const rightPx = colToPlotX(Math.max(s0, s1), innerW)
  if (leftPx == null || rightPx == null) return

  const specCtx = specCanvas.getContext('2d')
  const intCtx = intCanvas.getContext('2d')
  const cyan = getCssVar('--color-cyan')
  const selectionFill = getCssVar('--color-cyan-active')
  specCtx.fillStyle = selectionFill
  specCtx.strokeStyle = cyan
  specCtx.lineWidth = 1
  const band = selectionStartBin != null && selectionEndBin != null
    ? binsToYRange(selectionStartBin, selectionEndBin, specGeometry(specCanvas))
    : { y: margin.top, h: specCanvas.height - margin.top - margin.bottom }
  if (band) {
    specCtx.fillRect(leftPx, band.y, rightPx - leftPx, band.h)
    specCtx.strokeRect(leftPx, band.y, rightPx - leftPx, band.h)
  }
  intCtx.fillStyle = selectionFill
  intCtx.strokeStyle = cyan
  intCtx.lineWidth = 1
  intCtx.fillRect(leftPx, margin.top, rightPx - leftPx, intCanvas.height - margin.top - margin.bottom)
  intCtx.strokeRect(leftPx, margin.top, rightPx - leftPx, intCanvas.height - margin.top - margin.bottom)
}

function drawCrosshair(specCanvas, intCanvas) {
  if (selectionStartCol != null && selectionEndCol != null) return
  if (cursorX == null || cursorChart == null) return
  if (!radarPaused.value || !radarSelectionMode.value) return

  const innerW = specCanvas.width - margin.left - margin.right
  if (cursorX < margin.left || cursorX > margin.left + innerW) return

  const specCtx = specCanvas.getContext('2d')
  const intCtx = intCanvas.getContext('2d')
  const muted = getCssVar('--color-muted')

  specCtx.strokeStyle = muted
  specCtx.globalAlpha = 0.5
  specCtx.lineWidth = 1
  intCtx.strokeStyle = muted
  intCtx.globalAlpha = 0.5
  intCtx.lineWidth = 1

  specCtx.beginPath()
  specCtx.moveTo(cursorX, 0)
  specCtx.lineTo(cursorX, specCanvas.height)
  specCtx.stroke()

  intCtx.beginPath()
  intCtx.moveTo(cursorX, 0)
  intCtx.lineTo(cursorX, intCanvas.height)
  intCtx.stroke()

  if (cursorY != null) {
    if (cursorChart === 'spec') {
      specCtx.beginPath()
      specCtx.moveTo(margin.left, cursorY)
      specCtx.lineTo(specCanvas.width - margin.right, cursorY)
      specCtx.stroke()
    } else {
      intCtx.beginPath()
      intCtx.moveTo(margin.left, cursorY)
      intCtx.lineTo(intCanvas.width - margin.right, cursorY)
      intCtx.stroke()
    }
  }

  specCtx.globalAlpha = 1
  intCtx.globalAlpha = 1
}

// ── Sélection ────────────────────────────────────────────────────────────────

function pxToCol(px) {
  const innerW = spectrogramCanvasRef.value
    ? spectrogramCanvasRef.value.width - margin.left - margin.right
    : 400
  const rel = Math.floor(px - margin.left)
  if (rel < 0 || rel >= innerW) return null
  const ticksPerPx = getTicksPerPx()
  if (ageAtPlotPx(rel, innerW, ticksPerPx) >= availableColumns()) return null
  return colIdxFromPlotPx(rel, innerW, ticksPerPx)
}

/** Bin sous le pointeur (même correspondance que le dessin : haut = aigu, zoom compris) */
function pxToBin(py) {
  const specCanvas = spectrogramCanvasRef.value
  if (!specCanvas) return null
  return binAtY(py, specGeometry(specCanvas))
}

function clearSelection() {
  selectionStartCol = null
  selectionEndCol = null
  selectionStartBin = null
  selectionEndBin = null
}

function isClickOutsideSelection(col, bin) {
  if (selectionStartCol == null || selectionEndCol == null) return false
  const minCol = Math.min(selectionStartCol, selectionEndCol)
  const maxCol = Math.max(selectionStartCol, selectionEndCol)
  if (col < minCol || col > maxCol) return true
  if (radarSelectionMode.value === 'period') return false
  if (selectionStartBin == null || selectionEndBin == null) return false
  const minBin = Math.min(selectionStartBin, selectionEndBin)
  const maxBin = Math.max(selectionStartBin, selectionEndBin)
  return bin != null && (bin < minBin || bin > maxBin)
}

function onPointerDown(e, chart, py) {
  if (!radarPaused.value || !radarSelectionMode.value) return
  const rect = e.currentTarget.getBoundingClientRect()
  const px = e.clientX - rect.left
  const col = pxToCol(px)
  if (col == null) return
  const bin = chart === 'spec' && py != null ? pxToBin(py) : null
  if (isClickOutsideSelection(col, bin)) {
    clearSelection()
    needsDraw = true
    return
  }
  isDragging = true
  // Période : sélection temps uniquement (toute la hauteur). Zone : col×bin sur le spectrogramme.
  if (radarSelectionMode.value === 'period') {
    dragStartBin = null
    selectionStartBin = null
    selectionEndBin = null
  } else {
    dragStartBin = bin
    selectionStartBin = dragStartBin
    selectionEndBin = dragStartBin
  }
  selectionStartCol = col
  selectionEndCol = col
  needsDraw = true
}

function onCursorMove(e, chart) {
  const rect = e.currentTarget.getBoundingClientRect()
  cursorX = e.clientX - rect.left
  cursorY = e.offsetY
  cursorChart = chart
  if (selectionStartCol == null || selectionEndCol == null) needsDraw = true
}

function onCursorLeave(e) {
  const wrap = chartsWrapRef.value
  if (wrap && e.relatedTarget && wrap.contains(e.relatedTarget)) return
  cursorX = null
  cursorY = null
  cursorChart = null
  needsDraw = true
}

function onPointerMove(e, chart, py) {
  if (!isDragging) return
  const rect = e.currentTarget.getBoundingClientRect()
  const px = e.clientX - rect.left
  const col = pxToCol(px)
  if (col == null) return
  selectionEndCol = col
  if (radarSelectionMode.value === 'zone' && chart === 'spec' && py != null) {
    const bin = pxToBin(py)
    if (bin != null) selectionEndBin = bin
  }
  onCursorMove(e, chart)
  needsDraw = true
}

function onPointerUp() {
  if (!isDragging) return
  isDragging = false
  needsDraw = true
  const s0 = selectionStartCol
  const s1 = selectionEndCol
  if (s0 != null && s1 != null) {
    const hasBins = selectionStartBin != null && selectionEndBin != null
    const startBin = hasBins ? Math.min(selectionStartBin, selectionEndBin) : null
    const endBin = hasBins ? Math.max(selectionStartBin, selectionEndBin) : null
    emit('signal-selected', {
      startCol: Math.min(s0, s1),
      endCol: Math.max(s0, s1),
      // Bins de fréquence croissants (0 = 0 Hz) et bornes en Hz
      startBin,
      endBin,
      lowHz: hasBins ? binToHz(startBin) : null,
      highHz: hasBins ? binToHz(endBin + 1) : null,
      snr: 0,
    })
  }
}

// ── Boucle d'affichage (seulement quand la vue est visible) ──────────────────

function frame() {
  rafId = null
  if (!isVisible.value || !radarEnabled.value) return
  if (!radarPaused.value) {
    const diff = targetScrollOffset - currentScrollOffset
    if (Math.abs(diff) < LIVE_THRESHOLD) {
      if (currentScrollOffset !== 0) needsDraw = true
      currentScrollOffset = 0
      targetScrollOffset = 0
      showLiveButton.value = false
    } else {
      currentScrollOffset += diff * EASE_FACTOR
      showLiveButton.value = true
      needsDraw = true
    }
  } else {
    showLiveButton.value = currentScrollOffset > LIVE_THRESHOLD
  }
  if (needsDraw) {
    needsDraw = false
    drawViewport()
  }
  rafId = requestAnimationFrame(frame)
}

function startLoop() {
  if (rafId == null && isVisible.value && radarEnabled.value) rafId = requestAnimationFrame(frame)
}

function stopLoop() {
  if (rafId != null) cancelAnimationFrame(rafId)
  rafId = null
}

function onWheel(e) {
  if (!radarEnabled.value || !radarPaused.value) return
  e.preventDefault()
  e.stopPropagation()
  const specCanvas = spectrogramCanvasRef.value
  if (!specCanvas) return
  const innerW = specCanvas.width - margin.left - margin.right
  const ticksPerPx = getTicksPerPx()
  // Défilement en pixels : au plus jusqu'à la colonne la plus ancienne disponible
  const maxScroll = Math.max(0, (availableColumns() - innerW * ticksPerPx) / ticksPerPx)
  const delta =
    Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
  targetScrollOffset -= delta
  targetScrollOffset = Math.max(0, Math.min(targetScrollOffset, maxScroll))
  currentScrollOffset = targetScrollOffset
  needsDraw = true
}

// ── Taille des canvas (sans toucher aux données) ─────────────────────────────

function resizeCanvases() {
  const specCanvas = spectrogramCanvasRef.value
  const intCanvas = intensityCanvasRef.value
  if (!specCanvas || !intCanvas) return
  const w = specCanvas.parentElement?.clientWidth || 0
  const specH = specCanvas.parentElement?.clientHeight || 0
  const intH = intCanvas.parentElement?.clientHeight || 0
  // Vue masquée (display: none) : tailles nulles, on garde les dimensions actuelles
  if (!w || !specH || !intH) return
  if (specCanvas.width === w && specCanvas.height === specH && intCanvas.width === w && intCanvas.height === intH) return
  canvasWidth.value = w
  specCanvas.width = w
  specCanvas.height = specH
  specCanvas.style.width = w + 'px'
  specCanvas.style.height = specH + 'px'
  intCanvas.width = w
  intCanvas.height = intH
  intCanvas.style.width = w + 'px'
  intCanvas.style.height = intH + 'px'
  needsDraw = true
}

onMounted(() => {
  resizeCanvases()
  resizeObserver = new ResizeObserver(() => resizeCanvases())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
  if (chartsWrapRef.value) resizeObserver.observe(chartsWrapRef.value)

  const rootEl = containerRef.value
  if (rootEl) rootEl.addEventListener('wheel', onWheel, { passive: false, capture: true })

  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointerleave', onPointerUp)
  startLoop()
})

onUnmounted(() => {
  stopLoop()
  resizeObserver?.disconnect()
  const rootEl = containerRef.value
  if (rootEl) rootEl.removeEventListener('wheel', onWheel, { capture: true })
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointerleave', onPointerUp)
})

// Acquisition : une colonne par tick, que la vue soit affichée ou non (la miniature lit le même buffer)
watch(tickCount, () => {
  if (radarEnabled.value && !radarPaused.value) catchUpColumns()
})

watch(isVisible, async (visible) => {
  if (!visible) return stopLoop()
  await nextTick()
  resizeCanvases()
  needsDraw = true
  startLoop()
})

watch(radarEnabled, async (on) => {
  if (!on) return stopLoop()
  await nextTick()
  // Pas de colonnes pour la période coupée : on reprend au tick courant
  lastAppendedTick = tickCount.value
  resizeCanvases()
  needsDraw = true
  startLoop()
})

watch(radarPaused, () => {
  if (!radarEnabled.value) return
  if (!radarPaused.value) {
    // Rejoue les ticks acquis pendant la pause, du plus ancien au plus récent
    catchUpColumns()
    currentScrollOffset = 0
    targetScrollOffset = 0
    radarStore.setRadarSelectionMode(null)
    clearSelection()
  } else {
    targetScrollOffset = currentScrollOffset
    radarStore.setRadarSelectionMode('zone')
  }
  needsDraw = true
})

watch(radarSelectionMode, () => {
  clearSelection()
  cursorX = null
  cursorY = null
  cursorChart = null
  needsDraw = true
})

watch(
  [radarIntensityThreshold, radarFreqLow, radarFreqHigh, radarNoiseEnabled, radarTimeScale],
  () => {
    needsDraw = true
  }
)
</script>

<template>
  <div ref="containerRef" class="radar-view">
    <div ref="chartsWrapRef" class="radar-view__charts">
      <div class="radar-view__spectrogram">
        <button
          v-if="radarEnabled && showLiveButton"
          type="button"
          class="radar-view__live-btn"
          @click="targetScrollOffset = 0"
        >
          ● RETOUR AU LIVE
        </button>
        <canvas
          v-show="radarEnabled"
          ref="spectrogramCanvasRef"
          class="radar-view__canvas"
        />
        <div
          v-if="!radarEnabled"
          class="radar-view__placeholder"
          role="status"
          aria-live="polite"
        >
          <span class="radar-view__placeholder-title">Radar désactivé</span>
          <span class="radar-view__placeholder-hint">
            Activez l’acquisition pour écouter le spectre radio
          </span>
        </div>
        <div
          v-else-if="radarPaused && (radarSelectionMode === 'period' || radarSelectionMode === 'zone')"
          class="radar-view__overlay"
          @pointerdown="(e) => onPointerDown(e, 'spec', e.offsetY)"
          @pointermove="(e) => { onPointerMove(e, 'spec', e.offsetY); if (!isDragging) onCursorMove(e, 'spec'); }"
          @pointerleave="onCursorLeave"
          @pointerup="onPointerUp"
        />
      </div>
      <div class="radar-view__intensity">
        <canvas
          v-show="radarEnabled"
          ref="intensityCanvasRef"
          class="radar-view__canvas"
        />
        <div
          v-if="radarPaused && radarSelectionMode === 'period'"
          class="radar-view__overlay"
          @pointerdown="(e) => onPointerDown(e, 'intensity')"
          @pointermove="(e) => { onPointerMove(e, 'intensity'); if (!isDragging) onCursorMove(e, 'intensity'); }"
          @pointerleave="onCursorLeave"
          @pointerup="onPointerUp"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.radar-view {
  position: absolute;
  inset: 0;
  background: var(--color-bg);
  padding-top: calc(var(--sidebar-offset) + 44px);
  display: flex;
  flex-direction: column;
}
.radar-view__charts {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: var(--space-4);
}
.radar-view__spectrogram {
  flex: 2;
  min-height: 0;
  position: relative;
}
.radar-view__intensity {
  flex: 1;
  min-height: 0;
  position: relative;
}
.radar-view__placeholder {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  background: transparent;
  text-align: center;
  pointer-events: auto;
}
.radar-view__placeholder-title {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-tight);
  text-transform: uppercase;
  color: var(--color-muted);
}
.radar-view__placeholder-hint {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-tight);
  color: var(--color-cyan-muted);
  max-width: 28rem;
}
.radar-view__canvas {
  display: block;
  background: var(--color-bg);
}
.radar-view__live-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  padding: 4px 8px;
  background: var(--color-cyan);
  color: var(--color-bg);
  font: 10px monospace;
  border: none;
  cursor: pointer;
}
.radar-view__overlay {
  position: absolute;
  inset: 0;
  cursor: crosshair;
  z-index: 1;
}
</style>
