import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import { SAMPLE_RATE } from '@/lib/spectrogramData'

const NOISE_CONFIG = {
  P: { base: 0.8, galacticFactor: 0.30 },
  L: { base: 0.5, galacticFactor: 0.15 },
  X: { base: 0.2, galacticFactor: 0.05 },
  G: { base: 0.05, galacticFactor: 0.00 },
}

const AR_ALPHA = {
  P: 0.88,
  L: 0.7,
  X: 0.45,
  G: 0.1,
}

const F_H = 12.5

/**
 * LCG 32 bits, état initial dérivé de seed + totalOffset (déterministe).
 */
function createLcg(seed, totalOffset) {
  const lo = totalOffset >>> 0
  const hi = (totalOffset / 0x100000000) | 0
  let state = (seed ^ Math.imul(lo, 0x9e3779b1) ^ hi) >>> 0
  if (state === 0) state = 0x6a09e667
  return function nextU() {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0
    return state / 4294967296
  }
}

function nextGaussian(rng) {
  let u1 = 0
  while (u1 <= Number.EPSILON) u1 = rng()
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

export function useRadarNoise(band, galacticLatitude, activeSignals) {
  const ui = useUIStore()
  const { radarNoiseEnabled } = storeToRefs(ui)

  const noiseLevel = computed(() => {
    const config = NOISE_CONFIG[band.value] ?? NOISE_CONFIG['L']
    const latRad = (galacticLatitude.value ?? 0) * Math.PI / 180
    return config.base + config.galacticFactor * Math.cos(latRad)
  })

  let arState = 0

  watch(
    () => band.value,
    () => {
      arState = 0
    }
  )

  watch(radarNoiseEnabled, () => {
    arState = 0
  })

  function getNoiseSample(sampleCount, seed, totalOffset) {
    if (radarNoiseEnabled.value === false) {
      return new Float32Array(sampleCount)
    }

    const level = noiseLevel.value
    const amplitude = 60000 * level
    const chunk = new Float32Array(sampleCount)

    const rng = createLcg(seed, totalOffset)
    const α = AR_ALPHA[band.value] ?? AR_ALPHA.L
    const thermalStd = amplitude * 0.3
    const syncWhiteStd = amplitude * 0.7
    const twoPi = 2 * Math.PI

    for (let i = 0; i < sampleCount; i++) {
      const therm = nextGaussian(rng) * thermalStd
      const whiteSync = nextGaussian(rng) * syncWhiteStd
      arState = α * arState + (1 - α) * whiteSync

      let v = therm + arState
      if (band.value === 'L') {
        v += amplitude * 0.08 * Math.sin((twoPi * F_H * (totalOffset + i)) / SAMPLE_RATE)
      }

      chunk[i] = Math.max(-1, Math.min(1, v / amplitude))
    }

    return chunk
  }

  return { noiseLevel, getNoiseSample }
}
