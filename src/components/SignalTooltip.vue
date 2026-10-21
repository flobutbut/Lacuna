<script setup>
import { computed } from 'vue'
import { useObservatoireStore } from '@/stores/observatoire'
import ObservatoireTooltip from '@/components/observatoire/ObservatoireTooltip.vue'

const observatoireStore = useObservatoireStore()

const sig = computed(() => observatoireStore.hoveredSignal)

const tooltipData = computed(() => {
  if (!sig.value) return null
  const dirText = `azimut ${sig.value.azimuth}° · plan ${sig.value.elevation >= 0 ? '+' : ''}${sig.value.elevation}°`
  return {
    visible: true,
    position: observatoireStore.reticulePosition,
    title: 'Signal capté',
    rows: [
      { key: 'Fréquence', value: sig.value.frequency },
      { key: 'Direction', value: dirText },
      { key: 'Distance est.', value: sig.value.distanceEst ?? '—' },
      { key: 'Reçu le', value: sig.value.receivedAt },
      {
        key: 'Type',
        value: sig.value.structure ?? 'non uniforme',
        icon: 'signal',
        structure: sig.value.structure,
      },
    ],
    actionLabel: '[ CLIC POUR DÉTAIL ]',
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
    :action-label="tooltipData.actionLabel"
  />
</template>
