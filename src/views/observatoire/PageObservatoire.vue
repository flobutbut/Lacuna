<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import SkyCanvas from '@/components/SkyCanvas.vue'
import SystemView from '@/components/SystemView.vue'
import ObservatoireViewTabs from '@/components/ObservatoireViewTabs.vue'
import ObservatoireAzimuth from '@/components/ObservatoireAzimuth.vue'
import SideLeft from '@/components/SideLeft.vue'
import SideRight from '@/components/SideRight.vue'
import Reticule from '@/components/Reticule.vue'
import StarTooltip from '@/components/StarTooltip.vue'
import TravelWidget from '@/components/TravelWidget.vue'
import ObservatoirePanel from '@/components/ObservatoirePanel.vue'
import SignalModal from '@/components/SignalModal.vue'
import SignalTooltip from '@/components/SignalTooltip.vue'

const ui = useUIStore()
const isSkyMode = computed(() => ui.observatoireViewMode === 'sky')
</script>

<template>
  <div class="page-observatoire">
    <SkyCanvas v-show="isSkyMode" />
    <SystemView v-show="!isSkyMode" />
    <div class="vignette" />
    <div class="scanlines" />
    <div class="ui-layer">
      <ObservatoireViewTabs />
      <SideLeft />
      <SideRight />
      <Reticule v-if="isSkyMode" />
      <StarTooltip v-if="isSkyMode" />
      <SignalTooltip v-if="isSkyMode" />
      <div v-if="isSkyMode" class="center-cross">
        <div class="cc-h" />
        <div class="cc-v" />
      </div>
      <ObservatoireAzimuth v-if="isSkyMode" />
      <TravelWidget v-if="isSkyMode" />
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
