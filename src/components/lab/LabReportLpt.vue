<script setup>
/**
 * Rapport sur un train d'impulsions longues et espacées (LPT-001) — LACUNA_LABORATOIRE_INSTRUMENTS.md §4.2.
 * Mode « temporel » : impulsions sur un axe des temps (largeur = durée, hauteur = intensité, échelle log),
 * période mesurée à partir de deux impulsions. Mode « polarisation » : degré linéaire et circulaire de chaque impulsion.
 * Aucune conclusion : des mesures.
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { parseLpt, lptPulses, lptMeasuredPeriod } from '@/lib/lpt'
import { formatNumber } from '@/lib/formatUtils'

const props = defineProps({
  /** Phase du signal et heure de l'envoi au Laboratoire (attributes.lpt de l'observation) */
  lpt: { type: Object, default: null },
  mode: { type: String, default: 'temporel' },
})

const containerRef = ref(null)
const svgRef = ref(null)
let resizeObserver = null

const margin = { left: 42, right: 8, top: 8, bottom: 28 }
const chartHeight = 150

const pulses = computed(() => {
  const lpt = parseLpt(props.lpt)
  const until = Date.parse(props.lpt?.until)
  return lpt ? lptPulses(lpt, Number.isFinite(until) ? until : Date.now()) : []
})
const period = computed(() => lptMeasuredPeriod(pulses.value))
/** Instant de chaque impulsion depuis la première (min) */
const t0 = computed(() => pulses.value[0]?.startMs ?? 0)
const minutesOf = (p) => (p.startMs - t0.value) / 60000

function render() {
  if (props.mode !== 'temporel' || !containerRef.value || !svgRef.value || !pulses.value.length) return
  const width = Math.max(200, containerRef.value.clientWidth - 2)
  const innerWidth = width - margin.left - margin.right
  const innerHeight = chartHeight - margin.top - margin.bottom
  const last = pulses.value[pulses.value.length - 1]
  const spanMin = Math.max(25, minutesOf(last) + last.durationS / 60 + 2)
  const x = d3.scaleLinear().domain([-1, spanMin]).range([0, innerWidth])
  const y = d3.scaleLog().domain([0.5, 150]).range([innerHeight, 0])

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  svg.attr('width', width).attr('height', chartHeight)
  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
  g.selectAll('rect')
    .data(pulses.value)
    .join('rect')
    .attr('x', (p) => x(minutesOf(p)))
    .attr('y', (p) => y(p.intensity))
    .attr('width', (p) => Math.max(1.5, x(minutesOf(p) + p.durationS / 60) - x(minutesOf(p))))
    .attr('height', (p) => innerHeight - y(p.intensity))
    .attr('fill', 'var(--color-cyan)')
    .attr('fill-opacity', 0.75)

  const axis = (sel) => sel.attr('class', 'lab-lpt__axis')
  const gX = svg
    .append('g')
    .call(axis)
    .attr('transform', `translate(${margin.left},${chartHeight - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(6).tickSize(4))
  gX.append('text')
    .attr('x', innerWidth)
    .attr('y', 22)
    .attr('text-anchor', 'end')
    .attr('fill', 'var(--color-muted)')
    .text('t (min)')
  svg
    .append('g')
    .call(axis)
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.axisLeft(y).tickValues([1, 10, 100]).tickFormat(d3.format('d')).tickSize(4))
    .append('text')
    .attr('x', -margin.left + 2)
    .attr('y', -1)
    .attr('text-anchor', 'start')
    .attr('fill', 'var(--color-muted)')
    .text('intensité')
}

onMounted(async () => {
  await nextTick()
  render()
  resizeObserver = new ResizeObserver(() => render())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => resizeObserver?.disconnect())

watch(() => [props.lpt, props.mode], () => render(), { deep: true })
</script>

<template>
  <div ref="containerRef" class="lab-lpt">
    <template v-if="mode === 'temporel'">
      <span class="lab-lpt__label">train d'impulsions</span>
      <svg ref="svgRef" class="lab-lpt__svg" />
      <div class="sw-row">
        <span class="sw-key">Impulsions</span>
        <span class="sw-val">{{ pulses.length }}</span>
      </div>
      <div class="sw-row">
        <span class="sw-key">Période</span>
        <span class="sw-val">
          {{ period ? `${formatNumber(Math.round(period.periodS * 10) / 10)} ± ${formatNumber(Math.round(period.uncertaintyS * 10) / 10)} s` : '—' }}
        </span>
      </div>
    </template>
    <table class="lab-lpt__table">
      <thead>
        <tr>
          <th>n°</th>
          <th>t (min)</th>
          <template v-if="mode === 'temporel'">
            <th>durée (s)</th>
            <th>intensité</th>
          </template>
          <template v-else>
            <th>linéaire</th>
            <th>circulaire</th>
          </template>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, i) in pulses" :key="p.k">
          <td>{{ i + 1 }}</td>
          <td>{{ formatNumber(Math.round(minutesOf(p) * 10) / 10) }}</td>
          <template v-if="mode === 'temporel'">
            <td>{{ p.durationS }}</td>
            <td>{{ formatNumber(p.intensity) }}</td>
          </template>
          <template v-else>
            <td>{{ p.linearPct }} %</td>
            <td>{{ p.circularPct > 0 ? '+' : '' }}{{ formatNumber(p.circularPct) }} %</td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.lab-lpt {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lab-lpt__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.lab-lpt__svg {
  display: block;
  overflow: visible;
}

.lab-lpt__svg :deep(.lab-lpt__axis text) {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  fill: var(--color-muted);
}

.lab-lpt__svg :deep(.lab-lpt__axis line),
.lab-lpt__svg :deep(.lab-lpt__axis path) {
  stroke: var(--color-muted);
  stroke-opacity: 0.4;
}

.lab-lpt__table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
}

.lab-lpt__table th {
  color: var(--color-muted);
  font-weight: normal;
  text-align: right;
  padding: 2px 6px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-muted) 30%, transparent);
}

.lab-lpt__table td {
  text-align: right;
  padding: 2px 6px;
  color: var(--color-white);
}
</style>
