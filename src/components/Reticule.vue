<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()

const style = computed(() => ({
  left: `${ui.reticulePosition.x}px`,
  top: `${ui.reticulePosition.y}px`,
}))
</script>

<template>
  <div class="reticule" :class="{ visible: ui.reticuleVisible }" :style="style">
    <div class="ret-ring"></div>
    <div class="ret-cross-h"></div>
    <div class="ret-cross-v"></div>
  </div>
</template>
