<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { generateMorphoData } from '@/lib/morphoData'
import { interpolateCyanAmber } from '@/lib/labColors'

const props = defineProps({
  obsId: { type: String, default: '' },
  systemId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  anomalous: { type: Boolean, default: false },
})

const containerRef = ref(null)
const shapeRef = ref(null)
const thermalRef = ref(null)
let resizeObserver = null
let morphoData = null

const shapeSize = 180
const thermalSize = 200
const margin = { top: 8, right: 44, bottom: 24, left: 8 }

function getShapePath(shape) {
  const cx = shapeSize / 2
  const cy = shapeSize / 2
  const r = Math.min(cx, cy) - 8
  if (shape.type === 'elongated' || shape.type === 'irregular') {
    const ratio = shape.aspectRatio
    const rx = r
    const ry = Math.max(4, r / ratio)
    return `M ${cx - rx},${cy} A ${rx},${ry} 0 0 1 ${cx + rx},${cy} A ${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`
  }
  if (shape.type === 'faceted') {
    const n = shape.facets || 6
    const points = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2
      points.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
    }
    return `M ${points.join(' L ')} Z`
  }
  const rx = r * (0.9 + (shape.aspectRatio - 1) * 0.3)
  const ry = r * 1.1
  return `M ${cx - rx},${cy} A ${rx},${ry} 0 0 1 ${cx + rx},${cy} A ${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`
}

function render() {
  if (!containerRef.value || !shapeRef.value || !thermalRef.value) return

  morphoData = generateMorphoData({
    obsId: props.obsId,
    systemId: props.systemId,
    fiability: props.fiability,
    anomalous: props.anomalous,
  })

  const width = Math.max(320, containerRef.value.clientWidth - 2)
  const { shape, thermal, params } = morphoData
  const { grid, min, max } = thermal

  const colorScale = d3.scaleSequential((t) => interpolateCyanAmber(t)).domain([min, max])

  // ── Modèle de forme (silhouette) ──
  d3.select(shapeRef.value).selectAll('*').remove()
  const shapeSvg = d3
    .select(shapeRef.value)
    .attr('width', width)
    .attr('height', shapeSize + margin.top + margin.bottom)
    .style('background', 'var(--color-bg)')

  const gShape = shapeSvg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  gShape
    .append('path')
    .attr('d', getShapePath(shape))
    .attr('fill', 'rgba(0,180,200,0.15)')
    .attr('stroke', 'var(--color-cyan)')
    .attr('stroke-width', 1.5)

  shapeSvg
    .append('text')
    .attr('x', margin.left + 8)
    .attr('y', margin.top + 14)
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text(`L/l ≈ ${params.elongation} · ${params.symetrie}`)

  // ── Carte thermique ──
  d3.select(thermalRef.value).selectAll('*').remove()
  const thermalSvg = d3
    .select(thermalRef.value)
    .attr('width', width)
    .attr('height', thermalSize + margin.top + margin.bottom)
    .style('background', 'var(--color-bg)')

  const gThermal = thermalSvg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const heatWidth = Math.min(thermalSize, width - margin.left - margin.right)
  const scaleX = d3.scaleLinear().domain([0, grid[0].length]).range([0, heatWidth])
  const scaleY = d3.scaleLinear().domain([0, grid.length]).range([0, heatWidth])
  const cellW = scaleX(1) - scaleX(0)
  const cellH = scaleY(1) - scaleY(0)

  gThermal
    .selectAll('rect')
    .data(grid.flatMap((row, i) => row.map((v, j) => ({ i, j, v }))))
    .join('rect')
    .attr('x', (d) => scaleX(d.j))
    .attr('y', (d) => scaleY(d.i))
    .attr('width', Math.max(1, cellW))
    .attr('height', Math.max(1, cellH))
    .attr('fill', (d) => colorScale(d.v))
    .attr('stroke', 'none')

  const legendWidth = 72
  const legendHeight = 6
  const legendX = width - margin.right - legendWidth
  const legendY = margin.top + 4

  const defs = thermalSvg.append('defs')
  const gradId = 'morpho-therm-' + (props.obsId || 'def')
  defs
    .append('linearGradient')
    .attr('id', gradId)
    .selectAll('stop')
    .data([0, 1])
    .join('stop')
    .attr('offset', (d) => d)
    .attr('stop-color', (d) => interpolateCyanAmber(d))

  thermalSvg
    .append('rect')
    .attr('x', legendX)
    .attr('y', legendY)
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('fill', `url(#${gradId})`)

  thermalSvg
    .append('text')
    .attr('x', legendX)
    .attr('y', legendY - 2)
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text(`${Math.round(min)} K`)

  thermalSvg
    .append('text')
    .attr('x', legendX + legendWidth)
    .attr('y', legendY - 2)
    .attr('text-anchor', 'end')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text(`${Math.round(max)} K`)
}

onMounted(async () => {
  await nextTick()
  render()
  resizeObserver = new ResizeObserver(() => {
    if (morphoData) render()
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
  <div ref="containerRef" class="lab-morpho">
    <div class="lab-morpho__chart">
      <span class="lab-morpho__label">Modèle de surface (profil)</span>
      <svg ref="shapeRef" class="lab-morpho__svg" role="img" aria-label="Profil morphologique" />
    </div>
    <div class="lab-morpho__chart">
      <span class="lab-morpho__label">Carte thermique</span>
      <svg ref="thermalRef" class="lab-morpho__svg" role="img" aria-label="Carte thermique de surface" />
    </div>
  </div>
</template>

<style scoped>
.lab-morpho {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.lab-morpho__chart {
  padding: var(--space-3) 0;
  border-bottom: var(--border-width) solid var(--border-default);
}
.lab-morpho__chart:last-child {
  border-bottom: none;
}
.lab-morpho__label {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-muted);
  margin-bottom: var(--space-2);
}
.lab-morpho__svg {
  display: block;
  width: 100%;
  max-width: 100%;
}
</style>
