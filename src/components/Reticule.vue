<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useShipStore } from '@/stores/ship'

const ui = useUIStore()
const shipStore = useShipStore()

const style = computed(() => ({
  left: `${ui.reticulePosition.x}px`,
  top: `${ui.reticulePosition.y}px`,
}))

const isVisible = computed(() => ui.reticuleVisible && !shipStore.isInTransit)
</script>

<template>
  <div class="reticule" :class="{ visible: isVisible }" :style="style">
    <div class="ret-ring"></div>
    <div class="ret-cross-h"></div>
    <div class="ret-cross-v"></div>
  </div>
</template>
