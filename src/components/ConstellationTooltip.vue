<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import ObservatoireTooltip from '@/components/observatoire/ObservatoireTooltip.vue'

const ui = useUIStore()

const tooltipData = computed(() => {
  const c = ui.hoveredConstellation
  if (!c?.name) return null
  return {
    visible: true,
    position: ui.reticulePosition,
    title: c.name,
    rows: [],
    status: '',
    actionLabel: '',
  }
})
</script>

<template>
  <ObservatoireTooltip
    v-if="tooltipData"
    :visible="tooltipData.visible"
    :position="tooltipData.position"
    :title="tooltipData.title"
    :rows="tooltipData.rows"
    :status="tooltipData.status"
    :action-label="tooltipData.actionLabel"
  />
</template>
