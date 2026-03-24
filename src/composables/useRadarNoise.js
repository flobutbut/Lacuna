import { computed } from 'vue'

const NOISE_CONFIG = {
  P: { base: 0.8, galacticFactor: 0.30 },
  L: { base: 0.5, galacticFactor: 0.15 },
  X: { base: 0.2, galacticFactor: 0.05 },
  G: { base: 0.05, galacticFactor: 0.00 },
}

export function useRadarNoise(band, galacticLatitude, activeSignals) {
  const noiseLevel = computed(() => {
    const config = NOISE_CONFIG[band.value] ?? NOISE_CONFIG['L']
    const latRad = (galacticLatitude.value ?? 0) * Math.PI / 180
    return config.base + config.galacticFactor * Math.cos(latRad)
  })

  function getNoiseSample(sampleCount, seed, totalOffset) {
    const level = noiseLevel.value
    const amplitude = 60000 * level
    const chunk = new Float32Array(sampleCount)

    // BRUIT DÉSACTIVÉ TEMPORAIREMENT
    // chunk rempli de zéros — seuls les signaux
    // injectés dans appendColumnFromSnapshot seront visibles

    return chunk
  }

  return { noiseLevel, getNoiseSample }
}
