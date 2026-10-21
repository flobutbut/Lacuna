<script setup>
import { computed } from 'vue'
import { useObservatoireStore } from '@/stores/observatoire'
import { useShipStore } from '@/stores/ship'

const observatoireStore = useObservatoireStore()
const shipStore = useShipStore()

const style = computed(() => ({
  left: `${observatoireStore.reticulePosition.x}px`,
  top: `${observatoireStore.reticulePosition.y}px`,
}))

const isVisible = computed(() => observatoireStore.reticuleVisible && !shipStore.isInTransit)
</script>

<template>
  <div class="reticule" :class="{ visible: isVisible }" :style="style">
    <div class="ret-ring"></div>
    <div class="ret-cross-h"></div>
    <div class="ret-cross-v"></div>
  </div>
</template>
