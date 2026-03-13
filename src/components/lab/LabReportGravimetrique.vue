<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { generateGravimetriqueData } from '@/lib/gravimetriqueData'
import { renderLineChart } from '@/lib/labLineChart'

const props = defineProps({
  obsId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  durationSec: { type: Number, default: 72 },
  anomalous: { type: Boolean, default: false },
  structure: { type: String, default: 'non uniforme' },
  obsType: { type: String, default: 'SIGNAL' },
})

const containerRef = ref(null)
const schemaRef = ref(null)
const residualsRef = ref(null)
let resizeObserver = null

const chartHeight = 140
const margin = { top: 8, right: 8, bottom: 24, left: 42 }

function render() {
  if (!containerRef.value || !schemaRef.value || !residualsRef.value) return
  const width = Math.max(280, containerRef.value.clientWidth - 2)
  if (width < 100) return

  const { sources, residuals, distanceMpc } = generateGravimetriqueData({
    obsId: props.obsId,
    fiability: props.fiability,
    durationSec: props.durationSec,
    anomalous: props.anomalous,
    structure: props.structure,
    obsType: props.obsType,
  })

  const schemaSize = Math.min(200, width - 20)
  const schemaMargin = 20

  // ── Schéma des sources ──
  d3.select(schemaRef.value).selectAll('*').remove()
  const schemaSvg = d3
    .select(schemaRef.value)
    .attr('width', width)
    .attr('height', schemaSize + schemaMargin * 2)
    .style('background', 'var(--color-bg)')

  const gSchema = schemaSvg.append('g').attr('transform', `translate(${schemaMargin},${schemaMargin})`)

  const scaleX = d3.scaleLinear().domain([0, 1]).range([0, schemaSize])
  const scaleY = d3.scaleLinear().domain([1, 0]).range([0, schemaSize])

  const maxMass = Math.max(1, ...sources.map((s) => s.massSolar))
  const minMass = Math.min(...sources.map((s) => s.massSolar), 0.1)
  const scaleR = d3.scaleSqrt().domain([minMass, maxMass]).range([6, 24])

  gSchema
    .selectAll('circle')
    .data(sources)
    .join('circle')
    .attr('cx', (d) => scaleX(d.x))
    .attr('cy', (d) => scaleY(d.y))
    .attr('r', (d) => scaleR(d.massSolar))
    .attr('fill', 'var(--color-cyan)')
    .attr('fill-opacity', 0.4)
    .attr('stroke', 'var(--color-cyan)')
    .attr('stroke-width', 1)
    .attr('stroke-opacity', 0.9)

  gSchema
    .selectAll('text')
    .data(sources)
    .join('text')
    .attr('x', (d) => scaleX(d.x))
    .attr('y', (d) => scaleY(d.y) + 4)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-white)')
    .text((d) => d.label)

  if (distanceMpc) {
    schemaSvg
      .append('text')
      .attr('x', width - schemaMargin)
      .attr('y', schemaMargin + 12)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--color-muted)')
      .text(`≈ ${distanceMpc} Mpc`)
  }

  // ── Courbe des résidus (utilitaire partagé) ──
  renderLineChart(residualsRef.value, {
    data: residuals,
    width,
    height: chartHeight,
    margin,
    xDomain: [0, Math.max(...residuals.map((d) => d[0]), 1)],
    yDomain: [
      Math.min(-0.1, ...residuals.map((d) => d[1])) - 0.02,
      Math.max(0.1, ...residuals.map((d) => d[1])) + 0.02,
    ],
    strokeColor: 'var(--color-amber)',
    showZeroLine: true,
    xAxisLabel: 't (s)',
    yAxisLabel: 'résidu',
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
  () => [props.obsId, props.fiability, props.durationSec, props.anomalous, props.structure, props.obsType],
  () => render(),
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="lab-gravimetrique">
    <div class="lab-gravimetrique__chart">
      <span class="lab-gravimetrique__label">modèle de sources</span>
      <svg ref="schemaRef" class="lab-gravimetrique__svg" />
    </div>
    <div class="lab-gravimetrique__chart">
      <span class="lab-gravimetrique__label">perturbations résiduelles</span>
      <svg ref="residualsRef" class="lab-gravimetrique__svg" />
    </div>
  </div>
</template>
