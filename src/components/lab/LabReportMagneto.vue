<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { generateMagnetoData } from '@/lib/magnetoData'

const props = defineProps({
  obsId: { type: String, default: '' },
  systemId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  anomalous: { type: Boolean, default: false },
})

const containerRef = ref(null)
const mapRef = ref(null)
const profileRef = ref(null)
let resizeObserver = null
let magnetoData = null

const mapSize = 200
const profileHeight = 90
const margin = { top: 8, right: 44, bottom: 24, left: 8 }

/** Gradient cyan (faible) → amber (intense) */
function interpolateCyanAmber(t) {
  const cyan = { r: 0, g: 180, b: 200 }
  const amber = { r: 232, g: 160, b: 32 }
  const r = cyan.r + (amber.r - cyan.r) * t
  const g = cyan.g + (amber.g - cyan.g) * t
  const b = cyan.b + (amber.b - cyan.b) * t
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}

function formatB(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} µT`
  return `${Math.round(n)} nT`
}

function render() {
  if (!containerRef.value || !mapRef.value || !profileRef.value) return

  magnetoData = generateMagnetoData({
    obsId: props.obsId,
    systemId: props.systemId,
    fiability: props.fiability,
    anomalous: props.anomalous,
  })

  const width = Math.max(320, containerRef.value.clientWidth - 2)
  const { grid, min, max, profile, params } = magnetoData

  const colorScale = d3.scaleSequential((t) => interpolateCyanAmber(t)).domain([min, max])

  // ── Carte du champ ──
  d3.select(mapRef.value).selectAll('*').remove()
  const mapSvg = d3
    .select(mapRef.value)
    .attr('width', width)
    .attr('height', mapSize + margin.top + margin.bottom)
    .style('background', 'var(--color-bg)')

  const gMap = mapSvg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  const mapWidth = Math.min(mapSize, width - margin.left - margin.right)
  const scaleX = d3.scaleLinear().domain([0, grid[0].length]).range([0, mapWidth])
  const scaleY = d3.scaleLinear().domain([0, grid.length]).range([0, mapWidth])
  const cellW = scaleX(1) - scaleX(0)
  const cellH = scaleY(1) - scaleY(0)

  gMap
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

  const defs = mapSvg.append('defs')
  const gradId = 'magneto-grad-' + (props.obsId || 'def')
  defs
    .append('linearGradient')
    .attr('id', gradId)
    .selectAll('stop')
    .data([0, 1])
    .join('stop')
    .attr('offset', (d) => d)
    .attr('stop-color', (d) => interpolateCyanAmber(d))

  mapSvg
    .append('rect')
    .attr('x', legendX)
    .attr('y', legendY)
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('fill', `url(#${gradId})`)

  mapSvg
    .append('text')
    .attr('x', legendX)
    .attr('y', legendY - 2)
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text(formatB(min))

  mapSvg
    .append('text')
    .attr('x', legendX + legendWidth)
    .attr('y', legendY - 2)
    .attr('text-anchor', 'end')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text(formatB(max))

  if (params.dipoleTilt > 0 && max > 1000) {
    mapSvg
      .append('text')
      .attr('x', margin.left + 8)
      .attr('y', margin.top + 14)
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--color-muted)')
      .text(`Incl. dipôle ≈ ${params.dipoleTilt}° · Bmax ${formatB(params.Bmax)}`)
  }

  // ── Profil (coupe horizontale) ──
  d3.select(profileRef.value).selectAll('*').remove()
  const profileSvg = d3
    .select(profileRef.value)
    .attr('width', width)
    .attr('height', profileHeight + margin.bottom)
    .style('background', 'var(--color-bg)')

  const profileInnerWidth = width - margin.left - margin.right
  const xScale = d3.scaleLinear().domain([0, 1]).range([0, profileInnerWidth])
  const yScale = d3
    .scaleLinear()
    .domain([min, max])
    .range([profileHeight - 4, 4])
    .clamp(true)

  const line = d3
    .line()
    .x((d) => margin.left + xScale(d[0]))
    .y((d) => yScale(d[1]))

  profileSvg
    .append('path')
    .datum(profile)
    .attr('fill', 'none')
    .attr('stroke', 'var(--color-cyan)')
    .attr('stroke-width', 1.5)
    .attr('stroke-opacity', 0.9)
    .attr('d', line)

  profileSvg
    .append('g')
    .attr('transform', `translate(${margin.left},${profileHeight})`)
    .call(d3.axisBottom(xScale).ticks(5).tickFormat((v) => `${(v * 100).toFixed(0)} %`).tickSize(4))
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('color', 'var(--color-muted)')

  profileSvg
    .append('text')
    .attr('x', margin.left + profileInnerWidth / 2)
    .attr('y', profileHeight + margin.bottom - 4)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('Profil B (coupe centre)')
}

onMounted(async () => {
  await nextTick()
  render()
  resizeObserver = new ResizeObserver(() => {
    if (magnetoData) render()
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
  <div ref="containerRef" class="lab-magneto">
    <div class="lab-magneto__chart">
      <span class="lab-magneto__label">Carte du champ (intensité)</span>
      <svg ref="mapRef" class="lab-magneto__svg" role="img" aria-label="Carte du champ magnétique" />
    </div>
    <div class="lab-magneto__chart">
      <span class="lab-magneto__label">Profil</span>
      <svg ref="profileRef" class="lab-magneto__svg" role="img" aria-label="Profil magnétique" />
    </div>
  </div>
</template>

<style scoped>
.lab-magneto {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.lab-magneto__chart {
  padding: var(--space-3) 0;
  border-bottom: var(--border-width) solid var(--border-default);
}
.lab-magneto__chart:last-child {
  border-bottom: none;
}
.lab-magneto__label {
  display: block;
  font-size: var(--text-sm);
  color: var(--color-muted);
  margin-bottom: var(--space-2);
}
.lab-magneto__svg {
  display: block;
  width: 100%;
  max-width: 100%;
}
</style>
