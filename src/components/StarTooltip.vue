<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()

const s = computed(() => ui.hoveredStar)

const travelLabel = computed(() => {
  if (!s.value) return '—'
  const travelSec = (parseFloat(s.value.dist) * 1000).toFixed(0)
  if (travelSec > 3600) return `${(travelSec / 3600).toFixed(1)}h`
  if (travelSec > 60) return `${Math.floor(travelSec / 60)}m ${travelSec % 60}s`
  return `${travelSec}s`
})

const statusText = computed(() => {
  if (!s.value) return '—'
  if (s.value.isAnomaly) return '⚠ ANOMALIE DÉTECTÉE'
  if (s.value.visited) return '✓ SYSTÈME VISITÉ'
  return '— NON EXPLORÉ'
})

const tooltipStyle = computed(() => {
  if (!s.value) return {}
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
    v-if="s"
    class="star-tooltip visible"
    :style="tooltipStyle"
  >
    <div class="st-inner">
      <div class="st-name">{{ s.name }}</div>
      <div class="st-row">
        <span class="st-key">Distance</span>
        <span class="st-val">{{ s.dist }} al</span>
      </div>
      <div class="st-row">
        <span class="st-key">Type spectral</span>
        <span class="st-val">{{ s.spectral }}</span>
      </div>
      <div class="st-row">
        <span class="st-key">Voyage estimé</span>
        <span class="st-val">{{ travelLabel }}</span>
      </div>
      <div class="st-status">{{ statusText }}</div>
      <div class="st-action">[ CLIC POUR OBSERVER ]</div>
    </div>
  </div>
</template>
