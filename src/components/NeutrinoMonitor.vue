<script setup>
/**
 * Moniteur du détecteur de neutrinos — taux d'événements par seconde sur les 10 dernières minutes,
 * en échelle logarithmique (le bruit de fond et une bouffée de supernova diffèrent de six ordres de grandeur).
 * Vue en direct du capteur, comme la miniature Radar ; l'analyse se fait au Laboratoire.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useShipStore } from '@/stores/ship'
import { getCssVar, canvasFont } from '@/lib/cssVars'
import { formatNumber } from '@/lib/formatUtils'
import { neutrinoCountsWindow } from '@/lib/neutrinoRate'

const WINDOW_S = 600
const HEIGHT_CSS = 80
/** Haut de l'échelle : log10 de 3 millions d'événements par seconde */
const LOG_MAX = 6.5
const GRID = [
  { log: 0, label: '1' },
  { log: 3, label: '10³' },
  { log: 6, label: '10⁶' },
]

const shipStore = useShipStore()
const wrapRef = ref(null)
const canvasRef = ref(null)
const currentRate = ref(0)
let timer = null

function draw() {
  const canvas = canvasRef.value
  const wrap = wrapRef.value
  if (!canvas || !wrap) return
  const w = Math.max(1, wrap.clientWidth)
  const h = HEIGHT_CSS
  const dpr = window.devicePixelRatio || 1
  if (canvas.width !== Math.round(w * dpr)) {
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = getCssVar('--color-bg')
  ctx.fillRect(0, 0, w, h)

  const nowSec = Math.floor(Date.now() / 1000)
  const counts = neutrinoCountsWindow(shipStore.supernovaT0, nowSec - 1, WINDOW_S)
  currentRate.value = counts[counts.length - 1]
  const yOf = (count) => h - Math.min(1, Math.log10(count + 1) / LOG_MAX) * (h - 2)

  // Repères d'échelle
  ctx.strokeStyle = getCssVar('--border-default')
  ctx.fillStyle = getCssVar('--color-muted')
  ctx.font = canvasFont('--text-2xs')
  ctx.lineWidth = 1
  for (const g of GRID) {
    const y = Math.round(h - (g.log / LOG_MAX) * (h - 2)) + 0.5
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
    ctx.fillText(g.label, 2, y - 2)
  }

  // Comptages : une colonne par pixel (maximum des secondes couvertes), la plus récente à droite
  ctx.fillStyle = getCssVar('--color-cyan')
  const secPerPx = WINDOW_S / w
  for (let x = 0; x < w; x++) {
    const from = Math.floor(x * secPerPx)
    const to = Math.max(from + 1, Math.floor((x + 1) * secPerPx))
    let max = 0
    for (let i = from; i < to && i < counts.length; i++) if (counts[i] > max) max = counts[i]
    if (max === 0) continue
    const y = yOf(max)
    ctx.fillRect(x, y, 1, h - y)
  }
}

onMounted(() => {
  draw()
  timer = setInterval(draw, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="neutrino-monitor">
    <div ref="wrapRef" class="neutrino-monitor__chart">
      <canvas ref="canvasRef" role="img" aria-label="Taux d'événements du détecteur de neutrinos, 10 dernières minutes" />
    </div>
    <div class="sw-row neutrino-monitor__legend">
      <span class="sw-key">−10 min</span>
      <span class="sw-val">{{ formatNumber(currentRate) }} év./s</span>
    </div>
  </div>
</template>

<style scoped>
.neutrino-monitor__chart {
  width: 100%;
  line-height: 0;
}

.neutrino-monitor__legend {
  margin-top: var(--space-2);
}
</style>
