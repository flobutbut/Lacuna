<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Spectrogram } from 'spectrogram-js'
import { generateSpectrogramData, seedFromObsId, SAMPLE_RATE } from '@/lib/spectrogramData'

const props = defineProps({
  obsId: { type: String, default: '' },
  fiability: { type: Number, default: 80 },
  durationSec: { type: Number, default: 72 },
})

const canvasRef = ref(null)
const containerRef = ref(null)
let spectrogram = null
let resizeObserver = null

async function doRender() {
  if (!canvasRef.value || !containerRef.value) return
  const width = containerRef.value.clientWidth
  if (width < 50) return

  if (spectrogram) {
    spectrogram.destroy()
    spectrogram = null
  }

  const height = 200
  const windowSize = 512
  const overlap = Math.floor(windowSize * 0.75)

  spectrogram = new Spectrogram({
    sampleRate: SAMPLE_RATE,
    windowSize,
    overlap,
    windowType: 'hann',
    minDb: -60,
    maxDb: 0,
  })

  const seed = seedFromObsId(props.obsId)
  const noiseLevel = Math.max(0.05, 0.35 - (props.fiability / 100) * 0.3)
  const data = generateSpectrogramData({
    durationSec: props.durationSec,
    freqHz: 10 + (seed % 8),
    seed,
    noiseLevel,
  })

  spectrogram.setData(data)
  spectrogram.setColormap('viridis')
  await spectrogram.init()

  spectrogram.render({
    canvas: canvasRef.value,
    width,
    height,
    timeRange: [0, props.durationSec],
    freqRange: [0, SAMPLE_RATE / 2],
  })
}

onMounted(async () => {
  await nextTick()
  await doRender()
  resizeObserver = new ResizeObserver(() => doRender())
  if (containerRef.value) resizeObserver.observe(containerRef.value)
})

onUnmounted(() => {
  if (resizeObserver && containerRef.value) {
    resizeObserver.unobserve(containerRef.value)
  }
  if (spectrogram) {
    spectrogram.destroy()
    spectrogram = null
  }
})

watch(
  () => [props.obsId, props.fiability, props.durationSec],
  () => doRender(),
  { deep: true }
)
</script>

<template>
  <div ref="containerRef" class="lab-spectrogram">
    <canvas
      ref="canvasRef"
      class="lab-spectrogram__canvas"
      width="400"
      height="200"
      role="img"
      :aria-label="`Spectrogramme — ${durationSec}s, fiabilité ${fiability}%`"
    />
  </div>
</template>
