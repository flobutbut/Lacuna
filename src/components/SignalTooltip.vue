<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()

const sig = computed(() => ui.hoveredSignal)

const tooltipStyle = computed(() => {
  if (!sig.value) return {}
  const x = ui.reticulePosition.x
  const y = ui.reticulePosition.y
  const tx = x + 18 > window.innerWidth - 200 ? x - 190 : x + 18
  return {
    left: `${tx}px`,
    top: `${y - 60}px`,
  }
})
</script>

<template>
  <div
    v-if="sig"
    class="star-tooltip visible signal-tooltip"
    :style="tooltipStyle"
  >
    <div class="st-inner">
      <div class="st-name">Signal capté</div>
      <div class="st-row">
        <span class="st-key">Fréquence</span>
        <span class="st-val">{{ sig.frequency }}</span>
      </div>
      <div class="st-row">
        <span class="st-key">Direction</span>
        <span class="st-val">azimut {{ sig.azimuth }}° · plan {{ sig.elevation >= 0 ? '+' : '' }}{{ sig.elevation }}°</span>
      </div>
      <div class="st-row">
        <span class="st-key">Distance est.</span>
        <span class="st-val">{{ sig.distanceEst ?? '—' }}</span>
      </div>
      <div class="st-row">
        <span class="st-key">Reçu le</span>
        <span class="st-val">{{ sig.receivedAt }}</span>
      </div>
      <div class="st-action">[ CLIC POUR DÉTAIL ]</div>
    </div>
  </div>
</template>
