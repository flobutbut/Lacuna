<script setup>
import SkyCanvas from '@/components/SkyCanvas.vue'
import SideLeft from '@/components/SideLeft.vue'
import SideRight from '@/components/SideRight.vue'
import Reticule from '@/components/Reticule.vue'
import StarTooltip from '@/components/StarTooltip.vue'
import TravelWidget from '@/components/TravelWidget.vue'
import NotificationToast from '@/components/NotificationToast.vue'
</script>

<template>
  <div class="page-observatoire">
    <SkyCanvas />
    <div class="vignette" />
    <div class="scanlines" />
    <div class="ui-layer">
      <SideLeft />
      <SideRight />
      <Reticule />
      <StarTooltip />
      <div class="center-cross">
        <div class="cc-h" />
        <div class="cc-v" />
      </div>
      <NotificationToast />
      <TravelWidget />
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
