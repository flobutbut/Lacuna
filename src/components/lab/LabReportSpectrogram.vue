<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import {
  generateSpectrogramData,
  computeSpectrogramMatrix,
  seedFromObsId,
  SAMPLE_RATE,
} from '@/lib/spectrogramData'

const props = defineProps({
  obsId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  durationSec: { type: Number, default: 72 },
  anomalous: { type: Boolean, default: false },
  structure: { type: String, default: 'non uniforme' },
})

const containerRef = ref(null)
const svgRef = ref(null)
const errorMsg = ref('')
let resizeObserver = null

const margin = { left: 42, right: 8, top: 8, bottom: 24 }
const chartHeight = 200

function render() {
  if (!containerRef.value || !svgRef.value) return
  errorMsg.value = ''

  const width = Math.max(280, containerRef.value.clientWidth || 400)
  if (width < 80) {
    errorMsg.value = 'Espace insuffisant.'
    return
  }

  const innerWidth = width - margin.left - margin.right
  const innerHeight = chartHeight - margin.top - margin.bottom

  const seed = seedFromObsId(props.obsId)
  const noiseLevel = Math.max(0.05, 0.35 - (props.fiability / 100) * 0.3)
  const rawData = generateSpectrogramData({
    durationSec: props.durationSec,
    freqHz: 10 + (seed % 8),
    seed,
    noiseLevel,
    anomalous: props.anomalous,
    structure: props.structure,
  })

  if (rawData.length < 256) {
    errorMsg.value = 'Données insuffisantes.'
    return
  }

  const spec = computeSpectrogramMatrix(rawData, SAMPLE_RATE, props.durationSec, {
    anomalous: props.anomalous,
    timeSteps: 480,
    freqBins: 96,
  })

  if (!spec || spec.cells.length === 0) {
    errorMsg.value = 'Erreur de calcul du spectrogramme.'
    return
  }

  const { cells, tDomain, fDomain, dt, df } = spec

  const xScale = d3.scaleLinear().domain(tDomain).range([0, innerWidth])
  const yScale = d3.scaleLinear().domain(fDomain).range([innerHeight, 0])
  const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 1])

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  svg.attr('width', width).attr('height', chartHeight)

  const axisBottom = svg
    .append('g')
    .attr('class', 'lab-spectrogram__axis lab-spectrogram__axis--x')
    .attr('transform', `translate(${margin.left},${chartHeight - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(6).tickSize(4))
  axisBottom
    .append('text')
    .attr('x', innerWidth)
    .attr('y', 18)
    .attr('text-anchor', 'end')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('Temps (s)')

  const axisLeft = svg
    .append('g')
    .attr('class', 'lab-spectrogram__axis lab-spectrogram__axis--y')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.axisLeft(yScale).ticks(5).tickSize(4))
  axisLeft
    .append('text')
    .attr('x', -8)
    .attr('y', 0)
    .attr('text-anchor', 'end')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('Fréq. (Hz)')

  svg
    .selectAll('.lab-spectrogram__axis')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('color', 'var(--color-muted)')

  const heatmapWrap = svg
    .append('g')
    .attr('class', 'lab-spectrogram__heatmap-wrap')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const cellWidth = Math.max(0.5, xScale(dt) - xScale(0))
  const cellHeight = Math.max(0.5, yScale(0) - yScale(df))

  heatmapWrap
    .selectAll('rect')
    .data(cells)
    .join('rect')
    .attr('x', (d) => Math.max(0, xScale(d.t - dt / 2)))
    .attr('y', (d) => yScale(d.f + df / 2))
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .attr('fill', (d) => colorScale(d.value))
    .attr('class', 'lab-spectrogram__cell')
}

onMounted(async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 50))
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
  <div ref="containerRef" class="lab-spectrogram">
    <svg
      v-show="!errorMsg"
      ref="svgRef"
      class="lab-spectrogram__svg"
      role="img"
      :aria-label="`Spectrogramme — ${props.durationSec}s, fiabilité ${props.fiability}%`"
    />
    <div v-if="errorMsg" class="lab-spectrogram__error">{{ errorMsg }}</div>
  </div>
</template>
