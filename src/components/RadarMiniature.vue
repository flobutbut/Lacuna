<script setup>
/**
 * Spectrogramme miniature — mêmes colonnes que RadarView (columnBuffer, writeCol).
 * Colonne la plus récente à droite ; pas de défilement bitmap : relecture du buffer circulaire.
 * Montée seulement radar allumé (la tuile se replie sinon). Toujours en direct (ne suit ni la pause
 * ni le défilement de la vue Radar), avec des repères de durée.
 * Même échelle que RadarView : temps (ms par pixel CSS), dB normalisés sur la fenêtre affichée, seuil INT.
 */
import { inject, watch, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRadarStore } from '@/stores/radar'
import { canvasFont, getCssVar } from '@/lib/cssVars'
import { interpolateViridis } from 'd3'
import {
  RADAR_FREQ_BINS,
  ageAtPx,
  ageLabelInterval,
  dbDisplayScale,
  dbToLevel,
  formatAgeLabel,
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
/** Écart visé entre deux repères de durée (px) */
const MARK_SPACING_PX = 100

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

  // Fenêtre en dB (la plus récente à droite ; maximum des colonnes couvertes par un pixel), puis échelle commune
  const colsPerPx = Math.max(1, Math.round(ticksPerPx))
  const winDb = new Float32Array(w * binRange).fill(NaN)
  for (let px = 0; px < w; px++) {
    const ageStart = ageAtPx(px, w, ticksPerPx)
    if (ageStart >= available) continue
    const ageEnd = Math.min(ageStart + colsPerPx, available)
    const base = px * binRange
    for (let age = ageStart; age < ageEnd; age++) {
      const col = columnBuffer[(writeCol - 1 - age + HISTORY_SIZE) % HISTORY_SIZE]
      if (!col) continue
      for (let i = 0; i < binRange; i++) {
        const db = magnitudeToDb(col.magnitudes[binLow + i] ?? 0)
        if (!(db <= winDb[base + i])) winDb[base + i] = db
      }
    }
  }
  const scale = dbDisplayScale(winDb)
  if (!scale) return

  const rowH = Math.ceil(h / binRange) + 1
  for (let px = 0; px < w; px++) {
    const base = px * binRange
    if (Number.isNaN(winDb[base])) continue
    // Même intensité que RadarView : niveau moyen de la plage affichée
    let levelSum = 0
    for (let i = 0; i < binRange; i++) levelSum += dbToLevel(winDb[base + i], scale)
    if (levelSum / binRange < radarIntensityThreshold.value) continue

    for (let i = 0; i < binRange; i++) {
      ctx.fillStyle = interpolateViridis(dbToLevel(winDb[base + i], scale))
      const yPos = (1 - (i + 1) / binRange) * h
      ctx.fillRect(px, yPos, 1, rowH)
    }
  }

  drawDurationMarks(ctx, w, h, ticksPerPx, available)
}

/**
 * Repères de durée (−10 s, −20 s… à 100 ms par pixel), la plus récente à droite : graduations en haut et en bas
 * (pour ne pas les confondre avec les impulsions verticales) et âge sur fond sombre.
 */
function drawDurationMarks(ctx, w, h, ticksPerPx, available) {
  const interval = ageLabelInterval(ticksPerPx, MARK_SPACING_PX)
  const lastAge = Math.min(available, Math.floor(w * ticksPerPx))
  const muted = getCssVar('--color-muted')
  const bg = getCssVar('--color-bg')
  ctx.font = canvasFont()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  for (let age = interval; age < lastAge; age += interval) {
    const x = w - 1 - Math.floor(age / ticksPerPx)
    const label = formatAgeLabel(age)
    const labelW = ctx.measureText(label).width + 4
    ctx.fillStyle = bg
    ctx.globalAlpha = 0.75
    ctx.fillRect(x + 1, h - 13, labelW, 13)
    ctx.globalAlpha = 1
    ctx.fillStyle = muted
    ctx.fillRect(x, 0, 1, 6)
    ctx.fillRect(x, h - 13, 1, 13)
    ctx.fillText(label, x + 3, h - 2)
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
    <canvas ref="canvasRef" class="radar-miniature__canvas" />
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
</style>
