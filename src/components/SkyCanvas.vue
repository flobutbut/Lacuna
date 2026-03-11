<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useSignauxStore } from '@/stores/signaux'
import { useStellarSystemsStore } from '@/stores/stellarSystems'

const ui = useUIStore()
const signauxStore = useSignauxStore()
const stellarSystemsStore = useStellarSystemsStore()
const canvasRef = ref(null)
const stars = ref([])

const STAR_COUNT = 1800

function generateStarName() {
  const prefixes = ['HD', 'HIP', 'TYC', 'BD', 'GJ', 'LHS', 'Wolf', 'Ross', 'Lalande', 'Gliese']
  const p = prefixes[Math.floor(Math.random() * prefixes.length)]
  const n = Math.floor(Math.random() * 99999)
  return `${p} ${n}`
}

/** Projette ra (0–360), dec (-90–90) vers coordonnées écran */
function projectRaDecToScreen(ra, dec, w, h) {
  const x = ((ra ?? 0) / 360) * w
  const y = (0.5 - (dec ?? 0) / 180) * h
  return { x, y }
}

/** Systèmes Supabase → format étoiles pour draw (exclut SOL) */
function projectStarsFromDb(systems, w, h) {
  const skySystems = systems.filter((s) => s.id !== 'SOL')
  if (skySystems.length === 0) return null
  return skySystems.map((s, i) => {
    const coords = s.coordinates || {}
    const { x, y } = projectRaDecToScreen(coords.ra, coords.dec, w, h)
    const dist = parseFloat(s.distance) || 10
    const isAnomaly = (s.anomaly_level || 0) > 0
    const r = Math.max(0.4, 2 - dist / 30) * (isAnomaly ? 1.5 : 1)
    return {
      id: s.id,
      x,
      y,
      r,
      brightness: 0.5 + 0.3 * (1 - dist / 50),
      twinkle: (i * 0.7) % (Math.PI * 2),
      twinkleSpeed: 0.008 + (i % 5) * 0.003,
      isAnomaly,
      anomalyPhase: i * 0.5,
      name: s.name || s.id,
      dist: String(dist.toFixed(1)),
      spectral: s.spectral_type || '?',
      visited: false,
    }
  })
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

function signalPosition(azimuthDeg, w, h) {
  const r = Math.min(w, h) * 0.45
  const rad = (azimuthDeg * Math.PI) / 180
  return {
    x: w / 2 + r * Math.sin(rad),
    y: h / 2 - r * Math.cos(rad),
  }
}

function draw(canvas, starList) {
  if (!canvas || !ctx) return
  const w = canvas.width
  const h = canvas.height

  ctx.clearRect(0, 0, w, h)
  drawMilkyWay(ctx, w, h)

  const selected = ui.selectedStar
  const now = Date.now()
  const activeSignals = signauxStore.list.filter((s) => now - s.createdAt < s.lifetimeMs)

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

    if (s === selected) {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r + 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,180,200,0.9)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r + 6, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,180,200,0.25)'
      ctx.lineWidth = 2
      ctx.stroke()
    } else if (s.visited) {
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r + 3, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,180,200,0.3)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
  })

  const t = Date.now() * (Math.PI * 2 / 6000)
  activeSignals.forEach((sig) => {
    const phase = (sig.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 100) / 100 * Math.PI * 2
    const signalPulse = 0.5 + 0.5 * Math.sin(t + phase)
    const pos = signalPosition(sig.azimuth, w, h)
    const r = 14 + signalPulse * 6
    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r)
    grad.addColorStop(0, `rgba(168, 85, 247, ${0.35 + signalPulse * 0.25})`)
    grad.addColorStop(0.25, `rgba(139, 92, 246, ${0.2 + signalPulse * 0.15})`)
    grad.addColorStop(0.6, `rgba(124, 58, 237, ${0.08 + signalPulse * 0.06})`)
    grad.addColorStop(1, 'rgba(124, 58, 237, 0)')
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + signalPulse * 0.2})`
    ctx.lineWidth = 1
    ctx.stroke()
  })

  animId = requestAnimationFrame(() => draw(canvas, starList))
}

function handleResize(canvas, starList, fromDb) {
  const w = window.innerWidth
  const h = window.innerHeight
  const oldW = canvas.width
  const oldH = canvas.height
  canvas.width = w
  canvas.height = h
  if (fromDb && starList.length > 0 && starList[0].id) {
    const byId = Object.fromEntries(stellarSystemsStore.forSky().map((s) => [s.id, s]))
    starList.forEach((s) => {
      const sys = byId[s.id]
      if (sys?.coordinates) {
        const { x, y } = projectRaDecToScreen(sys.coordinates.ra, sys.coordinates.dec, w, h)
        s.x = x
        s.y = y
      } else {
        s.x = (s.x / oldW) * w
        s.y = (s.y / oldH) * h
      }
    })
  } else {
    starList.forEach((s) => {
      s.x = (s.x / oldW) * w
      s.y = (s.y / oldH) * h
    })
  }
}

function handleMouseMove(e, starList, canvas) {
  const rect = canvas.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const w = canvas.width
  const h = canvas.height
  ui.setReticulePosition(e.clientX, e.clientY)
  ui.setReticuleVisible(true)

  let closestStar = null
  let minStarDist = 18
  starList.forEach((s) => {
    const d = Math.hypot(s.x - mx, s.y - my)
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
    const pos = signalPosition(sig.azimuth, w, h)
    const d = Math.hypot(pos.x - mx, pos.y - my)
    if (d < minSignalDist) {
      minSignalDist = d
      closestSignal = sig
    }
  })

  if (closestSignal && (!closestStar || minSignalDist < minStarDist)) {
    ui.hoveredStar = null
    ui.setHoveredSignal(closestSignal)
  } else {
    ui.setHoveredSignal(null)
    ui.hoveredStar = closestStar
  }
}

function handleMouseLeave() {
  ui.hoveredStar = null
  ui.setHoveredSignal(null)
  ui.setReticuleVisible(false)
}

function handleClick() {
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
let onClick = null
let onDblClick = null

onMounted(async () => {
  canvasEl = canvasRef.value
  if (!canvasEl) return
  const w = window.innerWidth
  const h = window.innerHeight
  canvasEl.width = w
  canvasEl.height = h
  ctx = canvasEl.getContext('2d')

  await stellarSystemsStore.fetch()
  const dbStars = projectStarsFromDb(stellarSystemsStore.forSky(), w, h)
  stars.value = dbStars && dbStars.length > 0 ? dbStars : initStars(w, h)

  draw(canvasEl, stars.value)

  const fromDb = stellarSystemsStore.list.length > 0
  onResize = () => handleResize(canvasEl, stars.value, fromDb)
  onMove = (e) => handleMouseMove(e, stars.value, canvasEl)
  onClick = handleClick
  onDblClick = handleDblClick

  window.addEventListener('resize', onResize)
  canvasEl.addEventListener('mousemove', onMove)
  canvasEl.addEventListener('mouseleave', handleMouseLeave)
  canvasEl.addEventListener('click', onClick)
  canvasEl.addEventListener('dblclick', onDblClick)
})

onUnmounted(() => {
  if (animId) cancelAnimationFrame(animId)
  if (canvasEl) {
    if (onResize) window.removeEventListener('resize', onResize)
    if (onMove) canvasEl.removeEventListener('mousemove', onMove)
    canvasEl.removeEventListener('mouseleave', handleMouseLeave)
    if (onClick) canvasEl.removeEventListener('click', onClick)
    if (onDblClick) canvasEl.removeEventListener('dblclick', onDblClick)
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
