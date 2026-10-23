<script setup>
/**
 * SignalHalo — halo violet sur les bords de toute l'application quand un signal commence (LACUNA_UI.md §2).
 * Déclencheurs : nouvelle capture, ouverture d'une fenêtre d'émission, impulsion d'un signal lent.
 * Plus intense du côté du signal par rapport à la direction de vue ; uniforme pour un signal sans direction.
 */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSignauxStore } from '@/stores/signaux'
import { useObservatoireStore } from '@/stores/observatoire'
import { useRadarStore } from '@/stores/radar'
import { useShipStore } from '@/stores/ship'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { isWindowOpen } from '@/lib/signalWindow'
import { haloEdges, pulseIndex, isSlowPulsed } from '@/lib/signalHalo'
import { supernovaState, SUPERNOVA_DIRECTION } from '@/lib/supernova'

/** Montée puis maintien du halo (ms) ; l'extinction (3 s) est portée par la transition CSS */
const RISE_MS = 600
const HOLD_MS = 1200
const TICK_MS = 250

const signauxStore = useSignauxStore()
const observatoireStore = useObservatoireStore()
const radarStore = useRadarStore()
const shipStore = useShipStore()
const { list, loaded } = storeToRefs(signauxStore)

const edges = ref({ top: 0, right: 0, bottom: 0, left: 0 })
/** 'rise' pendant la montée et le maintien, 'fade' pendant l'extinction */
const phase = ref('fade')
let fadeTimer = null
let tickTimer = null

/** Direction du signal sur le ciel ; null pour un émetteur du système courant ou une bouffée de neutrinos */
function directionOf(signal) {
  if (signal.sourceType === 'EMITTER' || signal.support === 'NEUTRINO') return null
  return { ra: Number(signal.azimuth) || 0, dec: Number(signal.elevation) || 0 }
}

function flash(signal) {
  if (!radarStore.radarEnabled) return
  flashToward(directionOf(signal))
}

/** Allume le halo vers une direction (null = uniforme) */
function flashToward(direction) {
  edges.value = haloEdges(direction, observatoireStore.viewDirection)
  phase.value = 'rise'
  clearTimeout(fadeTimer)
  fadeTimer = setTimeout(() => {
    phase.value = 'fade'
    edges.value = { top: 0, right: 0, bottom: 0, left: 0 }
  }, RISE_MS + HOLD_MS)
}

/** Un émetteur ne se reçoit que dans son système */
function isReceivable(signal) {
  return signal.sourceType !== 'EMITTER' || signal.sourceSystemId === shipStore.currentSystemId
}

// Nouvelles captures : les signaux déjà présents au chargement ne déclenchent rien
const seenIds = new Set()
let seeded = false
watch(
  // Les identifiants, pas le tableau : une capture ajoutée en place (unshift) doit aussi être vue
  [() => list.value.map((s) => s.id), loaded],
  () => {
    if (!loaded.value) return
    for (const s of list.value) {
      if (seenIds.has(s.id)) continue
      seenIds.add(s.id)
      if (seeded && isReceivable(s)) flash(s)
    }
    seeded = true
  },
  { immediate: true }
)

// Fenêtres qui s'ouvrent et impulsions des signaux lents, suivies à intervalle court
const lastOpen = new Map()
const lastPulse = new Map()
// Sortie du choc de la supernova : un phénomène lumineux nouveau, le halo guide le regard vers Orion
let lastSupernovaPhase = null
function tick() {
  const now = Date.now()
  const snPhase = supernovaState(shipStore.supernovaT0, now).phase
  if (lastSupernovaPhase !== null && lastSupernovaPhase !== 'breakout' && snPhase === 'breakout') {
    flashToward(SUPERNOVA_DIRECTION)
  }
  lastSupernovaPhase = snPhase
  for (const s of list.value) {
    if (!isReceivable(s)) continue
    const open = isWindowOpen(s.window, now)
    if (s.window) {
      if (lastOpen.get(s.id) === false && open) flash(s)
      lastOpen.set(s.id, open)
    }
    if (open && isSlowPulsed(s)) {
      const k = pulseIndex(s, now / 1000)
      const previous = lastPulse.get(s.id)
      if (previous !== undefined && k !== previous) flash(s)
      lastPulse.set(s.id, k)
    } else {
      lastPulse.delete(s.id)
    }
  }
}

onMounted(async () => {
  await ensureStoresLoaded(signauxStore, shipStore)
  tickTimer = setInterval(tick, TICK_MS)
})

onUnmounted(() => {
  clearInterval(tickTimer)
  clearTimeout(fadeTimer)
})
</script>

<template>
  <div class="signal-halo" :class="`signal-halo--${phase}`" aria-hidden="true">
    <div class="signal-halo__edge signal-halo__edge--top" :style="{ opacity: edges.top }" />
    <div class="signal-halo__edge signal-halo__edge--right" :style="{ opacity: edges.right }" />
    <div class="signal-halo__edge signal-halo__edge--bottom" :style="{ opacity: edges.bottom }" />
    <div class="signal-halo__edge signal-halo__edge--left" :style="{ opacity: edges.left }" />
  </div>
</template>

<style scoped>
.signal-halo {
  position: fixed;
  inset: 0;
  z-index: var(--z-halo);
  pointer-events: none;
}

.signal-halo__edge {
  position: absolute;
  opacity: 0;
  --halo-color: color-mix(in srgb, var(--color-signal) 45%, transparent);
}

.signal-halo--rise .signal-halo__edge {
  transition: opacity 600ms ease-out;
}

.signal-halo--fade .signal-halo__edge {
  transition: opacity 3000ms ease-in;
}

.signal-halo__edge--top,
.signal-halo__edge--bottom {
  left: 0;
  right: 0;
  height: 14vmin;
}

.signal-halo__edge--left,
.signal-halo__edge--right {
  top: 0;
  bottom: 0;
  width: 14vmin;
}

.signal-halo__edge--top {
  top: 0;
  background: linear-gradient(to bottom, var(--halo-color), transparent);
}

.signal-halo__edge--bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--halo-color), transparent);
}

.signal-halo__edge--left {
  left: 0;
  background: linear-gradient(to right, var(--halo-color), transparent);
}

.signal-halo__edge--right {
  right: 0;
  background: linear-gradient(to left, var(--halo-color), transparent);
}

/* Mouvement réduit : apparition et disparition sans fondu */
@media (prefers-reduced-motion: reduce) {
  .signal-halo--rise .signal-halo__edge,
  .signal-halo--fade .signal-halo__edge {
    transition: none;
  }
}
</style>
