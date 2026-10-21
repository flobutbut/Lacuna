<script setup>
import { storeToRefs } from 'pinia'
import { useObservatoireStore } from '@/stores/observatoire'
import { useStarTooltipData } from '@/composables/useStarTooltipData'
import ObservatoireTooltip from '@/components/observatoire/ObservatoireTooltip.vue'

const observatoireStore = useObservatoireStore()
const { hoveredStar, reticulePosition } = storeToRefs(observatoireStore)
const { tooltipData } = useStarTooltipData(hoveredStar, reticulePosition)
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
