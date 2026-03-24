/**
 * Composable pour le spectrogramme Radar.
 * Tourne en permanence dès le montage de PageObservatoire.
 * Buffer circulaire, tickCount seul signal réactif.
 */
import { ref, computed } from 'vue'
import { SAMPLE_RATE } from '@/lib/spectrogramData'

const CHUNK_MS = 100
const WINDOW_SIZE = 256
const HISTORY_SIZE = 7200
const BUFFER_SIZE = WINDOW_SIZE * HISTORY_SIZE

function seededRandom(s) {
  return function () {
    let t = (s += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function useRadarSpectrogram() {
  const startTimeMs = ref(0)
  const tickCount = ref(0)

  const buffer = new Float32Array(BUFFER_SIZE)
  let writeHead = 0
  let totalSamplesWritten = 0
  let seed = 42
  let tickInterval = null

  function generateChunk(durationMs) {
    const samples = Math.floor((durationMs / 1000) * SAMPLE_RATE)
    const rng = seededRandom(seed)
    const amplitude = 60000
    const freqHz = 10 + (seed % 8)
    const twoPi = 2 * Math.PI
    const chunk = []
    const base = totalSamplesWritten
    for (let i = 0; i < samples; i++) {
      const tSec = (base + i) / SAMPLE_RATE
      const tone = amplitude * Math.sin(twoPi * freqHz * tSec)
      const noise = (rng() - 0.5) * 2 * amplitude * 0.12
      chunk.push(Math.round(tone + noise))
    }
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return chunk
  }

  function writeToBuffer(amplitudes) {
    for (let i = 0; i < amplitudes.length; i++) {
      buffer[writeHead] = amplitudes[i]
      writeHead = (writeHead + 1) % BUFFER_SIZE
      totalSamplesWritten += 1
    }
  }

  function tick() {
    const now = Date.now()
    const elapsed = now - startTimeMs.value
    const targetSamples = Math.floor((elapsed / 1000) * SAMPLE_RATE)
    if (targetSamples > totalSamplesWritten) {
      const toAdd = Math.min(
        targetSamples - totalSamplesWritten,
        SAMPLE_RATE * (CHUNK_MS / 1000) * 2
      )
      const chunk = generateChunk((toAdd / SAMPLE_RATE) * 1000)
      writeToBuffer(chunk)
    }
    tickCount.value += 1
  }

  function start() {
    startTimeMs.value = Date.now()
    tickInterval = setInterval(tick, CHUNK_MS)
  }

  function stop() {
    if (tickInterval) {
      clearInterval(tickInterval)
      tickInterval = null
    }
  }

  function getBufferSnapshot(n) {
    const count = Math.min(n, totalSamplesWritten)
    if (count <= 0) return []
    const result = new Array(count)
    const startConceptual = totalSamplesWritten - count
    for (let i = 0; i < count; i++) {
      const bufIdx = (startConceptual + i) % BUFFER_SIZE
      result[i] = buffer[bufIdx]
    }
    return result
  }

  const durationSec = computed(() => totalSamplesWritten / SAMPLE_RATE)
  const nyquist = SAMPLE_RATE / 2
  const spectrogramSpec = computed(() =>
    totalSamplesWritten >= WINDOW_SIZE
      ? { fDomain: [0, nyquist] }
      : null
  )

  function contentWidthPx(containerWidth = 800) {
    return Math.max(containerWidth, tickCount.value)
  }

  return {
    tickCount,
    getBufferSnapshot,
    start,
    stop,
    durationSec,
    spectrogramSpec,
    contentWidthPx,
    totalSamplesWritten: () => totalSamplesWritten,
    WINDOW_SIZE,
    HISTORY_SIZE,
    BUFFER_SIZE,
  }
}
