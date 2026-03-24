<script setup>
import { computed, onMounted, onUnmounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useRadarSpectrogram } from '@/composables/useRadarSpectrogram'
import SkyCanvas from '@/components/SkyCanvas.vue'
import RadarView from './RadarView.vue'
import SystemView from './SystemView.vue'
import ObservatoireViewTabs from '@/components/observatoire/ObservatoireViewTabs.vue'
import ObservatoireAzimuth from '@/components/observatoire/ObservatoireAzimuth.vue'
import SideLeft from '@/components/SideLeft.vue'
import SideRight from '@/components/SideRight.vue'
import Reticule from '@/components/Reticule.vue'
import StarTooltip from '@/components/StarTooltip.vue'
import TravelWidget from '@/components/TravelWidget.vue'
import DepartureConfirmation from '@/components/DepartureConfirmation.vue'
import ObservatoirePanel from '@/components/observatoire/ObservatoirePanel.vue'
import SignalModal from '@/components/SignalModal.vue'
import SignalTooltip from '@/components/SignalTooltip.vue'
import ConstellationTooltip from '@/components/ConstellationTooltip.vue'

const route = useRoute()
const ui = useUIStore()
const isSkyMode = computed(() => ui.observatoireViewMode === 'sky')
const isRadarMode = computed(() => ui.observatoireViewMode === 'radar')

const radarSpectrogram = useRadarSpectrogram()
provide('radarSpectrogram', radarSpectrogram)

function onKeydown(e) {
  if (e.key !== '@') return
  if (route.name !== 'observatoire' || !isSkyMode.value) return
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
  e.preventDefault()
  ui.toggleObservatoireTiles()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  radarSpectrogram.start()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  radarSpectrogram.stop()
})
</script>

<template>
  <div class="page-observatoire">
    <SkyCanvas v-show="isSkyMode" />
    <RadarView v-if="isRadarMode" />
    <SystemView v-show="!isSkyMode && !isRadarMode" />
    <div v-if="!isSkyMode && !isRadarMode" class="vignette" />
    <div v-if="!isSkyMode && !isRadarMode" class="scanlines" />
    <div class="ui-layer">
      <ObservatoireViewTabs />
      <SideLeft v-show="(isSkyMode && ui.observatoireTilesVisible) || ui.observatoireViewMode === 'system'" />
      <SideRight v-show="ui.observatoireViewMode === 'system' || (ui.observatoireViewMode === 'sky' && ui.observatoireTilesVisible)" />
      <Reticule v-if="isSkyMode" />
      <StarTooltip v-if="isSkyMode" />
      <SignalTooltip v-if="isSkyMode" />
      <ConstellationTooltip v-if="isSkyMode" />
      <div v-if="isSkyMode" class="center-cross">
        <div class="cc-h" />
        <div class="cc-v" />
      </div>
      <ObservatoireAzimuth v-if="isSkyMode" />
      <TravelWidget v-if="isSkyMode" />
      <DepartureConfirmation v-if="isSkyMode" />
      <ObservatoirePanel v-if="ui.selectedStar && ui.observatoireOpen" />
      <SignalModal />
    </div>
  </div>
</template>

<style scoped>
.page-observatoire {
  position: fixed;
  top: var(--header-height);
  left: 0;
  right: 0;
  bottom: var(--instruments-height);
  height: calc(100vh - var(--header-height) - var(--instruments-height));
  max-height: calc(100vh - var(--header-height) - var(--instruments-height));
  overflow: auto;
}
.page-observatoire :deep(.ui-layer) {
  position: absolute;
  inset: 0;
}
</style>
