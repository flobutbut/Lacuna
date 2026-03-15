<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { generateAtmosphereData } from '@/lib/atmosphereData'

const props = defineProps({
  obsId: { type: String, default: '' },
  systemId: { type: String, default: '' },
  obsName: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  anomalous: { type: Boolean, default: false },
})

const systemObjectsStore = useSystemObjectsStore()
const containerRef = ref(null)
const svgRef = ref(null)
const errorMsg = ref('')
const atmosphereData = ref(null)
let resizeObserver = null

const margin = { left: 56, right: 40, top: 8, bottom: 24 }
const barHeight = 18
const chartHeight = 220

async function loadAndRender() {
  if (!containerRef.value || !svgRef.value) return
  errorMsg.value = ''

  let body = null
  if (props.systemId && props.obsName) {
    const objects = systemObjectsStore.getForSystem(props.systemId)
    if (objects.length === 0) {
      await systemObjectsStore.fetchForSystem(props.systemId)
    }
    const objs = systemObjectsStore.getForSystem(props.systemId)
    const namePart = props.obsName.split(' · ')[0]?.trim() || ''
    const des = namePart.split(/[\s-]+/).pop()
    body = objs.find((o) => o.designation === des || o.name?.includes(namePart)) || objs.find((o) => o.type === 'PLANET')
  }

  atmosphereData.value = generateAtmosphereData({
    obsId: props.obsId,
    systemId: props.systemId,
    body,
    fiability: props.fiability,
    anomalous: props.anomalous,
  })

  renderChart(atmosphereData.value)
}

function renderChart(data) {
  if (!data?.molecules?.length || !svgRef.value) return

  const width = Math.max(320, containerRef.value?.clientWidth || 400)
  const innerWidth = width - margin.left - margin.right
  const innerHeight = Math.min(chartHeight, data.molecules.length * (barHeight + 4) + margin.top + margin.bottom)

  const xScale = d3.scaleLinear().domain([0, 1]).range([0, innerWidth])
  const yScale = d3.scaleBand()
    .domain(data.molecules.map((m) => m.formula))
    .range([0, data.molecules.length * (barHeight + 4)])
    .padding(0.2)

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  svg.attr('width', width).attr('height', innerHeight).style('background', 'var(--color-bg)')

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  g
    .selectAll('rect')
    .data(data.molecules)
    .join('rect')
    .attr('x', 0)
    .attr('y', (d) => yScale(d.formula))
    .attr('width', (d) => xScale(d.abundance))
    .attr('height', yScale.bandwidth())
    .attr('fill', 'var(--color-cyan)')
    .attr('fill-opacity', 0.7)
    .attr('class', 'lab-atmosphere__bar')

  g
    .selectAll('text.label')
    .data(data.molecules)
    .join('text')
    .attr('class', 'lab-atmosphere__label')
    .attr('x', -6)
    .attr('y', (d) => yScale(d.formula) + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '10px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text((d) => d.formula)

  g
    .selectAll('text.pct')
    .data(data.molecules)
    .join('text')
    .attr('class', 'lab-atmosphere__pct')
    .attr('x', (d) => xScale(d.abundance) + 4)
    .attr('y', (d) => yScale(d.formula) + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text((d) => `${(d.abundance * 100).toFixed(1)} %`)

  svg
    .append('g')
    .attr('transform', `translate(${margin.left},${innerHeight - margin.bottom})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(5)
        .tickFormat((v) => `${(v * 100).toFixed(0)} %`)
        .tickSize(4)
    )
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('color', 'var(--color-muted)')

  svg
    .append('text')
    .attr('x', margin.left + innerWidth)
    .attr('y', innerHeight - 4)
    .attr('text-anchor', 'end')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('Abondance (fraction)')

  if (data.pressureBar != null) {
    svg
      .append('text')
      .attr('x', width - margin.right)
      .attr('y', margin.top + 12)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--color-muted)')
      .text(`p ≈ ${data.pressureBar < 0.01 ? data.pressureBar.toExponential(1) : data.pressureBar.toFixed(2)} bar`)
  }
}

onMounted(async () => {
  await nextTick()
  await loadAndRender()
  resizeObserver = new ResizeObserver(() => {
    if (atmosphereData.value?.molecules?.length) renderChart(atmosphereData.value)
  })
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) resizeObserver.unobserve(containerRef.value)
})

watch(
  () => [props.obsId, props.systemId, props.obsName, props.fiability, props.anomalous],
  () => loadAndRender(),
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="lab-atmosphere">
    <div class="lab-atmosphere__chart">
      <span class="lab-atmosphere__section-label">Profil moléculaire (transmission)</span>
      <svg ref="svgRef" class="lab-atmosphere__svg" role="img" aria-label="Profil atmosphérique" />
    </div>
  </div>
</template>

<style scoped>
.lab-atmosphere {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
.lab-atmosphere__section-label {
  font-size: var(--text-base);
  color: var(--color-muted);
  font-family: var(--font-mono);
}
.lab-atmosphere__svg {
  display: block;
}
</style>
