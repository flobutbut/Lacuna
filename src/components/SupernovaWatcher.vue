<script setup>
/**
 * SupernovaWatcher — capte la montée des neutrinos de pré-supernova puis la bouffée de Bételgeuse
 * quand leur heure arrive, où que soit le joueur dans l'application (SN-001, src/lib/supernova.js).
 * Sans rendu : le halo et le ciel font le reste.
 */
import { watch, onUnmounted } from 'vue'
import { useShipStore } from '@/stores/ship'
import { useSignauxStore } from '@/stores/signaux'
import { PRE_SUPERNOVA_LEAD_MS } from '@/lib/supernova'

/** Marge après l'heure prévue avant d'interroger le serveur (horloges légèrement décalées) */
const MARGIN_MS = 1500
/** Au-delà, setTimeout déborde ; la capture ne serait de toute façon plus possible */
const MAX_DELAY_MS = 2 ** 31 - 1

const shipStore = useShipStore()
const signauxStore = useSignauxStore()
let timers = []

function clearTimers() {
  timers.forEach(clearTimeout)
  timers = []
}

watch(
  () => shipStore.supernovaT0,
  (t0) => {
    clearTimers()
    const t0Ms = Date.parse(t0)
    if (!Number.isFinite(t0Ms)) return
    // Une capture au début de la montée, une autre à la bouffée : le serveur ne garde que ce qui est dû
    for (const at of [t0Ms - PRE_SUPERNOVA_LEAD_MS, t0Ms]) {
      const wait = at + MARGIN_MS - Date.now()
      if (wait > MAX_DELAY_MS) continue
      timers.push(setTimeout(() => signauxStore.captureSupernovaNeutrinos(), Math.max(0, wait)))
    }
  },
  { immediate: true }
)

onUnmounted(clearTimers)
</script>

<template>
  <span hidden />
</template>
