<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useSignauxStore } from '@/stores/signaux'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useShipStore } from '@/stores/ship'
import { useNebulasStore } from '@/stores/nebulas'
import { filterBySpectralBand } from '@/lib/spectralBands'

const ui = useUIStore()
const nebulasStore = useNebulasStore()
const { spectralFilter, searchedStarId } = storeToRefs(ui)
const signauxStore = useSignauxStore()
const stellarSystemsStore = useStellarSystemsStore()
const shipStore = useShipStore()
const canvasRef = ref(null)
const stars = ref([])
const isPanning = ref(false)
const lastPanPos = ref({ x: 0, y: 0 })
const hasPanned = ref(false)
const mouseDown = ref(false)

const STAR_COUNT = 1800
const FOV_DEG = 120
const FOV_HALF = FOV_DEG / 2
const PAN_SENSITIVITY = 0.15
const PAN_DRAG_THRESHOLD = 5
const LERP_SPEED = 0.05

function generateStarName() {
  const prefixes = ['HD', 'HIP', 'TYC', 'BD', 'GJ', 'LHS', 'Wolf', 'Ross', 'Lalande', 'Gliese']
  const p = prefixes[Math.floor(Math.random() * prefixes.length)]
  const n = Math.floor(Math.random() * 99999)
  return `${p} ${n}`
}

const RAD = Math.PI / 180

/** ra,dec (deg) → vecteur unitaire */
function raDecToVector(ra, dec) {
  const d = (dec ?? 0) * RAD
  const r = ((ra ?? 0) % 360) * RAD
  const cd = Math.cos(d)
  return { x: cd * Math.cos(r), y: cd * Math.sin(r), z: Math.sin(d) }
}

/** Projette étoile (ra,dec) dans FOV 120° — vue (raView, decView), projection stéréographique */
function projectStarInFov(ra, dec, raView, decView, w, h) {
  const S = raDecToVector(ra, dec)
  const V = raDecToVector(raView, decView)
  const dot = S.x * V.x + S.y * V.y + S.z * V.z
  const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)))
  const angleDeg = angleRad / RAD
  if (angleDeg > FOV_HALF) return null

  const worldUp = { x: 0, y: 0, z: 1 }
  let Rx = V.y * worldUp.z - V.z * worldUp.y
  let Ry = V.z * worldUp.x - V.x * worldUp.z
  let Rz = V.x * worldUp.y - V.y * worldUp.x
  const rLen = Math.hypot(Rx, Ry, Rz)
  if (rLen < 0.01) {
    Rx = 1
    Ry = 0
    Rz = 0
  } else {
    Rx /= rLen
    Ry /= rLen
    Rz /= rLen
  }
  let Ux = Ry * V.z - Rz * V.y
  let Uy = Rz * V.x - Rx * V.z
  let Uz = Rx * V.y - Ry * V.x
  const uLen = Math.hypot(Ux, Uy, Uz)
  Ux /= uLen
  Uy /= uLen
  Uz /= uLen

  const sx = S.x * Rx + S.y * Ry + S.z * Rz
  const sy = S.x * Ux + S.y * Uy + S.z * Uz
  const sinA = Math.sin(angleRad) || 0.001
  /* Utilise la dimension la plus grande pour que le champ remplisse toute la largeur sur écran paysage */
  const scale = (Math.max(w, h) / 2) / (2 * Math.tan((FOV_HALF * RAD) / 2))
  const r = 2 * Math.tan(angleRad / 2) * scale
  return { x: w / 2 + (sx / sinA) * r, y: h / 2 - (sy / sinA) * r }
}

/** Projette une nébuleuse (ellipse) en vertices écran — retourne path ou null si hors FOV */
function projectNebulaShape(nebula, raView, decView, w, h) {
  const coords = nebula.coordinates || {}
  const ra0 = coords.ra ?? 0
  const dec0 = coords.dec ?? 0
  const params = nebula.shape_params || {}
  if (nebula.shape_type === 'ELLIPSE') {
    const semiMajor = params.semi_major_arcmin ?? 60
    const semiMinor = params.semi_minor_arcmin ?? 40
    const paDeg = params.position_angle_deg ?? 0
    const paRad = (paDeg * Math.PI) / 180
    const decRad = (dec0 * Math.PI) / 180
    const arcminToDeg = 1 / 60
    const vertices = []
    for (let i = 0; i <= 36; i++) {
      const theta = (i / 36) * Math.PI * 2
      const xArcmin = semiMajor * Math.cos(theta) * Math.cos(paRad) - semiMinor * Math.sin(theta) * Math.sin(paRad)
      const yArcmin = semiMajor * Math.cos(theta) * Math.sin(paRad) + semiMinor * Math.sin(theta) * Math.cos(paRad)
      const dra = (xArcmin * arcminToDeg) / Math.max(0.01, Math.cos(decRad))
      const ddec = yArcmin * arcminToDeg
      const pos = projectStarInFov(ra0 + dra, dec0 + ddec, raView, decView, w, h)
      if (pos) vertices.push(pos)
    }
    return vertices.length > 3 ? vertices : null
  }
  if (nebula.shape_type === 'POLYGON') {
    const verts = params.vertices || []
    const decRad = (dec0 * Math.PI) / 180
    const arcminToDeg = 1 / 60
    const positions = verts.map((v) => {
      const dra = ((v.dra_arcmin ?? 0) * arcminToDeg) / Math.max(0.01, Math.cos(decRad))
      const ddec = (v.ddec_arcmin ?? 0) * arcminToDeg
      return projectStarInFov(ra0 + dra, dec0 + ddec, raView, decView, w, h)
    })
    if (positions.every((p) => p)) return positions
    return null
  }
  return null
}

/** Reconstruit la liste d'étoiles depuis la base (filtrée par bande spectrale) */
function buildStarsFromDb(w, h) {
  const band = spectralFilter.value
  const raw = stellarSystemsStore.forSky()
  const magLimit = band === 'ir' ? 15 : 12
  const filtered = filterBySpectralBand(raw, band, magLimit)
  const projected = projectStarsFromDb(filtered)
  if (projected && projected.length > 0) return projected
  return initStars(w, h)
}

/** Systèmes Supabase → format étoiles (avec ra,dec pour FOV) */
function projectStarsFromDb(systems) {
  const skySystems = systems.filter((s) => s.id !== 'SOL')
  if (skySystems.length === 0) return null
  return skySystems.map((s, i) => {
    const coords = s.coordinates || {}
    const ra = coords.ra ?? 0
    const dec = coords.dec ?? 0
    const dist = parseFloat(s.distance) || 10
    const isAnomaly = (s.anomaly_level || 0) > 0
    const r = Math.max(0.4, 2 - dist / 30) * (isAnomaly ? 1.5 : 1)
    return {
      id: s.id,
      ra,
      dec,
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
    const ra = Math.random() * 360
    const dec = (Math.random() - 0.5) * 180
    const isBright = Math.random() < 0.04
    const isAnomaly = i < 4
    arr.push({
      id: `proc-${i}`,
      ra,
      dec,
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
  ctx.save()
  ctx.filter = 'blur(35px)'
  const grad = ctx.createLinearGradient(w * 0.1, h * 0.3, w * 0.9, h * 0.7)
  grad.addColorStop(0, 'rgba(60,80,120,0)')
  grad.addColorStop(0.3, 'rgba(60,80,120,0.08)')
  grad.addColorStop(0.5, 'rgba(80,100,150,0.14)')
  grad.addColorStop(0.7, 'rgba(60,80,120,0.08)')
  grad.addColorStop(1, 'rgba(60,80,120,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.ellipse(w / 2, h / 2, w * 0.45, h * 0.18, Math.PI * 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Lignes horizontales courbes — effet dôme céleste, opacité réduite au centre */
function drawCurvedGrid(ctx, w, h) {
  const tiers = [0.15, 0.3, 0.45, 0.55, 0.7, 0.85]
  const curveStrength = Math.min(w, h) * 0.08
  const centerY = h / 2
  const maxDist = h / 2
  tiers.forEach((t) => {
    const y = h * t
    const distFromCenter = Math.abs(y - centerY)
    const tNorm = distFromCenter / maxDist
    const alpha = 0.02 + 0.2 * Math.pow(tNorm, 0.8)
    const cy = y + (t < 0.5 ? curveStrength : -curveStrength)
    ctx.strokeStyle = `rgba(100, 130, 180, ${alpha})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.quadraticCurveTo(w * 0.5, cy, w, y)
    ctx.stroke()
  })
}

function signalPosition(azimuthDeg, w, h) {
  const r = Math.min(w, h) * 0.45
  const rad = (azimuthDeg * Math.PI) / 180
  return {
    x: w / 2 + r * Math.sin(rad),
    y: h / 2 - r * Math.cos(rad),
  }
}

function lerpAngle(a, b, t) {
  let d = ((b - a + 540) % 360) - 180
  return a + d * t
}

function draw(canvas, starsRef) {
  if (!canvas || !ctx) return
  const starList = starsRef.value
  const w = canvas.width
  const h = canvas.height

  if (!isPanning.value) {
    const vd = ui.viewDirection?.value ?? ui.viewDirection?.value ?? ui.viewDirection
    const tv = ui.targetViewDirection?.value ?? ui.targetViewDirection?.value ?? ui.targetViewDirection
    const k = 1 - Math.pow(1 - LERP_SPEED, 1.5)
    ui.setViewDirectionValue({
      ra: lerpAngle(vd.ra, tv.ra, k),
      dec: vd.dec + (tv.dec - vd.dec) * k,
    })
  }

  const vd = ui.viewDirection?.value ?? ui.viewDirection

  ctx.clearRect(0, 0, w, h)
  drawCurvedGrid(ctx, w, h)
  drawMilkyWay(ctx, w, h)

  /* Nébuleuses (IR uniquement) — rendu inspiré JWST : gaz diffus, centre lumineux, bords éthérés */
  const band = spectralFilter.value
  if (band === 'ir') {
    const nebulas = nebulasStore.forSky('ir')
    nebulas.forEach((n) => {
      const vertices = projectNebulaShape(n, vd.ra, vd.dec, w, h)
      if (vertices && vertices.length > 2) {
        const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length
        const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length
        const maxR = Math.max(...vertices.map((v) => Math.hypot(v.x - cx, v.y - cy))) || 1

        /** Trace un path fermé à l'échelle scale depuis le centre (1 = forme originale) */
        function drawScaledPath(scale) {
          ctx.beginPath()
          const v0 = vertices[0]
          ctx.moveTo(cx + (v0.x - cx) * scale, cy + (v0.y - cy) * scale)
          for (let i = 1; i < vertices.length; i++) {
            const v = vertices[i]
            ctx.lineTo(cx + (v.x - cx) * scale, cy + (v.y - cy) * scale)
          }
          ctx.closePath()
        }

        ctx.save()

        /* Couches de halo — plusieurs anneaux qui fondent dans le vide (style nuage de gaz) */
        for (let layer = 0; layer < 4; layer++) {
          const scale = 1.35 - layer * 0.09
          const alpha = (4 - layer) * 0.02
          drawScaledPath(scale)
          ctx.fillStyle = `rgba(180, 80, 140, ${alpha})`
          ctx.fill()
        }

        /* Noyau — gradient radial orangé/ambre (poussière chauffée, filaments) */
        ctx.globalCompositeOperation = 'lighter'
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
        grad.addColorStop(0, 'rgba(255, 180, 120, 0.22)')
        grad.addColorStop(0.3, 'rgba(255, 130, 90, 0.12)')
        grad.addColorStop(0.6, 'rgba(200, 90, 130, 0.06)')
        grad.addColorStop(0.85, 'rgba(140, 60, 120, 0.02)')
        grad.addColorStop(1, 'rgba(100, 40, 80, 0)')
        drawScaledPath(1)
        ctx.fillStyle = grad
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'

        /* Lueur intérieure — centre plus vif */
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.5)
        coreGrad.addColorStop(0, 'rgba(255, 200, 150, 0.15)')
        coreGrad.addColorStop(0.5, 'rgba(255, 140, 80, 0.04)')
        coreGrad.addColorStop(1, 'rgba(255, 100, 60, 0)')
        drawScaledPath(1)
        ctx.fillStyle = coreGrad
        ctx.fill()

        /* Contour très doux — pas de trait dur */
        drawScaledPath(1)
        ctx.strokeStyle = 'rgba(255, 160, 120, 0.08)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.restore()
      }
    })
  }

  const selected = ui.selectedStar
  const now = Date.now()
  const activeSignals = signauxStore.list.filter((s) => now - s.createdAt < s.lifetimeMs)

  starList.forEach((s) => {
    const pos = projectStarInFov(s.ra, s.dec, vd.ra, vd.dec, w, h)
    if (!pos) return

    s.twinkle += s.twinkleSpeed
    const flicker = 0.85 + 0.15 * Math.sin(s.twinkle)
    const alpha = s.brightness * flicker

    if (s.isAnomaly) {
      s.anomalyPhase += 0.03
      const pulse = 0.4 + 0.4 * Math.sin(s.anomalyPhase)
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r * 3.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(232,160,32,${pulse * 0.15})`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(232,160,32,${pulse * 0.8})`
      ctx.fill()
    } else {
      if (s.r > 1.2) {
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, s.r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.08})`
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255,255,255,${alpha})`
      ctx.fill()
    }

    const isHighlighted = s === selected || s.id === searchedStarId.value
    if (isHighlighted) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r + 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,180,200,0.9)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r + 6, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,180,200,0.25)'
      ctx.lineWidth = 2
      ctx.stroke()
    } else if (s.visited) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r + 3, 0, Math.PI * 2)
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

  /* Bordure spectrale — ligne 1px, 24px en retrait, uniquement dans la vue ciel (sous header, au-dessus instruments) */
  if (band !== 'visible') {
    const borderConfig =
      band === 'ir'
        ? { r: 255, g: 130, b: 70 }
        : band === 'uv'
          ? { r: 90, g: 130, b: 220 }
          : band === 'r'
            ? { r: 230, g: 150, b: 110 }
            : null
    if (borderConfig) {
      const headerH = 48
      const instrumentsH = 52
      const inset = 8
      const x = inset
      const y = headerH + inset
      const rw = w - inset * 2
      const rh = h - headerH - instrumentsH - inset * 2
      if (rw > 0 && rh > 0) {
        ctx.save()
        ctx.strokeStyle = `rgb(${borderConfig.r}, ${borderConfig.g}, ${borderConfig.b})`
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, rw, rh)
        ctx.restore()
      }
    }
  }

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
  const vd = ui.viewDirection?.value ?? ui.viewDirection
  if (isPanning.value) {
    const dx = (e.clientX - lastPanPos.value.x) * PAN_SENSITIVITY
    const dy = (e.clientY - lastPanPos.value.y) * PAN_SENSITIVITY
    const next = {
      ra: (vd.ra + dx + 360) % 360,
      dec: Math.max(-89, Math.min(89, vd.dec + dy)),
    }
    ui.setViewDirectionValue(next)
    ui.setTargetViewDirectionValue(next)
    lastPanPos.value = { x: e.clientX, y: e.clientY }
    hasPanned.value = true
    return
  }
  if (mouseDown.value && !isPanning.value) {
    const d = Math.hypot(e.clientX - lastPanPos.value.x, e.clientY - lastPanPos.value.y)
    if (d > PAN_DRAG_THRESHOLD) {
      isPanning.value = true
      hasPanned.value = true
      ui.clearSearchedStarId()
      return handleMouseMove(e, starList, canvas)
    }
  }
  const { x: mx, y: my } = screenToCanvas(e, canvas)
  const w = canvas.width
  const h = canvas.height
  ui.setReticulePosition(e.clientX, e.clientY)
  ui.setReticuleVisible(true)

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
  mouseDown.value = false
  isPanning.value = false
  ui.hoveredStar = null
  ui.setHoveredSignal(null)
  ui.setReticuleVisible(false)
}

function handleMouseDown(e, canvas) {
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
  const tv = ui.targetViewDirection?.value ?? ui.targetViewDirection
  const step = 8
  let dra = 0
  let ddec = 0
  if (e.key === 'ArrowLeft') dra = -step
  if (e.key === 'ArrowRight') dra = step
  if (e.key === 'ArrowUp') ddec = step
  if (e.key === 'ArrowDown') ddec = -step
  ui.setTargetViewDirectionValue({
    ra: (tv.ra + dra + 360) % 360,
    dec: Math.max(-89, Math.min(89, tv.dec + ddec)),
  })
}

function handleClick() {
  if (hasPanned.value) return
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
  if (hasPanned.value) return
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

  await stellarSystemsStore.fetch()
  await nebulasStore.fetch()
  if (!shipStore.loaded) await shipStore.fetch()
  await stellarSystemsStore.fetchVisibleForSky(shipStore.currentSystemId, 14)
  stars.value = buildStarsFromDb(w, h)

  draw(canvasEl, stars)

  onResize = () => handleResize(canvasEl)
  onMove = (e) => handleMouseMove(e, stars.value, canvasEl)
  onDown = (e) => handleMouseDown(e, canvasEl)
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

watch(spectralFilter, () => {
  if (canvasEl) {
    const w = canvasEl.width || window.innerWidth
    const h = canvasEl.height || window.innerHeight
    stars.value = buildStarsFromDb(w, h)
  }
})

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
</style>
