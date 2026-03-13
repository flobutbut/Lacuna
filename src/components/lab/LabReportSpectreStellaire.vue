<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { generateSpectreData, generateLightCurveData } from '@/lib/spectreStellaireData'

const props = defineProps({
  obsId: { type: String, default: '' },
  systemId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  anomalous: { type: Boolean, default: false },
})

const stellarStore = useStellarSystemsStore()

const spectralType = computed(() => {
  const sys = stellarStore.list.find((s) => s.id === props.systemId)
  return sys?.spectral_type ?? 'G2V'
})

const containerRef = ref(null)
const spectrumRef = ref(null)
const lightCurveRef = ref(null)
const errorMsg = ref('')
let resizeObserver = null

const chartHeight = 140
const margin = { left: 42, right: 8, top: 8, bottom: 24 }

function render() {
  if (!containerRef.value || !spectrumRef.value || !lightCurveRef.value) return
  errorMsg.value = ''

  const width = Math.max(280, containerRef.value.clientWidth || 400)
  if (width < 100) {
    errorMsg.value = 'Espace insuffisant.'
    return
  }

  const innerWidth = width - margin.left - margin.right
  const innerHeight = chartHeight - margin.top - margin.bottom

  const opts = {
    obsId: props.obsId,
    fiability: props.fiability,
    anomalous: props.anomalous,
    spectralType: spectralType.value,
  }

  const { points: spectrumPoints, domain: spectrumDomain } = generateSpectreData(opts)
  const { points: lightPoints, domain: lightDomain } = generateLightCurveData(opts)

  const xSpectrum = d3.scaleLinear().domain(spectrumDomain).range([0, innerWidth])
  const ySpectrum = d3.scaleLinear().domain([0, 1.1]).range([innerHeight, 0])
  const xLight = d3.scaleLinear().domain(lightDomain).range([0, innerWidth])
  const yLight = d3.scaleLinear().domain([0.9, 1.05]).range([innerHeight, 0])

  const lineSpectrum = d3.line().x((d) => xSpectrum(d.wavelength)).y((d) => ySpectrum(d.intensity))
  const lineLight = d3.line().x((d) => xLight(d.day)).y((d) => yLight(d.flux))

  const spectrumSvg = d3.select(spectrumRef.value)
  spectrumSvg.selectAll('*').remove()
  spectrumSvg.attr('width', width).attr('height', chartHeight)

  const gSpec = spectrumSvg
    .append('g')
    .attr('class', 'lab-spectre-stellaire__chart')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  gSpec
    .append('path')
    .attr('d', lineSpectrum(spectrumPoints))
    .attr('fill', 'none')
    .attr('stroke', 'var(--color-cyan)')
    .attr('stroke-width', 2)
    .attr('stroke-opacity', 0.9)

  const gSpecX = spectrumSvg
    .append('g')
    .attr('class', 'lab-spectre-stellaire__axis')
    .attr('transform', `translate(${margin.left},${chartHeight - margin.bottom})`)
    .call(
      d3
        .axisBottom(xSpectrum)
        .ticks(6)
        .tickSize(4)
        .tickFormat((v) => `${v}`)
    )
  gSpecX
    .append('text')
    .attr('x', innerWidth)
    .attr('y', 18)
    .attr('text-anchor', 'end')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('λ (nm)')

  spectrumSvg
    .append('g')
    .attr('class', 'lab-spectre-stellaire__axis')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.axisLeft(ySpectrum).ticks(4).tickSize(4))

  const lightCurveSvg = d3.select(lightCurveRef.value)
  lightCurveSvg.selectAll('*').remove()
  lightCurveSvg.attr('width', width).attr('height', chartHeight)

  const gLight = lightCurveSvg
    .append('g')
    .attr('class', 'lab-spectre-stellaire__chart')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  gLight
    .append('path')
    .attr('d', lineLight(lightPoints))
    .attr('fill', 'none')
    .attr('stroke', 'var(--color-cyan)')
    .attr('stroke-width', 2)
    .attr('stroke-opacity', 0.9)

  const gLightX = lightCurveSvg
    .append('g')
    .attr('class', 'lab-spectre-stellaire__axis')
    .attr('transform', `translate(${margin.left},${chartHeight - margin.bottom})`)
    .call(
      d3
        .axisBottom(xLight)
        .ticks(6)
        .tickSize(4)
    )
  gLightX
    .append('text')
    .attr('x', innerWidth)
    .attr('y', 18)
    .attr('text-anchor', 'end')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('Temps (jours)')

  lightCurveSvg
    .append('g')
    .attr('class', 'lab-spectre-stellaire__axis')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.axisLeft(yLight).ticks(4).tickSize(4))

  lightCurveSvg
    .selectAll('.lab-spectre-stellaire__axis')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
    .attr('color', 'var(--color-muted)')

  spectrumSvg
    .selectAll('.lab-spectre-stellaire__axis')
    .attr('font-size', '9px')
    .attr('font-family', 'var(--font-mono)')
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
  if (resizeObserver && containerRef.value) resizeObserver.unobserve(containerRef.value)
})

watch(
  () => [props.obsId, props.systemId, props.fiability, props.anomalous, spectralType.value],
  () => render(),
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="lab-spectre-stellaire">
    <div v-if="!errorMsg" class="lab-spectre-stellaire__section">
      <div class="lab-spectre-stellaire__label">Spectre (intensité × λ)</div>
      <svg
        ref="spectrumRef"
        class="lab-spectre-stellaire__svg"
        role="img"
        :aria-label="`Spectre stellaire — ${spectralType}`"
      />
    </div>
    <div v-if="!errorMsg" class="lab-spectre-stellaire__section">
      <div class="lab-spectre-stellaire__label">Courbe de lumière (flux × temps)</div>
      <svg
        ref="lightCurveRef"
        class="lab-spectre-stellaire__svg"
        role="img"
        :aria-label="`Courbe de lumière — fiabilité ${props.fiability}%`"
      />
    </div>
    <div v-if="errorMsg" class="lab-spectre-stellaire__error">{{ errorMsg }}</div>
  </div>
</template>

<style scoped>
.lab-spectre-stellaire {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.lab-spectre-stellaire__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.lab-spectre-stellaire__label {
  font-size: var(--text-xs);
  color: var(--color-muted);
  font-family: var(--font-mono);
}
.lab-spectre-stellaire__svg {
  display: block;
}
.lab-spectre-stellaire__error {
  color: var(--color-muted);
  font-size: var(--text-sm);
}
</style>
