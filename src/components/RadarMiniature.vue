<script setup>
/**
 * Spectrogramme miniature — mêmes colonnes que RadarView (columnBuffer, writeCol).
 * Colonne la plus récente à droite ; pas de défilement bitmap : relecture du buffer circulaire.
 * Même échelle que RadarView : temps (ms par pixel CSS), dB normalisés sur la fenêtre affichée, seuil INT.
 */
import { inject, watch, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRadarStore } from '@/stores/radar'
import { getCssVar } from '@/lib/cssVars'
import { interpolateViridis } from 'd3'
import {
  RADAR_FREQ_BINS,
  ageAtPx,
  columnIndexAt,
  dbDisplayScale,
  dbToLevel,
  freqRangeToBins,
  magnitudeToDb,
  ticksPerPixel,
} from '@/lib/radarSpectrum'

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

  const { columnBuffer, columnBufferReady, writeCol } = radarColumnBuffer
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
  const available = Math.min(radarColumnBuffer.count, HISTORY_SIZE)
  const { binLow, binRange } = freqRangeToBins(radarFreqLow.value, radarFreqHigh.value, RADAR_FREQ_BINS)

  // Fenêtre en dB (une colonne par pixel, la plus récente à droite), puis échelle commune
  const winDb = new Float32Array(w * binRange).fill(NaN)
  for (let px = 0; px < w; px++) {
    if (ageAtPx(px, w, ticksPerPx) >= available) continue
    const col = columnBuffer[columnIndexAt({ writeCol, px, innerW: w, ticksPerPx, historySize: HISTORY_SIZE })]
    if (!col) continue
    for (let i = 0; i < binRange; i++) winDb[px * binRange + i] = magnitudeToDb(col.magnitudes[binLow + i] ?? 0)
  }
  const scale = dbDisplayScale(winDb)
  if (!scale) return

  const rowH = Math.ceil(h / binRange) + 1
  for (let px = 0; px < w; px++) {
    const base = px * binRange
    if (Number.isNaN(winDb[base])) continue
    let maxDb = -Infinity
    for (let i = 0; i < binRange; i++) if (winDb[base + i] > maxDb) maxDb = winDb[base + i]
    if (dbToLevel(maxDb, scale) < radarIntensityThreshold.value) continue

    for (let i = 0; i < binRange; i++) {
      ctx.fillStyle = interpolateViridis(dbToLevel(winDb[base + i], scale))
      const yPos = (1 - (i + 1) / binRange) * h
      ctx.fillRect(px, yPos, 1, rowH)
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
