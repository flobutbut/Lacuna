<script setup>
/**
 * Moniteur du détecteur de neutrinos — taux d'événements par seconde sur les 10 dernières minutes,
 * en échelle logarithmique ajustée à la fenêtre (comme le Radar) : la montée de pré-supernova (quelques év./s)
 * remplit la tuile avant la bouffée, qui monte ensuite l'échelle jusqu'à ~10⁶.
 * Vue en direct du capteur, comme la miniature Radar ; l'analyse se fait au Laboratoire.
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useShipStore } from '@/stores/ship'
import { getCssVar, canvasFont } from '@/lib/cssVars'
import { formatNumber } from '@/lib/formatUtils'
import { neutrinoCountsWindow } from '@/lib/neutrinoRate'

const WINDOW_S = 600
const HEIGHT_CSS = 80
/** Haut minimal de l'échelle (log10) : le bruit de fond seul ne remplit pas la tuile */
const LOG_MIN_TOP = 0.5
const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷']

function decadeLabel(n) {
  return n === 0 ? '1' : n === 1 ? '10' : `10${SUPERSCRIPTS[n] ?? n}`
}

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
  // Une colonne par pixel : taux moyen des secondes couvertes (lisse le bruit de Poisson), la plus récente à droite
  const secPerPx = WINDOW_S / w
  const rates = new Array(w)
  let maxRate = 0
  for (let x = 0; x < w; x++) {
    const from = Math.floor(x * secPerPx)
    const to = Math.min(counts.length, Math.max(from + 1, Math.floor((x + 1) * secPerPx)))
    let sum = 0
    for (let i = from; i < to; i++) sum += counts[i]
    rates[x] = sum / (to - from)
    if (rates[x] > maxRate) maxRate = rates[x]
  }

  // Échelle logarithmique ajustée au maximum de la fenêtre
  const logTop = Math.max(LOG_MIN_TOP, Math.log10(maxRate + 1) * 1.15)
  const yOf = (rate) => h - Math.min(1, Math.log10(rate + 1) / logTop) * (h - 2)

  // Repères : une décade sur deux au-delà de 10³ pour ne pas surcharger
  ctx.strokeStyle = getCssVar('--border-default')
  ctx.fillStyle = getCssVar('--color-muted')
  ctx.font = canvasFont('--text-2xs')
  ctx.lineWidth = 1
  const step = logTop > 4 ? 2 : 1
  for (let n = 0; Math.log10(10 ** n + 1) <= logTop; n += step) {
    const y = Math.round(yOf(10 ** n)) + 0.5
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
    ctx.fillText(decadeLabel(n), 2, y - 2)
  }

  ctx.fillStyle = getCssVar('--color-cyan')
  ctx.globalAlpha = 0.55
  for (let x = 0; x < w; x++) {
    if (rates[x] <= 0) continue
    const y = yOf(rates[x])
    ctx.fillRect(x, y, 1, h - y)
  }
  ctx.globalAlpha = 1

  // Tendance : moyenne glissante sur ~30 s, pour que la montée se lise malgré le bruit de Poisson
  const half = Math.max(1, Math.round(15 / secPerPx))
  ctx.strokeStyle = getCssVar('--color-white')
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let x = 0; x < w; x++) {
    let sum = 0
    let n = 0
    for (let i = Math.max(0, x - half); i <= Math.min(w - 1, x + half); i++) {
      sum += rates[i]
      n++
    }
    const y = yOf(sum / n)
    if (x === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
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
