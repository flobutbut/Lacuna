<script setup>
/**
 * Spectrogramme miniature — mêmes colonnes que RadarView (columnBuffer, writeCol, specMaxVal).
 * Colonne la plus récente à droite ; pas de défilement bitmap : relecture du buffer circulaire.
 * Échelle horizontale alignée sur RadarView : une colonne buffer par pixel CSS (largeur utile = w).
 */
import { inject, watch, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import * as d3 from 'd3'
import { useRadarStore } from '@/stores/radar'
import { getCssVar } from '@/lib/cssVars'
import { RADAR_FREQ_BINS, columnIndexAt, freqRangeToBins, ticksPerPixel } from '@/lib/radarSpectrum'

const radarSpectrogram = inject('radarSpectrogram', null)
const radarColumnBuffer = inject('radarColumnBuffer', null)

const radarStore = useRadarStore()
const {
  radarIntensityThreshold,
  radarFreqLow,
  radarFreqHigh,
  radarTimeScale,
  radarEnabled,
} = storeToRefs(radarStore)

const wrapRef = ref(null)
const canvasRef = ref(null)

const HEIGHT_CSS = 120

const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 1])

function cssSize() {
  const wrap = wrapRef.value
  if (!wrap) return { w: 1, h: HEIGHT_CSS }
  return { w: Math.max(1, wrap.clientWidth), h: HEIGHT_CSS }
}

function drawEmpty() {
  const canvas = canvasRef.value
  if (!canvas) return
  const { w, h } = cssSize()
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = getCssVar('--color-bg')
  ctx.fillRect(0, 0, w, h)
}

function draw() {
  if (
    !radarEnabled.value ||
    !radarSpectrogram ||
    !radarColumnBuffer ||
    !canvasRef.value ||
    !wrapRef.value
  )
    return

  const { columnBuffer, columnBufferReady, writeCol, specMaxVal } = radarColumnBuffer
  const { HISTORY_SIZE } = radarSpectrogram

  if (!columnBuffer || !columnBufferReady) {
    drawEmpty()
    return
  }

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { w, h } = cssSize()
  const bg = getCssVar('--color-bg')

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  const ticksPerPx = ticksPerPixel(radarTimeScale.value)
  const norm = specMaxVal || 1

  const { binLow, binHigh, binRange } = freqRangeToBins(radarFreqLow.value, radarFreqHigh.value, RADAR_FREQ_BINS)

  for (let px = 0; px < w; px++) {
    const colIdx = columnIndexAt({ writeCol, px, innerW: w, ticksPerPx, historySize: HISTORY_SIZE })

    const col = columnBuffer[colIdx]
    if (!col) continue

    const maxMag = Math.max(...col.magnitudes)
    const colFlux = maxMag / norm
    if (colFlux < radarIntensityThreshold.value) continue

    for (let row = binLow; row < binHigh; row++) {
      const val = Math.min(1, Math.max(0, col.magnitudes[row] / norm))
      ctx.fillStyle = colorScale(val)
      const yPos = (1 - (row - binLow) / binRange) * h
      ctx.fillRect(px, yPos, 1, Math.ceil(h / binRange) + 1)
    }
  }
}

function resizeCanvas() {
  const wrap = wrapRef.value
  const canvas = canvasRef.value
  if (!wrap || !canvas) return

  const dpr = window.devicePixelRatio || 1
  const cssW = Math.max(1, wrap.clientWidth)
  const cssH = HEIGHT_CSS

  canvas.width = Math.floor(cssW * dpr)
  canvas.height = Math.floor(cssH * dpr)
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`

  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  if (radarSpectrogram && radarColumnBuffer && radarEnabled.value) draw()
  else drawEmpty()
}

let resizeObserver = null

onMounted(() => {
  nextTick(() => {
    resizeCanvas()
    if (wrapRef.value) {
      resizeObserver = new ResizeObserver(() => {
        resizeCanvas()
      })
      resizeObserver.observe(wrapRef.value)
    }
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

if (radarSpectrogram) {
  watch(
    () => radarSpectrogram.tickCount.value,
    () => {
      nextTick(() => {
        if (radarEnabled.value) draw()
      })
    },
    { flush: 'post' }
  )
}

watch(
  [radarIntensityThreshold, radarFreqLow, radarFreqHigh, radarTimeScale, radarEnabled],
  () => {
    nextTick(() => {
      if (!radarEnabled.value) drawEmpty()
      else draw()
    })
  },
  { flush: 'post' }
)
</script>

<template>
  <div ref="wrapRef" class="radar-miniature" aria-hidden="true">
    <canvas
      v-show="radarEnabled"
      ref="canvasRef"
      class="radar-miniature__canvas"
    />
    <div
      v-if="!radarEnabled"
      class="radar-miniature__placeholder"
      role="status"
      aria-live="polite"
    >
      <span class="radar-miniature__placeholder-title">Radar désactivé</span>
      <span class="radar-miniature__placeholder-hint">
        Activez l’acquisition pour écouter le spectre radio
      </span>
    </div>
  </div>
</template>

<style scoped>
.radar-miniature {
  width: 100%;
  pointer-events: none;
  line-height: 0;
}

.radar-miniature__canvas {
  display: block;
  width: 100%;
  height: 120px;
  vertical-align: top;
}

.radar-miniature__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 120px;
  padding: var(--space-2) var(--space-3);
  background: transparent;
  text-align: center;
}

.radar-miniature__placeholder-title {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-tight);
  text-transform: uppercase;
  color: var(--color-muted);
}

.radar-miniature__placeholder-hint {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  line-height: var(--leading-normal);
  letter-spacing: var(--tracking-tight);
  color: var(--color-cyan-muted);
  max-width: 100%;
}
</style>
