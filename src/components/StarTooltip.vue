<script setup>
import { computed, watch } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import ObservatoireTooltip from '@/components/ObservatoireTooltip.vue'

const ui = useUIStore()
const systemObjectsStore = useSystemObjectsStore()

const s = computed(() => ui.hoveredStar)

watch(() => s.value?.id, (id) => {
  if (id) systemObjectsStore.fetchForSystem(id)
}, { immediate: true })

const exoplanetCount = computed(() => {
  const id = s.value?.id
  if (!id) return null
  const objects = systemObjectsStore.getForSystem(id)
  const planets = objects.filter((o) => ['PLANET', 'MOON', 'MINOR_BODY'].includes(o.type))
  return planets.length
})

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

const tooltipData = computed(() => {
  if (!s.value) return null
  const rows = [
    { key: 'Distance', value: `${s.value.dist} al` },
    { key: 'Type spectral', value: s.value.spectral },
    { key: 'Voyage estimé', value: travelLabel.value },
  ]
  const count = exoplanetCount.value
  const systemId = s.value?.id
  const hasLoaded = systemId && systemObjectsStore.bySystem[systemId]
  if (hasLoaded && count != null) {
    const label = count === 0 ? 'Aucune connue' : count === 1 ? '1 connue' : `${count} connues`
    rows.push({ key: 'Exoplanètes', value: label })
  }
  return {
    visible: true,
    position: ui.reticulePosition,
    title: s.value.name,
    rows,
    status: statusText.value,
    actionLabel: '[ CLIC POUR OBSERVER ]',
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
