<script setup>
import { computed, onMounted, onUnmounted, provide, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useRadarStore } from '@/stores/radar'
import { useObservatoireStore } from '@/stores/observatoire'
import { useShipStore } from '@/stores/ship'
import { useSignauxStore } from '@/stores/signaux'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { useGalacticPosition } from '@/composables/useGalacticPosition'
import { useRadarNoise } from '@/composables/useRadarNoise'
import { useRadarSpectrogram } from '@/composables/useRadarSpectrogram'
import { useRadarColumnBuffer } from '@/composables/useRadarColumnBuffer'
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
const radarStore = useRadarStore()
const observatoireStore = useObservatoireStore()
const shipStore = useShipStore()
const signauxStore = useSignauxStore()
const { radarPaused, radarFrequencyBand, radarEnabled } = storeToRefs(radarStore)
const { activePulsarSignals } = storeToRefs(signauxStore)
const isSkyMode = computed(() => observatoireStore.observatoireViewMode === 'sky')
const isRadarMode = computed(() => observatoireStore.observatoireViewMode === 'radar')

const { galacticLatitude } = useGalacticPosition()

const { getNoiseSample } = useRadarNoise(
  radarFrequencyBand,
  galacticLatitude,
  activePulsarSignals
)

const radarSpectrogram = useRadarSpectrogram(
  radarPaused,
  getNoiseSample
)
const radarColumnBuffer = useRadarColumnBuffer()
provide('radarSpectrogram', radarSpectrogram)
provide('radarColumnBuffer', radarColumnBuffer)

function onKeydown(e) {
  if (e.key !== '@') return
  if (route.name !== 'observatoire' || !isSkyMode.value) return
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
  e.preventDefault()
  observatoireStore.toggleObservatoireTiles()
}

function callComputePulsarSignals() {
  return signauxStore.computePulsarSignals(radarStore.radarFrequencyBand ?? 'L')
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  if (radarEnabled.value) radarSpectrogram.start()
  await ensureStoresLoaded(signauxStore, shipStore)
  await callComputePulsarSignals()
})

watch(radarEnabled, (val) => {
  if (val) radarSpectrogram.start()
  else radarSpectrogram.stop()
})

watch(radarFrequencyBand, () => {
  callComputePulsarSignals()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  radarSpectrogram.stop()
})
</script>

<template>
  <div class="page-observatoire">
    <SkyCanvas v-show="isSkyMode" />
    <RadarView v-show="isRadarMode" />
    <SystemView v-show="!isSkyMode && !isRadarMode" />
    <div v-if="!isSkyMode && !isRadarMode" class="vignette" />
    <div v-if="!isSkyMode && !isRadarMode" class="scanlines" />
    <div class="ui-layer">
      <ObservatoireViewTabs />
      <SideLeft v-show="(isSkyMode && observatoireStore.observatoireTilesVisible) || observatoireStore.observatoireViewMode === 'system'" />
      <SideRight v-show="observatoireStore.observatoireViewMode === 'system' || (observatoireStore.observatoireViewMode === 'sky' && observatoireStore.observatoireTilesVisible)" />
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
      <ObservatoirePanel v-if="observatoireStore.selectedStar && observatoireStore.observatoireOpen" />
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
