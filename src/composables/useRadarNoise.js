import { computed } from 'vue'

const NOISE_CONFIG = {
  P: { base: 0.8, galacticFactor: 0.30 },
  L: { base: 0.5, galacticFactor: 0.15 },
  X: { base: 0.2, galacticFactor: 0.05 },
  G: { base: 0.05, galacticFactor: 0.00 },
}

const H1_DIFFUSE_BIN = 10
const H1_DIFFUSE_AMPLITUDE = 0.02
const SAMPLE_RATE = 250

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

    let rng = seed
    for (let i = 0; i < sampleCount; i++) {
      rng = (rng * 1103515245 + 12345) & 0x7fffffff
      chunk[i] = ((rng / 0x7fffffff) - 0.5) * 2 * amplitude
    }

    if (band.value === 'L') {
      const freqHz = (H1_DIFFUSE_BIN / 256) * SAMPLE_RATE
      const diffuseAmplitude = amplitude * H1_DIFFUSE_AMPLITUDE
      const twoPi = 2 * Math.PI
      for (let i = 0; i < sampleCount; i++) {
        const tSec = (totalOffset + i) / SAMPLE_RATE
        const modulation = 1 + 0.1 * Math.sin(tSec * 0.3)
        chunk[i] += diffuseAmplitude * modulation * Math.sin(twoPi * freqHz * tSec)
      }
    }

    // Superposition des signaux pulsars actifs
    if (activeSignals?.value?.length) {
      const twoPi = 2 * Math.PI
      for (const signal of activeSignals.value) {
        if (!signal.frequencyHz || !signal.fluxRelative) continue

        // Convertir la fréquence radio (Hz) en fréquence
        // audio équivalente dans la FFT (0–125 Hz)
        // On mappe la bande de réception sur 0–SAMPLE_RATE/2
        const bandRanges = {
          P: [150e6, 400e6],
          L: [1000e6, 1800e6],
          X: [2e9, 10e9],
          G: [1e10, 1e13],
        }
        const range = bandRanges[band.value] ?? bandRanges['L']
        const bandWidth = range[1] - range[0]
        const freqNorm = Math.max(0, Math.min(1,
          (signal.frequencyHz - range[0]) / bandWidth
        ))
        // Fréquence audio dans 0–125 Hz
        const freqAudio = freqNorm * (SAMPLE_RATE / 2)

        // Courbe exponentielle : amplifie les différences
        // flux 0.05 → facteur 0.15, flux 1.0 → facteur 3.0
        const fluxCurved = Math.pow(signal.fluxRelative, 0.5)
        const signalAmplitude = amplitude * fluxCurved * 2.0

        // Modulation pulsée si is_periodic
        // La période de pulse est visible comme
        // variation d'amplitude basse fréquence
        for (let i = 0; i < sampleCount; i++) {
          const tSec = (totalOffset + i) / SAMPLE_RATE
          let envelope = 1
          if (signal.isPeriodic && signal.pulsePeriodS) {
            // Enveloppe pulsée : créneau simplifié
            const phase = (tSec % signal.pulsePeriodS)
              / signal.pulsePeriodS
            envelope = phase < 0.1 ? 1 : 0.05
          }
          chunk[i] += signalAmplitude * envelope
            * Math.sin(twoPi * freqAudio * tSec)
        }
      }
    }

    return chunk
  }

  return { noiseLevel, getNoiseSample }
}
