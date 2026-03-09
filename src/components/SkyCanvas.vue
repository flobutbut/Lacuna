<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()
const canvasRef = ref(null)
const stars = ref([])

const STAR_COUNT = 1800

function generateStarName() {
  const prefixes = ['HD', 'HIP', 'TYC', 'BD', 'GJ', 'LHS', 'Wolf', 'Ross', 'Lalande', 'Gliese']
  const p = prefixes[Math.floor(Math.random() * prefixes.length)]
  const n = Math.floor(Math.random() * 99999)
  return `${p} ${n}`
}

function initStars(w, h) {
  const arr = []
  for (let i = 0; i < STAR_COUNT; i++) {
    const isBright = Math.random() < 0.04
    const isAnomaly = i < 4
    arr.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: isBright ? Math.random() * 1.8 + 0.8 : Math.random() * 0.9 + 0.2,
      brightness: Math.random() * 0.6 + 0.3,
      twinkle: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      isAnomaly,
      anomalyPhase: Math.random() * Math.PI * 2,
      name: generateStarName(),
      dist: (Math.random() * 200 + 2).toFixed(1),
      spectral: ['G2V', 'K5V', 'M3V', 'F8V', 'A5V', 'M0V', 'G8V'][Math.floor(Math.random() * 7)],
      visited: i < 3,
    })
  }
  return arr
}

let ctx = null
let animId = null

function drawMilkyWay(ctx, w, h) {
  const grad = ctx.createLinearGradient(w * 0.1, h * 0.3, w * 0.9, h * 0.7)
  grad.addColorStop(0, 'rgba(60,80,120,0)')
  grad.addColorStop(0.3, 'rgba(60,80,120,0.06)')
  grad.addColorStop(0.5, 'rgba(80,100,150,0.1)')
  grad.addColorStop(0.7, 'rgba(60,80,120,0.06)')
  grad.addColorStop(1, 'rgba(60,80,120,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.ellipse(w / 2, h / 2, w * 0.45, h * 0.18, Math.PI * 0.15, 0, Math.PI * 2)
  ctx.fill()
}

function draw(canvas, starList) {
  if (!canvas || !ctx) return
  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)
  drawMilkyWay(ctx, w, h)

  starList.forEach((s) => {
    s.twinkle += s.twinkleSpeed
    const flicker = 0.85 + 0.15 * Math.sin(s.twinkle)
    const alpha = s.brightness * flicker

    if (s.isAnomaly) {
      s.anomalyPhase += 0.03
      const pulse = 0.4 + 0.4 * Math.sin(s.anomalyPhase)
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(232,160,32,${pulse * 0.15})`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(232,160,32,${pulse * 0.8})`
      ctx.fill()
    } else {
      if (s.r > 1.2) {
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.08})`
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.fill()
    }

    if (s.visited) {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r + 3, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,180,200,0.3)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
  })

  animId = requestAnimationFrame(() => draw(canvas, starList))
}

function handleResize(canvas, starList) {
  const w = window.innerWidth
  const h = window.innerHeight
  const oldW = canvas.width
  const oldH = canvas.height
  canvas.width = w
  canvas.height = h
  starList.forEach((s) => {
    s.x = (s.x / oldW) * w
    s.y = (s.y / oldH) * h
  })
}

function handleMouseMove(e, starList, canvas) {
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  ui.setReticulePosition(e.clientX, e.clientY)
  ui.setReticuleVisible(true)

  let closest = null
  let minDist = 18
  starList.forEach((s) => {
    const d = Math.hypot(s.x - mx, s.y - my)
    if (d < minDist) {
      minDist = d
      closest = s
    }
  })
  ui.hoveredStar = closest
}

function handleMouseLeave() {
  ui.hoveredStar = null
  ui.setReticuleVisible(false)
}

function handleClick(starList) {
  const s = ui.hoveredStar
  if (!s) return
  const dist = parseFloat(s.dist)
  const travelSec = Math.round(dist * 1000)
  const travelLabel =
    travelSec > 3600
      ? `${(travelSec / 3600).toFixed(1)}h réelles`
      : `${Math.floor(travelSec / 60)}m ${travelSec % 60}s réelles`
  ui.showTravelWidget(s.name, `${dist} al — ${travelLabel}`)
  ui.showNotification(`CAP FIXÉ — ${s.name} — ${dist} al`)
}

let canvasEl = null
let onResize = null
let onMove = null
let onClick = null

onMounted(() => {
  canvasEl = canvasRef.value
  if (!canvasEl) return
  const w = window.innerWidth
  const h = window.innerHeight
  canvasEl.width = w
  canvasEl.height = h
  ctx = canvasEl.getContext('2d')
  stars.value = initStars(w, h)

  draw(canvasEl, stars.value)

  onResize = () => handleResize(canvasEl, stars.value)
  onMove = (e) => handleMouseMove(e, stars.value, canvasEl)
  onClick = () => handleClick(stars.value)

  window.addEventListener('resize', onResize)
  canvasEl.addEventListener('mousemove', onMove)
  canvasEl.addEventListener('mouseleave', handleMouseLeave)
  canvasEl.addEventListener('click', onClick)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (canvasEl) {
    if (onResize) window.removeEventListener('resize', onResize)
    if (onMove) canvasEl.removeEventListener('mousemove', onMove)
    canvasEl.removeEventListener('mouseleave', handleMouseLeave)
    if (onClick) canvasEl.removeEventListener('click', onClick)
  }
})
</script>

<template>
  <canvas ref="canvasRef" class="sky-canvas" />
</template>

<style scoped>
.sky-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
}
</style>
