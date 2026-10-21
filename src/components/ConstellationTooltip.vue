<script setup>
import { computed } from 'vue'
import { useObservatoireStore } from '@/stores/observatoire'
import ObservatoireTooltip from '@/components/observatoire/ObservatoireTooltip.vue'

const observatoireStore = useObservatoireStore()

const tooltipData = computed(() => {
  const c = observatoireStore.hoveredConstellation
  if (!c?.name) return null
  return {
    visible: true,
    position: observatoireStore.reticulePosition,
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
