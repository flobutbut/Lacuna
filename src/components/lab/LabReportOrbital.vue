<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { generateOrbitalData } from '@/lib/orbitalData'

const props = defineProps({
  obsId: { type: String, default: '' },
  systemId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  anomalous: { type: Boolean, default: false },
})

const systemObjectsStore = useSystemObjectsStore()
const containerRef = ref(null)
const svgRef = ref(null)
const errorMsg = ref('')
let resizeObserver = null

const chartSize = 340
const margin = { left: 8, right: 8, top: 8, bottom: 8 }

const orbitalData = ref(null)

async function loadAndRender() {
  if (!containerRef.value || !svgRef.value) return
  errorMsg.value = ''

  let systemObjects = []
  if (props.systemId) {
    const cached = systemObjectsStore.getForSystem(props.systemId)
    if (cached.length > 0) {
      systemObjects = cached
    } else {
      systemObjects = await systemObjectsStore.fetchForSystem(props.systemId)
    }
  }

  orbitalData.value = generateOrbitalData({
    obsId: props.obsId,
    systemId: props.systemId,
    systemObjects,
    fiability: props.fiability,
    anomalous: props.anomalous,
  })

  renderDiagram()
}

function renderDiagram() {
  const data = orbitalData.value
  if (!data?.orbits?.length || !svgRef.value) return

  const width = Math.max(360, containerRef.value?.clientWidth || 400)
  const size = Math.min(chartSize, width - margin.left - margin.right)
  const cx = margin.left + size / 2
  const cy = margin.top + size / 2

  const maxA = Math.max(...data.orbits.map((o) => o.a))
  const scaleR = d3.scaleSqrt().domain([0, maxA]).range([0, size / 2 - 12])

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  svg
    .attr('width', width)
    .attr('height', size + margin.top + margin.bottom)
    .style('background', 'var(--color-bg)')

  const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

  data.orbits.forEach((orbit) => {
    const scale = scaleR(orbit.a) / (orbit.a || 1)
    const pts = orbit.path.map(([x, y]) => `${x * scale},${-y * scale}`)
    const path = pts.length ? `M ${pts[0]} L ${pts.slice(1).join(' L ')}` : ''
    if (!path) return
    g
      .append('path')
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', orbit.inHz ? 'var(--color-cyan)' : 'var(--color-muted)')
      .attr('stroke-opacity', orbit.inHz ? 0.9 : 0.5)
      .attr('stroke-width', 1)
  })

  g
    .append('circle')
    .attr('r', 4)
    .attr('fill', 'var(--color-amber)')
    .attr('stroke', 'var(--color-amber)')
    .attr('stroke-opacity', 0.6)

  data.orbits.forEach((orbit) => {
    const E = orbit.phase ?? 0
    const scale = scaleR(orbit.a) / (orbit.a || 1)
    const px = (orbit.a * (Math.cos(E) - orbit.e)) * scale
    const py = orbit.a * Math.sqrt(Math.max(0, 1 - orbit.e * orbit.e)) * Math.sin(E) * scale
    g
      .append('circle')
      .attr('cx', px)
      .attr('cy', -py)
      .attr('r', 3)
      .attr('fill', 'var(--color-cyan)')
      .attr('stroke', 'var(--color-white)')
      .attr('stroke-width', 0.5)
    const lx = px + 8
    const ly = -py + 12
    g
      .append('text')
      .attr('x', lx)
      .attr('y', ly)
      .attr('text-anchor', 'start')
      .style('font-size', 'var(--text-2xs)')
      .style('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--color-muted)')
      .text(orbit.label)
  })

  if (data.residualAcceleration != null) {
    svg
      .append('text')
      .attr('x', width - margin.right)
      .attr('y', margin.top + 12)
      .attr('text-anchor', 'end')
      .style('font-size', 'var(--text-2xs)')
      .style('font-family', 'var(--font-mono)')
      .attr('fill', 'var(--color-amber)')
      .text(`Δa ≈ ${data.residualAcceleration.toExponential(1)} m/s²`)
  }
}

onMounted(async () => {
  await nextTick()
  await loadAndRender()
  resizeObserver = new ResizeObserver(() => renderDiagram())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) resizeObserver.unobserve(containerRef.value)
})

watch(
  () => [props.obsId, props.systemId, props.fiability, props.anomalous],
  () => loadAndRender(),
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="lab-orbital">
    <div class="lab-orbital__diagram">
      <span class="lab-orbital__label">Diagramme orbital (plan)</span>
      <svg ref="svgRef" class="lab-orbital__svg" role="img" aria-label="Diagramme des orbites" />
    </div>
    <div v-if="orbitalData?.orbits?.length" class="lab-orbital__table-wrap">
      <span class="lab-orbital__label">Paramètres orbitaux</span>
      <table class="lab-orbital__table">
        <thead>
          <tr>
            <th>Corps</th>
            <th>a (UA)</th>
            <th>e</th>
            <th>i (°)</th>
            <th>P (j)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orbitalData.orbits" :key="o.label">
            <td>{{ o.label }}</td>
            <td>{{ o.a.toFixed(3) }}</td>
            <td>{{ o.e.toFixed(3) }}</td>
            <td>{{ o.i.toFixed(1) }}</td>
            <td>{{ o.period != null ? o.period.toFixed(0) : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="orbitalData?.resonances?.length" class="lab-orbital__resonances">
      <span class="lab-orbital__label">Résonances détectées</span>
      <ul class="lab-orbital__res-list">
        <li v-for="(r, i) in orbitalData.resonances" :key="i">
          {{ r.inner }}–{{ r.outer }} : {{ r.ratio }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.lab-orbital {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.lab-orbital__diagram,
.lab-orbital__table-wrap,
.lab-orbital__resonances {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.lab-orbital__label {
  font-size: var(--text-base);
  color: var(--color-muted);
  font-family: var(--font-mono);
}
.lab-orbital__svg {
  display: block;
}
.lab-orbital__table {
  font-size: var(--text-base);
  font-family: var(--font-mono);
  border-collapse: collapse;
  color: var(--color-muted);
}
.lab-orbital__table th,
.lab-orbital__table td {
  padding: var(--space-1) var(--space-2);
  text-align: left;
  border-bottom: 1px solid var(--color-muted);
  border-color: var(--color-ghost);
}
.lab-orbital__table th {
  color: var(--color-white);
}
.lab-orbital__res-list {
  margin: 0;
  padding-left: var(--space-4);
  font-size: var(--text-base);
  font-family: var(--font-mono);
  color: var(--color-amber);
}
</style>
