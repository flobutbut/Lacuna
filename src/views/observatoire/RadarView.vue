<script setup>
/**
 * Vue Radar — spectrogramme temps réel + courbe d'intensité.
 * Fenêtre glissante fixe, défilement géré par drawViewport().
 */
import { ref, onMounted, onUnmounted, watch, inject, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useSignauxStore } from '@/stores/signaux'
import { computeSpectrogramColumn, SAMPLE_RATE } from '@/lib/spectrogramData'
import * as d3 from 'd3'

const emit = defineEmits(['signal-selected'])

const radarSpectrogram = inject('radarSpectrogram')
const radarColumnBuffer = inject('radarColumnBuffer')
const {
  tickCount,
  getBufferSnapshot,
  getBufferSnapshotAt,
  spectrogramSpec,
  WINDOW_SIZE,
  HISTORY_SIZE,
} = radarSpectrogram

const ui = useUIStore()
const signauxStore = useSignauxStore()
const {
  radarPaused,
  radarSelectionMode,
  radarFrequencyBand,
  radarTimeScale,
  radarIntensityThreshold,
  radarFreqLow,
  radarFreqHigh,
  radarNoiseEnabled,
  radarEnabled,
} = storeToRefs(ui)

const containerRef = ref(null)
const chartsWrapRef = ref(null)
const spectrogramCanvasRef = ref(null)
const intensityCanvasRef = ref(null)

const FREQ_BINS = 128
const TICK_MS = 100
const INTERVAL_TICKS = 300  // toutes les 30s à 100ms/tick
const margin = { left: 58, right: 8, top: 8, bottom: 24 }

let lastRenderedTick = -1
let rafId = null
let resizeObserver = null
let isInitialized = false
let visibilityChangeHandler = null

let selectionStartCol = null
let selectionEndCol = null
let selectionStartBin = null
let selectionEndBin = null
let isDragging = false
let dragStartCol = null
let dragStartBin = null

let cursorX = null
let cursorY = null
let cursorChart = null

const spectrogramHeight = ref(200)
const intensityHeight = ref(100)
const canvasWidth = ref(800)
const showLiveButton = ref(false)
let currentScrollOffset = 0
let targetScrollOffset = 0
let isLive = true
const EASE_FACTOR = 0.10
const LIVE_THRESHOLD = 1

function updateHeights() {
  if (!chartsWrapRef.value) return
  const h = chartsWrapRef.value.clientHeight
  if (h <= 0) return
  spectrogramHeight.value = Math.floor(h * (2 / 3))
  intensityHeight.value = Math.floor(h * (1 / 3))
}

function waitForClientHeight(maxFrames = 10) {
  return new Promise((resolve) => {
    let frame = 0
    function check() {
      if (chartsWrapRef.value?.clientHeight > 0) {
        updateHeights()
        resolve()
        return
      }
      frame++
      if (frame >= maxFrames) {
        updateHeights()
        resolve()
        return
      }
      requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

function initCanvases() {
  if (!containerRef.value || !chartsWrapRef.value) return
  updateHeights()
  const specCanvas = spectrogramCanvasRef.value
  const intCanvas = intensityCanvasRef.value
  if (!specCanvas || !intCanvas) return
  const w = specCanvas.parentElement.clientWidth || 800
  const specH = specCanvas.parentElement.clientHeight || spectrogramHeight.value
  const intH = intCanvas.parentElement.clientHeight || intensityHeight.value
  canvasWidth.value = w
  if (specCanvas) {
    specCanvas.width = w
    specCanvas.height = specH
    specCanvas.style.width = specCanvas.width + 'px'
    specCanvas.style.height = specCanvas.height + 'px'
  }
  if (intCanvas) {
    intCanvas.width = w
    intCanvas.height = intH
    intCanvas.style.width = intCanvas.width + 'px'
    intCanvas.style.height = intCanvas.height + 'px'
  }
  radarColumnBuffer.columnBuffer = new Array(HISTORY_SIZE).fill(null)
  radarColumnBuffer.columnBufferReady = true
  prefillColumnBuffer()
}

const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 1])

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#0a0a0a'
}

function prefillColumnBuffer() {
  const total = radarSpectrogram.totalSamplesWritten()
  if (total < WINDOW_SIZE || !radarColumnBuffer.columnBufferReady) return

  const snapshot = getBufferSnapshot(total)
  if (!snapshot || snapshot.length < WINDOW_SIZE) return

  const numCols = Math.min(total - WINDOW_SIZE + 1, HISTORY_SIZE)

  let maxVal = 1e-6
  const columns = []
  for (let col = 0; col < numCols; col++) {
    const window = snapshot.slice(col, col + WINDOW_SIZE)
    const { magnitudes, intensity } =
      computeSpectrogramColumn(window, FREQ_BINS)
    for (const m of magnitudes) if (m > maxVal) maxVal = m
    columns.push({ magnitudes: new Float32Array(magnitudes), intensity })
  }
  radarColumnBuffer.specMaxVal = maxVal

  for (let col = 0; col < columns.length; col++) {
    radarColumnBuffer.columnBuffer[col] = columns[col]
  }
  radarColumnBuffer.writeCol = columns.length % HISTORY_SIZE
}

function appendColumnFromSnapshot(snapshot, windowSize = WINDOW_SIZE) {
  if (!snapshot || snapshot.length < windowSize || !radarColumnBuffer.columnBufferReady)
    return

  const { magnitudes } =
    computeSpectrogramColumn(snapshot, FREQ_BINS)
  if (!magnitudes.length) return

  // Injection des signaux pulsars dans le domaine
  // fréquentiel — après FFT, avant normalisation
  const signals = signauxStore.activePulsarSignals
  if (signals?.length) {
    // Temps simulé courant en secondes (échelle UI, pas le tick buffer réel)
    const tSec = (radarColumnBuffer.writeCol * radarTimeScale.value) / 1000

    for (const signal of signals) {
      if (signal.fluxRelative < radarIntensityThreshold.value) continue
      if (!signal.pulsePeriodS || !signal.fluxRelative) continue

      // Position dans la période courante (0 à 1)
      const phase = (tSec % signal.pulsePeriodS)
        / signal.pulsePeriodS

      // Impulsion : seulement si on est dans
      // les 5% initiaux de la période
      if (phase > 0.05) continue

      // Intensité de l'impulsion selon flux_relative
      // et position dans l'impulsion (gaussienne)
      const fluxCurved = Math.pow(signal.fluxRelative, 0.6)
      // Valeur absolue indépendante de specMaxVal
      // On injecte directement une valeur dans [0,1]
      // qui sera normalisée avec le reste
      const peakAmplitude = fluxCurved * 0.8

      // Forme gaussienne dans le temps :
      // max au début de l'impulsion, décroît vite
      const sigma = 0.02
      const envelope = Math.exp(
        -(phase * phase) / (2 * sigma * sigma)
      )

      const SAMPLE_RATE = 250
      const NYQUIST = SAMPLE_RATE / 2 // 125 Hz

      // Bin central du pulsar
      const rotHz = signal.rotationFrequencyHz
      let centerBin = null
      if (rotHz && rotHz <= NYQUIST) {
        centerBin = Math.round((rotHz / NYQUIST) * FREQ_BINS)
        centerBin = Math.max(0, Math.min(FREQ_BINS - 1, centerBin))
      }

      if (centerBin !== null) {
        // Injection sur quelques bins autour du centre
        // largeur proportionnelle à emission_width_w50_ms
        const width = 3
        for (let b = centerBin - width; b <= centerBin + width; b++) {
          if (b < 0 || b >= FREQ_BINS) continue
          const dist = Math.abs(b - centerBin)
          const binEnvelope = Math.exp(-(dist * dist) / (2 * 1.5 * 1.5))
          magnitudes[b] += peakAmplitude * envelope * binEnvelope
        }
      } else {
        // Pulsar hors plage (milliseconde > 125 Hz)
        // injection sur tous les bins à amplitude réduite
        for (let bin = 0; bin < FREQ_BINS; bin++) {
          magnitudes[bin] += peakAmplitude * envelope * 0.1
        }
      }
    }
  }

  for (const m of magnitudes) {
    if (m > radarColumnBuffer.specMaxVal) radarColumnBuffer.specMaxVal = m
  }

  const norm = radarColumnBuffer.specMaxVal || 1
  const intensityRecalc = Math.max(...magnitudes) / norm
  const intensityFinal = Math.min(1, Math.max(0, intensityRecalc))

  radarColumnBuffer.columnBuffer[radarColumnBuffer.writeCol] = {
    magnitudes: new Float32Array(magnitudes),
    intensity: intensityFinal,
  }
  radarColumnBuffer.writeCol =
    (radarColumnBuffer.writeCol + 1) % HISTORY_SIZE
}

function appendColumn() {
  const snapshot = getBufferSnapshot(WINDOW_SIZE)
  appendColumnFromSnapshot(snapshot)
}

function getTicksPerPx() {
  return Math.max(1, Math.round(radarTimeScale.value / TICK_MS))
}

/** px = 0..innerW-1 dans la zone utile (sans marge gauche) */
function colIdxFromPlotPx(px, innerW, ticksPerPx) {
  const colOffset = (innerW - 1 - px) * ticksPerPx
  return (
    (radarColumnBuffer.writeCol -
      1 -
      colOffset -
      Math.round(currentScrollOffset * ticksPerPx) +
      HISTORY_SIZE * 100) %
    HISTORY_SIZE
  )
}

function drawViewport() {
  if (!radarEnabled.value) return
  const specCanvas = spectrogramCanvasRef.value
  const intCanvas = intensityCanvasRef.value
  if (!specCanvas || !intCanvas || !radarColumnBuffer.columnBufferReady) return

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

  const ticksPerPx = getTicksPerPx()
  const norm = radarColumnBuffer.specMaxVal || 1

  // Convertir les bornes Hz en indices de bins (FREQ_BINS couvre 0–125 Hz)
  const binLow = Math.floor(radarFreqLow.value / 125 * FREQ_BINS)
  const binHigh = Math.ceil(radarFreqHigh.value / 125 * FREQ_BINS)
  const binRange = binHigh - binLow || 1

  for (let px = 0; px < innerW; px++) {
    const colOffset = (innerW - 1 - px) * ticksPerPx
    const colIdx =
      (radarColumnBuffer.writeCol -
        1 -
        colOffset -
        Math.round(currentScrollOffset * ticksPerPx) +
        HISTORY_SIZE * 100) %
      HISTORY_SIZE

    const col = radarColumnBuffer.columnBuffer[colIdx]
    if (!col) continue

    const xPos = margin.left + px

    const maxMag = Math.max(...col.magnitudes)
    const colFlux = maxMag / norm
    if (colFlux < radarIntensityThreshold.value) continue

    for (let row = binLow; row < binHigh; row++) {
      const val = Math.min(1, Math.max(0, col.magnitudes[row] / norm))
      specCtx.fillStyle = colorScale(val)
      const yPos = margin.top
        + (1 - (row - binLow) / binRange) * innerH
      specCtx.fillRect(
        xPos,
        yPos,
        1,
        Math.ceil(innerH / binRange) + 1
      )
    }

    const barH = Math.max(1, col.intensity * intH)
    intCtx.fillStyle = getCssVar('--color-cyan')
    intCtx.fillRect(
      xPos,
      intCanvas.height - margin.bottom - barH,
      1,
      barH
    )
  }

  // Ligne rouge horizontale : seuil d'intensité (filtre)
  const threshold = radarIntensityThreshold.value
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

  // Axe X : repères temps (colonnes logiques + défilement)
  let lastTickAge = -1
  for (let px = 0; px < innerW; px++) {
    const colIdx = colIdxFromPlotPx(px, innerW, ticksPerPx)
    const ageCols =
      (radarColumnBuffer.writeCol - 1 - colIdx + HISTORY_SIZE) % HISTORY_SIZE
    if (ageCols % INTERVAL_TICKS !== 0) continue
    if (ageCols === lastTickAge) continue
    lastTickAge = ageCols
    const xPos = margin.left + px
    const totalSeconds = Math.round(ageCols * TICK_MS / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const label =
      minutes === 0
        ? `-${String(seconds).padStart(2, '0')}s`
        : seconds === 0
          ? `-${minutes}:00`
          : `-${minutes}:${String(seconds).padStart(2, '0')}`
    for (const { ctx, canvasH } of [
      { ctx: specCtx, canvasH: specCanvas.height },
      { ctx: intCtx, canvasH: intCanvas.height },
    ]) {
      ctx.globalAlpha = 0.15
      ctx.strokeStyle = getCssVar('--color-muted')
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(xPos, margin.top)
      ctx.lineTo(xPos, canvasH - margin.bottom)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = getCssVar('--color-muted')
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(label, xPos, canvasH - 4)
    }
  }

  drawAxes(specCanvas, intCanvas)
  drawSelection(specCanvas, intCanvas)
  drawCrosshair(specCanvas, intCanvas)
}

function drawAxes(specCanvas, intCanvas) {
  const specCtx = specCanvas.getContext('2d')
  const intCtx = intCanvas.getContext('2d')
  const specH = specCanvas.height
  const intH = intCanvas.height
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
  specCtx.fillStyle = 'rgba(0, 200, 255, 0.2)'
  specCtx.strokeStyle = cyan
  specCtx.lineWidth = 1
  if (selectionStartBin != null && selectionEndBin != null) {
    const specH = specCanvas.height
    const specInnerH = specH - margin.top - margin.bottom
    const b0 = Math.min(selectionStartBin, selectionEndBin)
    const b1 = Math.max(selectionStartBin, selectionEndBin)
    const top = margin.top + (b0 / FREQ_BINS) * specInnerH
    const h = ((b1 - b0 + 1) / FREQ_BINS) * specInnerH
    specCtx.fillRect(leftPx, top, rightPx - leftPx, h)
    specCtx.strokeRect(leftPx, top, rightPx - leftPx, h)
  } else {
    specCtx.fillRect(leftPx, margin.top, rightPx - leftPx, specCanvas.height - margin.top - margin.bottom)
    specCtx.strokeRect(leftPx, margin.top, rightPx - leftPx, specCanvas.height - margin.top - margin.bottom)
  }
  intCtx.fillStyle = 'rgba(0, 200, 255, 0.2)'
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

function pxToCol(px) {
  const innerW = spectrogramCanvasRef.value
    ? spectrogramCanvasRef.value.width - margin.left - margin.right
    : 400
  const rel = Math.floor(px - margin.left)
  if (rel < 0 || rel >= innerW) return null
  return colIdxFromPlotPx(rel, innerW, getTicksPerPx())
}

function pxToBin(py, wrapHeight) {
  const innerH = wrapHeight - margin.top - margin.bottom
  const rel = py - margin.top
  if (rel < 0 || rel >= innerH) return null
  // row 0 (haut) = haute fréquence, row 127 (bas) = basse fréquence
  const bin = Math.floor((rel / innerH) * FREQ_BINS)
  return Math.max(0, Math.min(FREQ_BINS - 1, bin))
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
  const bin = chart === 'spec' && py != null ? pxToBin(py, spectrogramHeight.value) : null
  if (isClickOutsideSelection(col, bin)) {
    clearSelection()
    drawViewport()
    return
  }
  isDragging = true
  dragStartCol = col
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
}

function onCursorMove(e, chart) {
  const rect = e.currentTarget.getBoundingClientRect()
  cursorX = e.clientX - rect.left
  cursorY = e.offsetY
  cursorChart = chart
  if (selectionStartCol == null || selectionEndCol == null) drawViewport()
}

function onCursorLeave(e) {
  const wrap = chartsWrapRef.value
  if (wrap && e.relatedTarget && wrap.contains(e.relatedTarget)) return
  cursorX = null
  cursorY = null
  cursorChart = null
  drawViewport()
}

function onPointerMove(e, chart, py) {
  if (!isDragging) return
  const rect = e.currentTarget.getBoundingClientRect()
  const px = e.clientX - rect.left
  const col = pxToCol(px)
  if (col == null) return
  selectionEndCol = col
  if (radarSelectionMode.value === 'zone' && chart === 'spec' && py != null) {
    selectionEndBin = pxToBin(py, spectrogramHeight.value)
  }
  onCursorMove(e, chart)
  drawViewport()
}

function onPointerUp() {
  if (!isDragging) return
  isDragging = false
  drawViewport()
  const s0 = selectionStartCol
  const s1 = selectionEndCol
  if (s0 != null && s1 != null) {
    emit('signal-selected', {
      startCol: Math.min(s0, s1),
      endCol: Math.max(s0, s1),
      startBin: selectionStartBin ?? null,
      endBin: selectionEndBin ?? null,
      snr: 0,
    })
  }
}

function renderLoop() {
  if (!radarEnabled.value) return
  const missed = tickCount.value - lastRenderedTick
  const toProcess = Math.min(missed, 10)
  for (let i = 0; i < toProcess; i++) {
    appendColumn()
  }
  lastRenderedTick = tickCount.value
  if (!radarPaused.value) {
    const diff = targetScrollOffset - currentScrollOffset
    if (Math.abs(diff) < LIVE_THRESHOLD) {
      currentScrollOffset = 0
      targetScrollOffset = 0
      isLive = true
      showLiveButton.value = false
    } else {
      currentScrollOffset += diff * EASE_FACTOR
      isLive = false
      showLiveButton.value = true
    }
  } else {
    showLiveButton.value = currentScrollOffset > LIVE_THRESHOLD
  }
  drawViewport()
  if (!radarPaused.value) {
    rafId = requestAnimationFrame(renderLoop)
  }
}

function resumeRenderLoop() {
  rafId = requestAnimationFrame(renderLoop)
}

function onWheel(e) {
  if (!radarEnabled.value || !radarPaused.value) return
  e.preventDefault()
  e.stopPropagation()
  const specCanvas = spectrogramCanvasRef.value
  if (!specCanvas) return
  const innerW = specCanvas.width - margin.left - margin.right
  const ticksPerPx = getTicksPerPx()
  const visibleLogical = innerW * ticksPerPx
  const totalCols = tickCount.value
  const maxScroll = Math.max(
    0,
    Math.min(totalCols, HISTORY_SIZE) - visibleLogical
  )
  const delta =
    Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
  targetScrollOffset -= delta
  targetScrollOffset = Math.max(0, Math.min(targetScrollOffset, maxScroll))
  currentScrollOffset = targetScrollOffset
  drawViewport()
}

onMounted(async () => {
  await waitForClientHeight(10)
  await nextTick()
  initCanvases()
  isInitialized = true
  drawViewport()
  lastRenderedTick = tickCount.value
  if (radarEnabled.value) renderLoop()

  resizeObserver = new ResizeObserver(() => {
    // Ne rien faire si la vue est masquée (v-show → display:none → offsetParent null)
    if (!containerRef.value?.offsetParent) return
    updateHeights()
    if (!isInitialized) return
    const specCanvas = spectrogramCanvasRef.value
    const intCanvas = intensityCanvasRef.value
    if (!specCanvas || !intCanvas) return
    const newW = specCanvas.parentElement?.clientWidth || 800
    const newSpecH = specCanvas.parentElement?.clientHeight || spectrogramHeight.value
    const newIntH = intCanvas.parentElement?.clientHeight || intensityHeight.value
    const specChanged = specCanvas.width !== newW || specCanvas.height !== newSpecH
    const intChanged = intCanvas.width !== newW || intCanvas.height !== newIntH
    if (specChanged || intChanged) {
      isInitialized = false
      canvasWidth.value = newW
      specCanvas.width = newW
      specCanvas.height = newSpecH
      specCanvas.style.width = specCanvas.width + 'px'
      specCanvas.style.height = specCanvas.height + 'px'
      intCanvas.width = newW
      intCanvas.height = newIntH
      intCanvas.style.width = intCanvas.width + 'px'
      intCanvas.style.height = intCanvas.height + 'px'
      radarColumnBuffer.columnBuffer = new Array(HISTORY_SIZE).fill(null)
      radarColumnBuffer.columnBufferReady = true
      prefillColumnBuffer()
      drawViewport()
      isInitialized = true
    }
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)
  if (chartsWrapRef.value) resizeObserver.observe(chartsWrapRef.value)

  const rootEl = containerRef.value
  if (rootEl) rootEl.addEventListener('wheel', onWheel, { passive: false, capture: true })

  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointerleave', onPointerUp)

  visibilityChangeHandler = () => {
    if (
      document.visibilityState === 'visible' &&
      radarEnabled.value &&
      !radarPaused.value
    ) {
      resumeRenderLoop()
    }
  }
  document.addEventListener('visibilitychange', visibilityChangeHandler)
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (resizeObserver) {
    if (containerRef.value) resizeObserver.unobserve(containerRef.value)
    if (chartsWrapRef.value) resizeObserver.unobserve(chartsWrapRef.value)
  }
  const rootEl = containerRef.value
  if (rootEl) rootEl.removeEventListener('wheel', onWheel, { capture: true })
  if (visibilityChangeHandler) {
    document.removeEventListener('visibilitychange', visibilityChangeHandler)
    visibilityChangeHandler = null
  }
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointerleave', onPointerUp)
})

watch(radarEnabled, (on) => {
  if (!on) {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    return
  }
  nextTick(() => {
    if (!containerRef.value) return
    initCanvases()
    isInitialized = true
    lastRenderedTick = tickCount.value
    if (!radarPaused.value) resumeRenderLoop()
    else drawViewport()
  })
})

watch(radarPaused, () => {
  if (!radarEnabled.value) return
  if (!radarPaused.value) {
    const missed = tickCount.value - lastRenderedTick
    const toFill = Math.min(missed, HISTORY_SIZE)

    // Rejouer les colonnes manquantes dans l'ordre
    // du plus ancien au plus récent
    for (let i = toFill - 1; i >= 0; i--) {
      // offset en échantillons depuis la fin du buffer
      const offsetSamples = i * Math.floor(SAMPLE_RATE * TICK_MS / 1000)
      const snapshot = getBufferSnapshotAt(offsetSamples, WINDOW_SIZE)
      if (!snapshot) continue
      appendColumnFromSnapshot(snapshot)
    }

    lastRenderedTick = tickCount.value
    currentScrollOffset = 0
    targetScrollOffset = 0
    ui.setRadarSelectionMode(null)
    clearSelection()
    resumeRenderLoop()
  } else {
    targetScrollOffset = currentScrollOffset
    ui.setRadarSelectionMode('zone')
  }
})

watch(radarSelectionMode, () => {
  clearSelection()
  cursorX = null
  cursorY = null
  cursorChart = null
  drawViewport()
})

watch(
  [radarIntensityThreshold, radarFreqLow, radarFreqHigh, radarNoiseEnabled],
  () => {
    if (!isInitialized) return
    drawViewport()
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
