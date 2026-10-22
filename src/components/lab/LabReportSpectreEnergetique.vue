<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { generateSpectreEnergetiqueData } from '@/lib/spectreEnergetiqueData'

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

  const { bins, eDomain } = generateSpectreEnergetiqueData({
    obsId: props.obsId,
    fiability: props.fiability,
    anomalous: props.anomalous,
    structure: props.structure,
  })

  const xScale = d3.scaleLinear().domain(eDomain).range([0, innerWidth])
  const maxCount = Math.max(1, ...bins.map((b) => b.count))
  const yScale = d3.scaleLinear().domain([0, maxCount * 1.05]).range([innerHeight, 0])

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  svg.attr('width', width).attr('height', chartHeight)

  const barWidth = Math.max(1, (innerWidth / bins.length) * 0.85)

  const chartGroup = svg
    .append('g')
    .attr('class', 'lab-spectre-energetique__chart')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  chartGroup
    .selectAll('rect')
    .data(bins)
    .join('rect')
    .attr('x', (d) => xScale(d.eMin) + (xScale(d.eMax) - xScale(d.eMin) - barWidth) / 2)
    .attr('y', (d) => yScale(d.count))
    .attr('width', barWidth)
    .attr('height', (d) => innerHeight - yScale(d.count))
    .attr('fill', 'var(--color-cyan)')
    .attr('fill-opacity', 0.7)
    .attr('class', 'lab-spectre-energetique__bar')

  const gX = svg
    .append('g')
    .attr('class', 'lab-spectre-energetique__axis lab-spectre-energetique__axis--x')
    .attr('transform', `translate(${margin.left},${chartHeight - margin.bottom})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(6)
        .tickSize(4)
        .tickFormat((v) => (v >= 1000 ? `${v / 1000}` : `${v}`))
    )
  gX
    .append('text')
    .attr('x', innerWidth)
    .attr('y', 18)
    .attr('text-anchor', 'end')
    .style('font-size', 'var(--text-2xs)')
    .style('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('Énergie (keV)')

  svg
    .append('g')
    .attr('class', 'lab-spectre-energetique__axis lab-spectre-energetique__axis--y')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.axisLeft(yScale).ticks(5).tickSize(4))

  svg
    .selectAll('.lab-spectre-energetique__axis')
    .style('font-size', 'var(--text-2xs)')
    .style('font-family', 'var(--font-mono)')
    .attr('color', 'var(--color-muted)')
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
  <div ref="containerRef" class="lab-spectre-energetique">
    <svg
      v-show="!errorMsg"
      ref="svgRef"
      class="lab-spectre-energetique__svg"
      role="img"
      :aria-label="`Spectre énergétique — fiabilité ${props.fiability}%`"
    />
    <div v-if="errorMsg" class="lab-spectre-energetique__error">{{ errorMsg }}</div>
  </div>
</template>
