<script setup>
/**
 * Onboarding — écran 5, le premier choix (LACUNA_LORE.md §3). Un cartouche relié par un trait à un cercle
 * autour de la destination du catalogue la plus proche du centre de la vue ; sans bouton ni flèche.
 * Sans destination dans le champ, le texte reste seul en bas du ciel. Il disparaît au premier départ.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useObservatoireStore } from '@/stores/observatoire'

const observatoireStore = useObservatoireStore()
const { firstChoiceAnchor: anchor } = storeToRefs(observatoireStore)

/** Rayon du cercle autour du système, écart vertical entre le cercle et le cartouche (px) */
const RING_R = 22
const OFFSET = 80
const MARGIN = 24

const rootRef = ref(null)
const boxRef = ref(null)
const box = ref({ w: 320, h: 80 })
/** Zone visible du ciel (entre le header et la barre d'instruments), même origine que le canvas */
const viewport = ref({ w: window.innerWidth, h: window.innerHeight })

let resizeObserver = null
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    if (rootRef.value) viewport.value = { w: rootRef.value.clientWidth, h: rootRef.value.clientHeight }
    if (boxRef.value) box.value = { w: boxRef.value.offsetWidth, h: boxRef.value.offsetHeight }
  })
  if (rootRef.value) resizeObserver.observe(rootRef.value)
  if (boxRef.value) resizeObserver.observe(boxRef.value)
})
onUnmounted(() => resizeObserver?.disconnect())

/** Système montré, en pixels de la zone du ciel */
const point = computed(() =>
  anchor.value ? { x: anchor.value.fx * viewport.value.w, y: anchor.value.fy * viewport.value.h } : null
)

/** Cartouche au-dessus ou au-dessous du système (vers le centre), centré sur lui, gardé dans le champ */
const layout = computed(() => {
  const a = point.value
  if (!a) return null
  const below = a.y < viewport.value.h / 2
  const left = Math.min(Math.max(MARGIN, a.x - box.value.w / 2), viewport.value.w - box.value.w - MARGIN)
  const top = Math.min(
    Math.max(MARGIN, below ? a.y + OFFSET : a.y - OFFSET - box.value.h),
    viewport.value.h - box.value.h - MARGIN
  )
  // Trait : du bord du cercle au milieu du bord du cartouche tourné vers lui
  const endX = Math.min(Math.max(a.x, left + MARGIN), left + box.value.w - MARGIN)
  const endY = below ? top : top + box.value.h
  const len = Math.hypot(endX - a.x, endY - a.y) || 1
  return {
    left,
    top,
    line: {
      x1: a.x + ((endX - a.x) / len) * RING_R,
      y1: a.y + ((endY - a.y) / len) * RING_R,
      x2: endX,
      y2: endY,
    },
  }
})
</script>

<template>
  <div ref="rootRef" class="onboarding-first-choice" role="note">
    <svg v-if="layout" class="onboarding-first-choice__pointer" aria-hidden="true">
      <circle :cx="point.x" :cy="point.y" :r="RING_R" />
      <line :x1="layout.line.x1" :y1="layout.line.y1" :x2="layout.line.x2" :y2="layout.line.y2" />
    </svg>
    <div
      ref="boxRef"
      class="onboarding-first-choice__box"
      :class="{ 'onboarding-first-choice__box--free': !layout }"
      :style="layout ? { left: `${layout.left}px`, top: `${layout.top}px` } : null"
    >
      <p>12 anomalies figurent dans le catalogue embarqué.</p>
      <p>Choisissez celle que vous voulez comprendre.</p>
    </div>
  </div>
</template>

<style scoped>
.onboarding-first-choice {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  animation: onboarding-first-choice-in 2s ease both;
}

.onboarding-first-choice__pointer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.onboarding-first-choice__pointer circle,
.onboarding-first-choice__pointer line {
  fill: none;
  stroke: var(--color-amber);
  stroke-width: 1;
  stroke-opacity: 0.8;
}

.onboarding-first-choice__box {
  position: absolute;
  max-width: 320px;
  padding: var(--space-4) var(--space-5);
  background: color-mix(in srgb, var(--color-bg) 85%, transparent);
  border: var(--border-width) solid color-mix(in srgb, var(--color-amber) 60%, transparent);
  font-family: var(--font-mono);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--color-white);
}

/* Aucune destination dans le champ : en bas du ciel, au-dessus de l'azimut */
.onboarding-first-choice__box--free {
  left: 50%;
  bottom: 56px;
  transform: translateX(-50%);
  max-width: calc(100% - 2 * var(--page-gutter));
  text-align: center;
}

.onboarding-first-choice__box p {
  margin: 0;
}

.onboarding-first-choice__box p + p {
  margin-top: var(--space-2);
}

@keyframes onboarding-first-choice-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-first-choice {
    animation: none;
  }
}
</style>
