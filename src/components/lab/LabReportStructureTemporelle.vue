<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import {
  generateStructureTemporelleData,
  computeAutocorrelation,
  seedFromObsId,
} from '@/lib/spectrogramData'
import { downsample } from '@/lib/arrayUtils'
import { renderLineChart } from '@/lib/labLineChart'

const props = defineProps({
  obsId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  durationSec: { type: Number, default: 72 },
  anomalous: { type: Boolean, default: false },
  structure: { type: String, default: 'non uniforme' },
})

const containerRef = ref(null)
const waveformRef = ref(null)
const autocorrRef = ref(null)
let resizeObserver = null

const WAVEFORM_MAX_POINTS = 800

function render() {
  if (!containerRef.value || !waveformRef.value || !autocorrRef.value) return
  const width = Math.max(200, containerRef.value.clientWidth - 2)
  if (width < 100) return

  const seed = seedFromObsId(props.obsId)
  const struct = (props.structure ?? '').toLowerCase()
  const isSursaut = /sursaut|burst/.test(struct)
  const isContinuDecroit = /continu décroissant|decroissant/.test(struct)
  const isPulse = !isSursaut && !isContinuDecroit && /pulsé|périodique|continu/.test(struct)
  const pulsePeriodSec =
    !props.anomalous && !isSursaut && !isContinuDecroit && (isPulse || seed % 5 === 2)
      ? 0.4 + (seed % 3) * 0.2
      : undefined
  const noiseLevel = Math.max(0.05, 0.4 - (props.fiability / 100) * 0.35)

  const durationSec = Math.min(props.durationSec ?? 72, 120)

  const rawData = generateStructureTemporelleData({
    durationSec,
    freqHz: 8 + (seed % 10),
    seed,
    noiseLevel,
    pulsePeriodSec,
    anomalous: props.anomalous,
    structure: props.structure,
  })

  const values = rawData.map(([, v]) => v)
  const waveformData = downsample(rawData, WAVEFORM_MAX_POINTS)
  const autocorrData = computeAutocorrelation(values, 3000, 15)

  const chartHeight = 150
  const margin = { top: 6, right: 6, bottom: 24, left: 42 }

  renderLineChart(waveformRef.value, {
    data: waveformData,
    width,
    height: chartHeight,
    margin,
    xDomain: [0, durationSec],
    xAccessor: (d) => d[0] / 1000,
    yAccessor: (d) => d[1],
    strokeColor: 'var(--color-cyan)',
    showZeroLine: false,
    xAxisLabel: 't (s)',
    yAxisLabel: 'amplitude',
  })

  const maxLagMs = Math.max(...autocorrData.map((d) => d[0]), 1)
  renderLineChart(autocorrRef.value, {
    data: autocorrData,
    width,
    height: chartHeight,
    margin,
    xDomain: [0, maxLagMs / 1000],
    yDomain: [
      Math.min(0, ...autocorrData.map((d) => d[1])) - 0.05,
      Math.max(1, ...autocorrData.map((d) => d[1])) + 0.05,
    ],
    xAccessor: (d) => d[0] / 1000,
    yAccessor: (d) => d[1],
    strokeColor: 'var(--color-amber)',
    showZeroLine: true,
    xAxisLabel: 'τ (s)',
    yAxisLabel: 'corrélation',
  })
}

onMounted(async () => {
  await nextTick()
  render()
  resizeObserver = new ResizeObserver(() => render())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
})

watch(
  () => [props.obsId, props.fiability, props.durationSec, props.anomalous, props.structure],
  () => render(),
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="lab-structure-temporelle">
    <div class="lab-structure-temporelle__chart">
      <span class="lab-structure-temporelle__label">forme d'onde</span>
      <svg ref="waveformRef" class="lab-structure-temporelle__svg" />
    </div>
    <div class="lab-structure-temporelle__chart">
      <span class="lab-structure-temporelle__label">autocorrélation</span>
      <svg ref="autocorrRef" class="lab-structure-temporelle__svg" />
    </div>
  </div>
</template>
