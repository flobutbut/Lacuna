<script setup>
/**
 * Rapport de l'Analyseur de neutrinos — chronologie des événements, spectre en énergie (MeV), cône de direction.
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md §4.14 et §5. Aucune conclusion : des comptages et une direction.
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { generateNeutrinoData } from '@/lib/neutrinoData'
import { formatRaDec, formatNumber } from '@/lib/formatUtils'

const props = defineProps({
  obsId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  /** Mesures du signal reprises par l'instrument (event_count, duration_s, mean_energy_mev, direction, uncertainty_deg) */
  attributes: { type: Object, default: () => ({}) },
})

const containerRef = ref(null)
const timeRef = ref(null)
const energyRef = ref(null)
let resizeObserver = null

const margin = { left: 48, right: 8, top: 8, bottom: 28 }
const chartHeight = 150

const data = computed(() =>
  generateNeutrinoData({ obsId: props.obsId, fiability: props.fiability, attributes: props.attributes })
)

/** Cône de direction : centre et rayon (px) dans un carré de 120 px couvrant ±20° */
const CONE_SIZE = 120
const CONE_SPAN_DEG = 20
const coneRadius = computed(() =>
  Math.min(CONE_SIZE / 2 - 4, (data.value.uncertaintyDeg / CONE_SPAN_DEG) * (CONE_SIZE / 2))
)

function drawHistogram(svgEl, bins, { x0, x1, label, width }) {
  const innerWidth = width - margin.left - margin.right
  const innerHeight = chartHeight - margin.top - margin.bottom
  const xDomain = [bins[0][x0], bins[bins.length - 1][x1]]
  const xScale = d3.scaleLinear().domain(xDomain).range([0, innerWidth])
  const maxCount = Math.max(1, ...bins.map((b) => b.count))
  const yScale = d3.scaleLinear().domain([0, maxCount * 1.05]).range([innerHeight, 0])

  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()
  svg.attr('width', width).attr('height', chartHeight)

  svg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .selectAll('rect')
    .data(bins)
    .join('rect')
    .attr('x', (d) => xScale(d[x0]) + 0.5)
    .attr('y', (d) => yScale(d.count))
    .attr('width', (d) => Math.max(1, xScale(d[x1]) - xScale(d[x0]) - 1))
    .attr('height', (d) => innerHeight - yScale(d.count))
    .attr('fill', 'var(--color-cyan)')
    .attr('fill-opacity', 0.7)

  const gX = svg
    .append('g')
    .attr('class', 'lab-neutrinos__axis')
    .attr('transform', `translate(${margin.left},${chartHeight - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(6).tickSize(4))
  gX
    .append('text')
    .attr('x', innerWidth)
    .attr('y', 22)
    .attr('text-anchor', 'end')
    .style('font-size', 'var(--text-2xs)')
    .style('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text(label)

  svg
    .append('g')
    .attr('class', 'lab-neutrinos__axis')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.axisLeft(yScale).ticks(4).tickSize(4).tickFormat(d3.format('~s')))

  svg
    .selectAll('.lab-neutrinos__axis')
    .style('font-size', 'var(--text-2xs)')
    .style('font-family', 'var(--font-mono)')
    .attr('color', 'var(--color-muted)')
}

function render() {
  if (!containerRef.value || !timeRef.value || !energyRef.value) return
  const width = Math.max(260, containerRef.value.clientWidth || 400)
  drawHistogram(timeRef.value, data.value.timeBins, { x0: 't0', x1: 't1', label: 't (s)', width })
  drawHistogram(energyRef.value, data.value.energyBins, { x0: 'e0', x1: 'e1', label: 'Énergie (MeV)', width })
}

onMounted(async () => {
  await nextTick()
  render()
  resizeObserver = new ResizeObserver(() => render())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) resizeObserver.unobserve(containerRef.value)
})

watch(data, () => render(), { deep: true })
</script>

<template>
  <div ref="containerRef" class="lab-neutrinos">
    <div class="lab-neutrinos__label">chronologie des événements</div>
    <svg ref="timeRef" role="img" :aria-label="`Chronologie des événements — fiabilité ${fiability}%`" />
    <div class="lab-neutrinos__label">spectre en énergie</div>
    <svg ref="energyRef" role="img" :aria-label="`Spectre en énergie des neutrinos — fiabilité ${fiability}%`" />

    <div class="lab-neutrinos__summary">
      <div class="sw-row">
        <span class="sw-key">Événements</span>
        <span class="sw-val">{{ formatNumber(data.total) }}</span>
      </div>
      <div class="sw-row">
        <span class="sw-key">Bruit de fond estimé</span>
        <span class="sw-val">{{ formatNumber(data.background) }}</span>
      </div>
      <div class="sw-row">
        <span class="sw-key">Énergie moyenne</span>
        <span class="sw-val">{{ formatNumber(data.meanEnergyMeV, { maximumFractionDigits: 1 }) }} MeV</span>
      </div>
    </div>

    <div class="lab-neutrinos__label">cône de direction</div>
    <div class="lab-neutrinos__cone">
      <svg :width="CONE_SIZE" :height="CONE_SIZE" role="img" aria-label="Cône de direction reconstruit">
        <rect x="0.5" y="0.5" :width="CONE_SIZE - 1" :height="CONE_SIZE - 1" fill="none" stroke="var(--color-muted)" stroke-opacity="0.3" />
        <line :x1="CONE_SIZE / 2" y1="0" :x2="CONE_SIZE / 2" :y2="CONE_SIZE" stroke="var(--color-muted)" stroke-opacity="0.2" />
        <line x1="0" :y1="CONE_SIZE / 2" :x2="CONE_SIZE" :y2="CONE_SIZE / 2" stroke="var(--color-muted)" stroke-opacity="0.2" />
        <circle
          v-if="data.direction"
          :cx="CONE_SIZE / 2"
          :cy="CONE_SIZE / 2"
          :r="coneRadius"
          fill="var(--color-cyan)"
          fill-opacity="0.15"
          stroke="var(--color-cyan)"
        />
      </svg>
      <div class="lab-neutrinos__cone-text">
        <template v-if="data.direction">
          <div class="sw-val">{{ formatRaDec(data.direction.ra, data.direction.dec) }}</div>
          <div class="sw-key">± {{ formatNumber(data.uncertaintyDeg, { maximumFractionDigits: 1 }) }}°</div>
        </template>
        <div v-else class="sw-key">Direction non reconstruite</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lab-neutrinos {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.lab-neutrinos__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-muted);
}

.lab-neutrinos__summary {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin: var(--space-2) 0;
}

.lab-neutrinos__cone {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.lab-neutrinos__cone-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
</style>
