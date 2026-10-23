<script setup>
/**
 * SupernovaWatcher — capte la bouffée de neutrinos de Bételgeuse quand T0 arrive, où que soit le joueur
 * dans l'application (SN-001, src/lib/supernova.js). Sans rendu : le halo et le ciel font le reste.
 */
import { watch, onUnmounted } from 'vue'
import { useShipStore } from '@/stores/ship'
import { useSignauxStore } from '@/stores/signaux'

/** Marge après T0 avant d'interroger le serveur (horloges légèrement décalées) */
const MARGIN_MS = 1500

const shipStore = useShipStore()
const signauxStore = useSignauxStore()
let timer = null

watch(
  () => shipStore.supernovaT0,
  (t0) => {
    clearTimeout(timer)
    const t0Ms = Date.parse(t0)
    if (!Number.isFinite(t0Ms)) return
    const wait = t0Ms + MARGIN_MS - Date.now()
    // Un délai trop long pour setTimeout (plus de ~24 jours) : la bouffée ne serait plus captable de toute façon
    if (wait > 2 ** 31 - 1) return
    timer = setTimeout(() => signauxStore.captureSupernovaNeutrinos(), Math.max(0, wait))
  },
  { immediate: true }
)

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <span hidden />
</template>
