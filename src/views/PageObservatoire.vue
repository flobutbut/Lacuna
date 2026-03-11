<script setup>
import SkyCanvas from '@/components/SkyCanvas.vue'
import ObservatoireAzimuth from '@/components/ObservatoireAzimuth.vue'
import ObservatoireSpectralFilters from '@/components/ObservatoireSpectralFilters.vue'
import SideLeft from '@/components/SideLeft.vue'
import SideRight from '@/components/SideRight.vue'
import Reticule from '@/components/Reticule.vue'
import StarTooltip from '@/components/StarTooltip.vue'
import TravelWidget from '@/components/TravelWidget.vue'
import ObservatoirePanel from '@/components/ObservatoirePanel.vue'
import SignalModal from '@/components/SignalModal.vue'
import SignalTooltip from '@/components/SignalTooltip.vue'
import NotificationToast from '@/components/NotificationToast.vue'
</script>

<template>
  <div class="page-observatoire">
    <SkyCanvas />
    <div class="vignette" />
    <div class="scanlines" />
    <div class="ui-layer">
      <ObservatoireSpectralFilters />
      <SideLeft />
      <SideRight />
      <Reticule />
      <StarTooltip />
      <SignalTooltip />
      <div class="center-cross">
        <div class="cc-h" />
        <div class="cc-v" />
      </div>
      <ObservatoireAzimuth />
      <NotificationToast />
      <TravelWidget />
      <ObservatoirePanel />
      <SignalModal />
    </div>
  </div>
</template>

<style scoped>
.page-observatoire {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.page-observatoire :deep(.ui-layer) {
  position: absolute;
  inset: 0;
}
</style>
