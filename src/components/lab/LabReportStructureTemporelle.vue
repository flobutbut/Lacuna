<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import {
  generateStructureTemporelleData,
  computeAutocorrelation,
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
const waveformRef = ref(null)
const autocorrRef = ref(null)
let resizeObserver = null

const WAVEFORM_MAX_POINTS = 800

function downsample(data, maxPoints) {
  if (data.length <= maxPoints) return data
  const step = data.length / maxPoints
  const out = []
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.floor(i * step)
    out.push(data[idx])
  }
  return out
}

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

  d3.select(waveformRef.value).selectAll('*').remove()
  d3.select(autocorrRef.value).selectAll('*').remove()

  const xWave = d3.scaleLinear().domain([0, durationSec]).range([margin.left, width - margin.right])
  const yMin = Math.min(...values)
  const yMax = Math.max(...values)
  const yPad = (yMax - yMin) * 0.1 || 1
  const yWave = d3
    .scaleLinear()
    .domain([yMin - yPad, yMax + yPad])
    .range([chartHeight - margin.bottom, margin.top])

  const svgWave = d3
    .select(waveformRef.value)
    .attr('width', width)
    .attr('height', chartHeight)
    .style('background', 'var(--color-bg)')

  const lineWave = d3
    .line()
    .x((d) => xWave(d[0] / 1000))
    .y((d) => yWave(d[1]))

  svgWave
    .append('path')
    .datum(waveformData)
    .attr('fill', 'none')
    .attr('stroke', 'var(--color-cyan)')
    .attr('stroke-width', 1)
    .attr('stroke-opacity', 0.9)
    .attr('d', lineWave)

  svgWave
    .append('g')
    .attr('transform', `translate(0,${chartHeight - margin.bottom})`)
    .call(d3.axisBottom(xWave).ticks(5).tickSize(4))
    .attr('font-size', 'var(--text-xs)')
    .attr('color', 'var(--color-muted)')

  const gYWave = svgWave
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
  gYWave.call(
    d3.axisLeft(yWave).ticks(4).tickSize(-width).tickSizeOuter(0)
  )
  gYWave.attr('font-size', 'var(--text-xs)').attr('color', 'var(--color-muted)')
  gYWave.selectAll('.tick').filter((_, i, n) => i === n.length - 1).select('line').attr('stroke', 'none')

  const maxLagMs = Math.max(...autocorrData.map((d) => d[0]), 1)
  const xAutocorr = d3.scaleLinear().domain([0, maxLagMs / 1000]).range([margin.left, width - margin.right])
  const corrValues = autocorrData.map((d) => d[1])
  const yMinCorr = Math.min(0, ...corrValues) - 0.05
  const yMaxCorr = Math.max(1, ...corrValues) + 0.05
  const yAutocorr = d3
    .scaleLinear()
    .domain([yMinCorr, yMaxCorr])
    .range([chartHeight - margin.bottom, margin.top])

  const svgAutocorr = d3
    .select(autocorrRef.value)
    .attr('width', width)
    .attr('height', chartHeight)
    .style('background', 'var(--color-bg)')

  const lineAutocorr = d3
    .line()
    .x((d) => xAutocorr(d[0] / 1000))
    .y((d) => yAutocorr(d[1]))

  svgAutocorr
    .append('path')
    .datum(autocorrData)
    .attr('fill', 'none')
    .attr('stroke', 'var(--color-amber)')
    .attr('stroke-width', 1)
    .attr('stroke-opacity', 0.9)
    .attr('d', lineAutocorr)

  svgAutocorr
    .append('line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', yAutocorr(0))
    .attr('y2', yAutocorr(0))
    .attr('stroke', 'var(--color-muted)')
    .attr('stroke-dasharray', '2,2')
    .attr('stroke-opacity', 0.5)

  svgAutocorr
    .append('g')
    .attr('transform', `translate(0,${chartHeight - margin.bottom})`)
    .call(d3.axisBottom(xAutocorr).ticks(5).tickSize(4))
    .attr('font-size', 'var(--text-xs)')
    .attr('color', 'var(--color-muted)')

  const gYAutocorr = svgAutocorr
    .append('g')
    .attr('transform', `translate(${margin.left},0)`)
  gYAutocorr.call(
    d3.axisLeft(yAutocorr).ticks(4).tickSize(-width).tickSizeOuter(0)
  )
  gYAutocorr.attr('font-size', 'var(--text-xs)').attr('color', 'var(--color-muted)')
  gYAutocorr.selectAll('.tick').filter((_, i, n) => i === n.length - 1).select('line').attr('stroke', 'none')
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
