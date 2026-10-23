<script setup>
/**
 * LptWatcher — capte la première impulsion du signal de 22 minutes (LPT-001, src/lib/lpt.js) quand elle arrive,
 * où que soit le joueur dans l'application. Sans rendu : le halo, le Radar et le ciel font le reste.
 */
import { watch, onUnmounted } from 'vue'
import { useShipStore } from '@/stores/ship'
import { useSignauxStore } from '@/stores/signaux'
import { useJournalStore } from '@/stores/journal'
import { lptPulse } from '@/lib/lpt'

/** Marge après l'heure prévue avant d'interroger le serveur (horloges légèrement décalées) */
const MARGIN_MS = 1500
/** Au-delà, setTimeout déborde */
const MAX_DELAY_MS = 2 ** 31 - 1

const shipStore = useShipStore()
const signauxStore = useSignauxStore()
const journalStore = useJournalStore()
let timer = null

async function capture() {
  clearTimeout(timer)
  timer = null
  const firstAt = await signauxStore.captureLptSignal()
  if (firstAt == null) return
  const wait = firstAt + MARGIN_MS - Date.now()
  if (wait <= MAX_DELAY_MS) timer = setTimeout(capture, Math.max(0, wait))
}

// Nouvelle partie (vaisseau rechargé) : le serveur redonne l'heure de la première impulsion
watch(
  () => shipStore.ship?.id,
  (id) => {
    if (id) capture()
  },
  { immediate: true }
)

// Première impulsion captée : entrée au journal avec sa durée (tirée côté client, bornée par le serveur)
watch(
  () => signauxStore.lptSignal?.id,
  (id) => {
    const lpt = signauxStore.lptSignal?.lpt
    if (id && lpt) journalStore.logSkyEvent('cie-004', lptPulse(lpt, lpt.firstK).durationS)
  },
  { immediate: true }
)

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <span hidden />
</template>
