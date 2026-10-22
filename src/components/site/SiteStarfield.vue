<script setup>
/**
 * Fond étoilé du site public : trois couches en parallaxe, scintillement lent,
 * et une anomalie ambrée qui pulse. Statique si l'utilisateur réduit les animations.
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getCssVar } from '@/lib/cssVars'
import { seededRandom } from '@/lib/random'

const props = defineProps({
  /** Défilement du conteneur du site (px), pour la parallaxe */
  scrollY: { type: Number, default: 0 },
})

const canvas = ref(null)
let ctx = null
let stars = []
let amber = ''
let width = 0
let height = 0
let frame = 0
let resizeObserver = null
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Profondeur des couches : vitesse de parallaxe, taille, luminosité */
const LAYERS = [
  { share: 0.62, speed: 0.04, size: [0.4, 0.9], alpha: [0.25, 0.55] },
  { share: 0.3, speed: 0.1, size: [0.7, 1.3], alpha: [0.45, 0.8] },
  { share: 0.08, speed: 0.2, size: [1.1, 1.9], alpha: [0.7, 1] },
]

function buildStars() {
  const random = seededRandom(1977)
  amber = getCssVar('--color-amber', '#e8a020')
  const palette = [getCssVar('--color-white', '#e2eaef'), getCssVar('--color-cyan-muted', '#5eb8c4'), amber]
  const count = Math.round((width * height) / 2600)
  stars = []
  for (const layer of LAYERS) {
    for (let i = 0; i < count * layer.share; i++) {
      const tint = random()
      stars.push({
        x: random() * width,
        // Champ plus haut que l'écran : la parallaxe ne révèle jamais de bord vide
        y: random() * height * 3,
        r: layer.size[0] + random() * (layer.size[1] - layer.size[0]),
        a: layer.alpha[0] + random() * (layer.alpha[1] - layer.alpha[0]),
        speed: layer.speed,
        phase: random() * Math.PI * 2,
        twinkle: 0.4 + random() * 1.2,
        color: tint < 0.82 ? palette[0] : tint < 0.95 ? palette[1] : palette[2],
      })
    }
  }
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = canvas.value.clientWidth
  height = canvas.value.clientHeight
  canvas.value.width = width * dpr
  canvas.value.height = height * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  buildStars()
  draw(performance.now())
}

function draw(now) {
  const t = now / 1000
  ctx.clearRect(0, 0, width, height)
  const fieldHeight = height * 3
  for (const s of stars) {
    const y = (((s.y - props.scrollY * s.speed) % fieldHeight) + fieldHeight) % fieldHeight
    if (y > height + 2) continue
    const flicker = reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(t * s.twinkle + s.phase)
    ctx.globalAlpha = s.a * flicker
    ctx.fillStyle = s.color
    ctx.beginPath()
    ctx.arc(s.x, y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
  drawAnomaly(t)
  ctx.globalAlpha = 1
}

/** L'anomalie : un point ambré qui respire, en bas à droite du premier écran */
function drawAnomaly(t) {
  const x = width * 0.84
  const y = height * 0.64 - props.scrollY * 0.16
  if (y < -40) return
  const pulse = reducedMotion ? 0.6 : 0.5 + 0.5 * Math.sin(t * 1.3)
  const halo = ctx.createRadialGradient(x, y, 0, x, y, 26)
  halo.addColorStop(0, amber)
  halo.addColorStop(1, 'transparent')
  ctx.globalAlpha = 0.12 + 0.18 * pulse
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.arc(x, y, 26, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.85
  ctx.fillStyle = amber
  ctx.beginPath()
  ctx.arc(x, y, 1.8, 0, Math.PI * 2)
  ctx.fill()
}

function loop(now) {
  // Le premier redimensionnement (ResizeObserver) construit le ciel
  if (stars.length) draw(now)
  frame = requestAnimationFrame(loop)
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas.value)
  if (!reducedMotion) frame = requestAnimationFrame(loop)
})

// Animations réduites : pas de boucle, on redessine seulement au défilement
watch(
  () => props.scrollY,
  () => {
    if (reducedMotion && ctx) draw(performance.now())
  }
)

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
})
</script>

<template>
  <canvas ref="canvas" class="site-starfield" aria-hidden="true" />
</template>
