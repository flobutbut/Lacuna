<script setup>
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { useStarTooltipData } from '@/composables/useStarTooltipData'
import ObservatoireTooltip from '@/components/observatoire/ObservatoireTooltip.vue'

const ui = useUIStore()
const { hoveredStar, reticulePosition } = storeToRefs(ui)
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
