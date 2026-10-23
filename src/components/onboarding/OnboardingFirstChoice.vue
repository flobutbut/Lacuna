<script setup>
/**
 * Onboarding — écran 5, le premier choix (LACUNA_LORE.md §3) : courte visite en étapes. Un cartouche relié
 * par un trait à ce qu'il décrit — cercle autour d'un objet du ciel, cadre autour d'un élément de l'interface.
 * [Suivant] passe à l'étape suivante, [Terminer] ferme la visite (retenue pour ce vaisseau, dans ce navigateur).
 * Sans cible visible, le cartouche reste seul en bas de l'écran. La visite disparaît au premier départ.
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useObservatoireStore } from '@/stores/observatoire'
import { useShipStore } from '@/stores/ship'
import { FIRST_CHOICE_TOUR } from '@/lib/onboarding'

const observatoireStore = useObservatoireStore()
const shipStore = useShipStore()
const { tourAnchors } = storeToRefs(observatoireStore)

/** Rayon du cercle autour d'un objet du ciel, marge du cadre, écart entre la cible et le cartouche (px) */
const RING_R = 22
const FRAME_PAD = 4
const OFFSET = 80
const MARGIN = 24

const storageKey = computed(() => `lacuna:visite-ecran5:${shipStore.ship?.id ?? ''}`)
function readDone() {
  try {
    return localStorage.getItem(storageKey.value) === 'terminee'
  } catch {
    return false
  }
}
const done = ref(readDone())
watch(storageKey, () => {
  done.value = readDone()
})

const index = ref(0)
const step = computed(() => FIRST_CHOICE_TOUR[index.value])
const isLast = computed(() => index.value === FIRST_CHOICE_TOUR.length - 1)

function next() {
  if (!isLast.value) index.value++
  else finish()
}

function finish() {
  done.value = true
  try {
    localStorage.setItem(storageKey.value, 'terminee')
  } catch {
    // Stockage indisponible : la visite réapparaîtra au prochain chargement
  }
}

const boxRef = ref(null)
const box = ref({ w: 340, h: 110 })
const viewport = ref({ w: window.innerWidth, h: window.innerHeight })
/** Cible de l'étape, en pixels de la fenêtre : { kind: 'ring', x, y } ou { kind: 'frame', x, y, w, h } */
const target = ref(null)

function measureTarget() {
  viewport.value = { w: window.innerWidth, h: window.innerHeight }
  if (boxRef.value) box.value = { w: boxRef.value.offsetWidth, h: boxRef.value.offsetHeight }
  const t = step.value?.target
  if (!t) return (target.value = null)
  if (t.sky) {
    const anchor = tourAnchors.value[t.sky]
    const canvas = document.querySelector('.sky-canvas')
    if (!anchor || !canvas) return (target.value = null)
    const r = canvas.getBoundingClientRect()
    target.value = { kind: 'ring', x: r.left + anchor.fx * r.width, y: r.top + anchor.fy * r.height }
    return
  }
  const el = document.querySelector(t.selector)
  const r = el?.getBoundingClientRect()
  if (!r || r.width === 0 || r.height === 0) return (target.value = null)
  target.value = {
    kind: 'frame',
    x: r.left - FRAME_PAD,
    y: r.top - FRAME_PAD,
    w: r.width + 2 * FRAME_PAD,
    h: r.height + 2 * FRAME_PAD,
  }
}

// Cibles du ciel : suivent la vue ; cibles de l'interface : remesurées régulièrement (panneaux, redimensionnement)
watch([tourAnchors, index], measureTarget, { deep: true })
let tick = null
onMounted(() => {
  measureTarget()
  tick = setInterval(measureTarget, 300)
  window.addEventListener('resize', measureTarget)
})
onUnmounted(() => {
  clearInterval(tick)
  window.removeEventListener('resize', measureTarget)
})

/** Cartouche au-dessus ou au-dessous de la cible (vers le centre), centré sur elle, gardé dans la fenêtre */
const layout = computed(() => {
  const t = target.value
  if (!t) return null
  const cx = t.kind === 'ring' ? t.x : t.x + t.w / 2
  const cy = t.kind === 'ring' ? t.y : t.y + t.h / 2
  const halfH = t.kind === 'ring' ? RING_R : t.h / 2
  const below = cy < viewport.value.h / 2
  const left = Math.min(Math.max(MARGIN, cx - box.value.w / 2), viewport.value.w - box.value.w - MARGIN)
  const top = Math.min(
    Math.max(MARGIN, below ? cy + halfH + OFFSET : cy - halfH - OFFSET - box.value.h),
    viewport.value.h - box.value.h - MARGIN
  )
  const endX = Math.min(Math.max(cx, left + MARGIN), left + box.value.w - MARGIN)
  const endY = below ? top : top + box.value.h
  let x1 = cx
  let y1 = below ? cy + halfH : cy - halfH
  if (t.kind === 'ring') {
    const len = Math.hypot(endX - cx, endY - cy) || 1
    x1 = cx + ((endX - cx) / len) * RING_R
    y1 = cy + ((endY - cy) / len) * RING_R
  }
  return { left, top, line: { x1, y1, x2: endX, y2: endY } }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="!done" class="onboarding-tour" role="dialog" aria-live="polite" aria-label="Premier choix">
      <svg v-if="layout" class="onboarding-tour__pointer" aria-hidden="true">
        <circle v-if="target.kind === 'ring'" :cx="target.x" :cy="target.y" :r="RING_R" />
        <rect v-else :x="target.x" :y="target.y" :width="target.w" :height="target.h" rx="3" />
        <line :x1="layout.line.x1" :y1="layout.line.y1" :x2="layout.line.x2" :y2="layout.line.y2" />
      </svg>
      <div
        ref="boxRef"
        class="onboarding-tour__box"
        :class="{ 'onboarding-tour__box--free': !layout }"
        :style="layout ? { left: `${layout.left}px`, top: `${layout.top}px` } : null"
      >
        <Transition name="onboarding-tour-fade" mode="out-in">
          <div :key="step.id">
            <p v-for="(line, i) in step.text" :key="i" class="onboarding-tour__text">{{ line }}</p>
          </div>
        </Transition>
        <div class="onboarding-tour__actions">
          <button v-if="!isLast" type="button" class="onboarding-tour__btn" @click="finish">Terminer</button>
          <button type="button" class="onboarding-tour__btn onboarding-tour__btn--primary" @click="next">
            {{ isLast ? 'Terminer' : 'Suivant' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.onboarding-tour {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay, 900);
  pointer-events: none;
  animation: onboarding-tour-in 1.5s ease both;
}

.onboarding-tour__pointer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.onboarding-tour__pointer circle,
.onboarding-tour__pointer rect,
.onboarding-tour__pointer line {
  fill: none;
  stroke: var(--color-amber);
  stroke-width: 1;
  stroke-opacity: 0.85;
  transition: all 0.4s ease;
}

.onboarding-tour__box {
  position: absolute;
  width: 340px;
  max-width: calc(100vw - 48px);
  padding: var(--space-4) var(--space-5);
  background: color-mix(in srgb, var(--color-bg) 90%, transparent);
  border: var(--border-width) solid color-mix(in srgb, var(--color-amber) 60%, transparent);
  font-family: var(--font-mono);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-white);
  pointer-events: auto;
  transition: left 0.4s ease, top 0.4s ease;
}

/* Aucune cible dans le champ : en bas de l'écran, au-dessus de la barre d'instruments */
.onboarding-tour__box--free {
  left: 50%;
  bottom: calc(var(--instruments-height, 56px) + 72px);
  transform: translateX(-50%);
}

.onboarding-tour__text {
  margin: 0;
}

.onboarding-tour__text + .onboarding-tour__text {
  margin-top: var(--space-2);
}

.onboarding-tour__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.onboarding-tour__btn {
  padding: var(--space-1) var(--space-3);
  background: transparent;
  border: var(--border-width) solid var(--border-default);
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-normal);
  text-transform: uppercase;
  cursor: pointer;
}

.onboarding-tour__btn:hover,
.onboarding-tour__btn:focus-visible {
  color: var(--color-white);
  border-color: var(--border-bright);
}

.onboarding-tour__btn--primary {
  color: var(--color-amber);
  border-color: color-mix(in srgb, var(--color-amber) 60%, transparent);
}

.onboarding-tour-fade-enter-active,
.onboarding-tour-fade-leave-active {
  transition: opacity 0.3s ease;
}

.onboarding-tour-fade-enter-from,
.onboarding-tour-fade-leave-to {
  opacity: 0;
}

@keyframes onboarding-tour-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-tour,
  .onboarding-tour__box,
  .onboarding-tour__pointer circle,
  .onboarding-tour__pointer rect,
  .onboarding-tour__pointer line {
    animation: none;
    transition: none;
  }
}
</style>
