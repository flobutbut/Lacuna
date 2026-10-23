<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { generatePolarisationData } from '@/lib/polarisationData'

const props = defineProps({
  obsId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  anomalous: { type: Boolean, default: false },
  /** Polarisation mesurée du signal (ex. « circulaire gauche »), vide si inconnue */
  polarization: { type: String, default: '' },
})

const containerRef = ref(null)
const svgRef = ref(null)
const stokesRef = ref(null)
let resizeObserver = null

const SIZE = 220

function render() {
  if (!containerRef.value || !svgRef.value) return
  const width = Math.max(180, Math.min(SIZE, containerRef.value.clientWidth - 2))
  const r = (width - 40) / 2
  const cx = width / 2
  const cy = width / 2

  const data = generatePolarisationData({
    obsId: props.obsId,
    fiability: props.fiability,
    anomalous: props.anomalous,
    polarization: props.polarization,
  })
  const { angle, ellipticity, degree, stokes } = data

  const a = r * 0.85 * degree
  const b = a * Math.min(1, Math.abs(ellipticity))
  const svgRotation = -(angle * 180) / Math.PI

  let svg = `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--color-muted)" stroke-opacity="0.3" stroke-width="1"/>
    <line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}" stroke="var(--color-muted)" stroke-opacity="0.2" stroke-width="0.5"/>
    <line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="var(--color-muted)" stroke-opacity="0.2" stroke-width="0.5"/>
  `

  if (b < 0.5) {
    const dx = a * Math.cos(angle)
    const dy = a * Math.sin(angle)
    const path = `M ${cx - dx} ${cy + dy} L ${cx + dx} ${cy - dy}`
    svg += `<path d="${path}" fill="none" stroke="var(--color-cyan)" stroke-width="2" stroke-linecap="round"/>`
  } else {
    const rotate = `rotate(${svgRotation} ${cx} ${cy})`
    svg += `<ellipse cx="${cx}" cy="${cy}" rx="${a}" ry="${b}" transform="${rotate}" fill="none" stroke="var(--color-cyan)" stroke-width="1.5"/>`
  }

  svgRef.value.innerHTML = svg
  svgRef.value.setAttribute('width', width)
  svgRef.value.setAttribute('height', width)

  if (stokesRef.value) {
    stokesRef.value.innerHTML = `I ${stokes.I.toFixed(2)}  Q ${stokes.Q.toFixed(2)}  U ${stokes.U.toFixed(2)}  V ${stokes.V.toFixed(2)}`
  }
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
  () => [props.obsId, props.fiability, props.anomalous, props.polarization],
  () => render(),
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="lab-polarisation">
    <svg ref="svgRef" class="lab-polarisation__svg" role="img" :aria-label="`Diagramme de polarisation — fiabilité ${fiability}%`" />
    <div ref="stokesRef" class="lab-polarisation__stokes" />
  </div>
</template>
