<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { generateVolumetricData } from '@/lib/volumetricData'
import { interpolateCyanAmber } from '@/lib/labColors'

const props = defineProps({
  obsId: { type: String, default: '' },
  systemId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  anomalous: { type: Boolean, default: false },
})

const containerRef = ref(null)
const heatmapRef = ref(null)
const cutRef = ref(null)
let resizeObserver = null
let volumetricData = null

const heatmapSize = 260
const cutHeight = 80
const margin = { top: 8, right: 40, bottom: 24, left: 8 }

function render() {
  if (!containerRef.value || !heatmapRef.value || !cutRef.value) return

  volumetricData = generateVolumetricData({
    obsId: props.obsId,
    systemId: props.systemId,
    fiability: props.fiability,
    anomalous: props.anomalous,
  })

  const width = Math.max(320, containerRef.value.clientWidth - 2)
  const { grid, min, max, cutX, cutY } = volumetricData

  const colorScale = d3.scaleSequential((t) => interpolateCyanAmber(t)).domain([min, max])

  const cellSize = heatmapSize / grid.length

  // ── Heatmap ──
  d3.select(heatmapRef.value).selectAll('*').remove()
  const heatmapSvg = d3
    .select(heatmapRef.value)
    .attr('width', width)
    .attr('height', heatmapSize + margin.top + margin.bottom)
    .style('background', 'var(--color-bg)')

  const gHeat = heatmapSvg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const heatWidth = Math.min(heatmapSize, width - margin.left - margin.right)
  const scaleX = d3.scaleLinear().domain([0, grid[0].length]).range([0, heatWidth])
  const scaleY = d3.scaleLinear().domain([0, grid.length]).range([0, heatWidth])
  const cellW = scaleX(1) - scaleX(0)
  const cellH = scaleY(1) - scaleY(0)

  gHeat
    .selectAll('rect')
    .data(grid.flatMap((row, i) => row.map((v, j) => ({ i, j, v }))))
    .join('rect')
    .attr('x', (d) => scaleX(d.j))
    .attr('y', (d) => scaleY(d.i))
    .attr('width', Math.max(1, cellW))
    .attr('height', Math.max(1, cellH))
    .attr('fill', (d) => colorScale(d.v))
    .attr('stroke', 'none')

  // Échelle de couleurs
  const legendWidth = 80
  const legendHeight = 8
  const legendX = width - margin.right - legendWidth
  const legendY = margin.top + 4

  const defs = heatmapSvg.append('defs')
  const gradId = 'vol-grad-' + (props.obsId || 'def')
  defs
    .append('linearGradient')
    .attr('id', gradId)
    .selectAll('stop')
    .data([0, 0.5, 1])
    .join('stop')
    .attr('offset', (d) => d)
    .attr('stop-color', (d) => interpolateCyanAmber(d))

  heatmapSvg
    .append('rect')
    .attr('x', legendX)
    .attr('y', legendY)
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('fill', `url(#${gradId})`)

  heatmapSvg
    .append('text')
    .attr('x', legendX)
    .attr('y', legendY - 2)
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text(max.toFixed(2))

  heatmapSvg
    .append('text')
    .attr('x', legendX + legendWidth)
    .attr('y', legendY - 2)
    .attr('text-anchor', 'end')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text(min.toFixed(2))

  // ── Coupe (profil horizontal) ──
  d3.select(cutRef.value).selectAll('*').remove()
  const cutSvg = d3
    .select(cutRef.value)
    .attr('width', width)
    .attr('height', cutHeight + margin.bottom)
    .style('background', 'var(--color-bg)')

  const cutInnerWidth = width - margin.left - margin.right
  const xScaleCut = d3.scaleLinear().domain([0, 1]).range([0, cutInnerWidth])
  const yScaleCut = d3
    .scaleLinear()
    .domain([min, max])
    .range([cutHeight - 4, 4])
    .clamp(true)

  const line = d3
    .line()
    .x((d) => margin.left + xScaleCut(d[0]))
    .y((d) => yScaleCut(d[1]))

  cutSvg
    .append('path')
    .datum(cutX)
    .attr('fill', 'none')
    .attr('stroke', 'var(--color-cyan)')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.9)
    .attr('d', line)

  cutSvg
    .append('g')
    .attr('transform', `translate(${margin.left},${cutHeight})`)
    .call(d3.axisBottom(xScaleCut).ticks(5).tickFormat((v) => `${(v * 100).toFixed(0)} %`).tickSize(4))
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('color', 'var(--color-muted)')

  cutSvg
    .append('text')
    .attr('x', margin.left + cutInnerWidth / 2)
    .attr('y', cutHeight + margin.bottom - 4)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('Coupe horizontale (centre)')
}

onMounted(async () => {
  await nextTick()
  render()
  resizeObserver = new ResizeObserver(() => {
    if (volumetricData) render()
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) resizeObserver.unobserve(containerRef.value)
})

watch(
  () => [props.obsId, props.systemId, props.fiability, props.anomalous],
  () => render(),
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="lab-volumetrique">
    <div class="lab-volumetrique__chart">
      <span class="lab-volumetrique__label">Carte de densité (plan)</span>
      <svg ref="heatmapRef" class="lab-volumetrique__svg" role="img" aria-label="Carte de densité volumétrique" />
    </div>
    <div class="lab-volumetrique__chart">
      <span class="lab-volumetrique__label">Profil (gradient)</span>
      <svg ref="cutRef" class="lab-volumetrique__svg" role="img" aria-label="Coupe horizontale" />
    </div>
  </div>
</template>

<style scoped>
.lab-volumetrique {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.lab-volumetrique__chart {
  padding: var(--space-3) 0;
  border-bottom: var(--border-width) solid var(--border-default);
}
.lab-volumetrique__chart:last-child {
  border-bottom: none;
}
.lab-volumetrique__label {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-muted);
  margin-bottom: var(--space-2);
}
.lab-volumetrique__svg {
  display: block;
  width: 100%;
  max-width: 100%;
}
.lab-volumetrique .tick text {
  font-size: var(--text-xs);
  fill: var(--color-muted);
  font-family: var(--font-mono);
}
</style>
