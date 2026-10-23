<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import {
  generateSpectrogramData,
  computeSpectrogramMatrix,
  seedFromObsId,
  SAMPLE_RATE,
} from '@/lib/spectrogramData'

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
/** Largeur du dernier dessin : le ResizeObserver ne redessine que si elle change */
let lastWidth = 0
let resizeFrame = null

/**
 * Spectrogramme calculé (signal + transformées de Fourier), gardé tant que les données ne changent pas :
 * un redimensionnement ne fait que redessiner.
 */
let cache = { key: '', spec: null }

function getSpectrogram() {
  const key = [props.obsId, props.fiability, props.durationSec, props.anomalous, props.structure].join('|')
  if (cache.key === key) return cache.spec
  const seed = seedFromObsId(props.obsId)
  const noiseLevel = Math.max(0.05, 0.35 - (props.fiability / 100) * 0.3)
  const rawData = generateSpectrogramData({
    durationSec: props.durationSec,
    freqHz: 10 + (seed % 8),
    seed,
    noiseLevel,
    anomalous: props.anomalous,
    structure: props.structure,
  })
  const spec = rawData.length < 256
    ? null
    : computeSpectrogramMatrix(rawData, SAMPLE_RATE, props.durationSec, {
        anomalous: props.anomalous,
        timeSteps: 480,
        freqBins: 96,
      })
  cache = { key, spec }
  return spec
}

/**
 * Grille du spectrogramme en image (un pixel par case, colonnes = temps, lignes = fréquence décroissante),
 * au lieu d'un rectangle SVG par case : 46 080 éléments bloquaient l'interface au rendu.
 */
function heatmapDataUrl(spec, colorScale) {
  const { cells, timeSteps, freqBins } = spec
  const canvas = document.createElement('canvas')
  canvas.width = timeSteps
  canvas.height = freqBins
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(timeSteps, freqBins)
  for (let col = 0; col < timeSteps; col++) {
    for (let row = 0; row < freqBins; row++) {
      const { r, g, b } = d3.rgb(colorScale(cells[col * freqBins + row].value))
      const i = (row * timeSteps + col) * 4
      image.data[i] = r
      image.data[i + 1] = g
      image.data[i + 2] = b
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas.toDataURL()
}

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

  lastWidth = width
  const innerWidth = width - margin.left - margin.right
  const innerHeight = chartHeight - margin.top - margin.bottom

  const spec = getSpectrogram()

  if (!spec || spec.cells.length === 0) {
    errorMsg.value = 'Erreur de calcul du spectrogramme.'
    return
  }

  const { tDomain, fDomain } = spec

  const xScale = d3.scaleLinear().domain(tDomain).range([0, innerWidth])
  const yScale = d3.scaleLinear().domain(fDomain).range([innerHeight, 0])
  const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 1])

  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  svg.attr('width', width).attr('height', chartHeight)

  const axisBottom = svg
    .append('g')
    .attr('class', 'lab-spectrogram__axis lab-spectrogram__axis--x')
    .attr('transform', `translate(${margin.left},${chartHeight - margin.bottom})`)
    .call(d3.axisBottom(xScale).ticks(6).tickSize(4))
  axisBottom
    .append('text')
    .attr('x', innerWidth)
    .attr('y', 18)
    .attr('text-anchor', 'end')
    .style('font-size', 'var(--text-2xs)')
    .style('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('Temps (s)')

  const axisLeft = svg
    .append('g')
    .attr('class', 'lab-spectrogram__axis lab-spectrogram__axis--y')
    .attr('transform', `translate(${margin.left},${margin.top})`)
    .call(d3.axisLeft(yScale).ticks(5).tickSize(4))
  axisLeft
    .append('text')
    .attr('x', -8)
    .attr('y', 0)
    .attr('text-anchor', 'end')
    .style('font-size', 'var(--text-2xs)')
    .style('font-family', 'var(--font-mono)')
    .attr('fill', 'var(--color-muted)')
    .text('Fréq. (Hz)')

  svg
    .selectAll('.lab-spectrogram__axis')
    .style('font-size', 'var(--text-2xs)')
    .style('font-family', 'var(--font-mono)')
    .attr('color', 'var(--color-muted)')

  const heatmapWrap = svg
    .append('g')
    .attr('class', 'lab-spectrogram__heatmap-wrap')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  heatmapWrap
    .append('image')
    .attr('href', heatmapDataUrl(spec, colorScale))
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('preserveAspectRatio', 'none')
    .style('image-rendering', 'pixelated')
    .attr('class', 'lab-spectrogram__heatmap')
}

/** Redessine au plus une fois par image, et seulement si la largeur a changé */
function onResize() {
  if (resizeFrame) return
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null
    const width = Math.max(280, containerRef.value?.clientWidth || 400)
    if (width !== lastWidth) render()
  })
}

onMounted(async () => {
  await nextTick()
  await new Promise((r) => setTimeout(r, 50))
  render()
  resizeObserver = new ResizeObserver(onResize)
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
  if (resizeFrame) cancelAnimationFrame(resizeFrame)
})

watch(
  () => [props.obsId, props.fiability, props.durationSec, props.anomalous, props.structure],
  () => render(),
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="lab-spectrogram">
    <svg
      v-show="!errorMsg"
      ref="svgRef"
      class="lab-spectrogram__svg"
      role="img"
      :aria-label="`Spectrogramme — ${props.durationSec}s, fiabilité ${props.fiability}%`"
    />
    <div v-if="errorMsg" class="lab-spectrogram__error">{{ errorMsg }}</div>
  </div>
</template>
