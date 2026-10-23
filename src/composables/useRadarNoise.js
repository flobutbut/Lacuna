import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRadarStore } from '@/stores/radar'
import { SAMPLE_RATE } from '@/lib/spectrogramData'
import { addPulsarPulses, angularSeparationDeg, beamGain, RADAR_BEAM_FWHM_DEG } from '@/lib/radarSpectrum'
import { supernovaBands, SUPERNOVA_DIRECTION } from '@/lib/supernova'
import { useShipStore } from '@/stores/ship'
import { useObservatoireStore } from '@/stores/observatoire'
import { isWindowOpen } from '@/lib/signalWindow'

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
 * Rémanent de la supernova : émission synchrotron, plus forte aux basses fréquences (P > L > X), absente en γ.
 * Ajoutée comme bruit large bande quand le faisceau vise Orion.
 */
const SYNCHROTRON_BAND_FACTOR = { P: 1, L: 0.6, X: 0.25, G: 0 }
const SYNCHROTRON_STD = 0.5

/** Écart-type des échantillons au niveau de bruit le plus fort (bande P, plan galactique) */
export const NOISE_STD_MAX = 0.3
/** Niveau de bruit le plus fort (P : base + facteur galactique) */
const LEVEL_MAX = NOISE_CONFIG.P.base + NOISE_CONFIG.P.galacticFactor

/**
 * Écart-type théorique de therm + AR(1), en unité d'amplitude : 0,3 de bruit thermique
 * et 0,7 de bruit blanc lissé (variance (1 − α) / (1 + α) pour arState = α·arState + (1 − α)·w).
 */
function colouredNoiseStd(alpha) {
  return Math.sqrt(0.3 * 0.3 + 0.7 * 0.7 * ((1 - alpha) / (1 + alpha)))
}

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

/**
 * Signal temporel du radar (250 Hz) : bruit de fond de la bande et impulsions des pulsars actifs.
 * @param {import('vue').Ref<string>} band - Bande active
 * @param {import('vue').Ref<number>} galacticLatitude - Latitude galactique (°)
 * @param {import('vue').Ref<Array>} activeSignals - Sources de la bande active (pulsars, émetteurs à fenêtres)
 */
export function useRadarNoise(band, galacticLatitude, activeSignals) {
  const radarStore = useRadarStore()
  const shipStore = useShipStore()
  const observatoireStore = useObservatoireStore()
  const { radarNoiseEnabled } = storeToRefs(radarStore)

  /** Écart-type du bruit synchrotron du rémanent dans le faisceau (0 avant le déclin ou hors d'Orion) */
  function synchrotronStd() {
    const radio = supernovaBands(shipStore.supernovaT0)?.radio ?? 0
    const factor = SYNCHROTRON_BAND_FACTOR[band.value] ?? 0
    if (!radio || !factor) return 0
    const view = observatoireStore.viewDirection
    const sep = angularSeparationDeg(SUPERNOVA_DIRECTION.ra, SUPERNOVA_DIRECTION.dec, view.ra, view.dec)
    return SYNCHROTRON_STD * radio * factor * beamGain(sep, RADAR_BEAM_FWHM_DEG[band.value] ?? RADAR_BEAM_FWHM_DEG.L)
  }

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

  /**
   * Indice absolu (horloge murale) du premier échantillon du bloc : les impulsions tombent aux mêmes instants
   * que le halo de signal, quelle que soit l'heure d'allumage du radar. Recalé après une interruption.
   */
  let sampleBase = null
  function absoluteStartSample(totalOffset, sampleCount) {
    const expected = Math.round((Date.now() / 1000) * SAMPLE_RATE) - (totalOffset + sampleCount)
    if (sampleBase === null || Math.abs(expected - sampleBase) > SAMPLE_RATE) sampleBase = expected
    return sampleBase + totalOffset
  }

  /** Sources en train d'émettre : un signal à fenêtres est muet hors de sa fenêtre */
  function emittingSignals() {
    const now = Date.now()
    return activeSignals.value.filter((s) => isWindowOpen(s.window, now))
  }

  function getNoiseSample(sampleCount, seed, totalOffset) {
    if (radarNoiseEnabled.value === false) {
      return addPulsarPulses(new Float32Array(sampleCount), emittingSignals(), {
        startSample: absoluteStartSample(totalOffset, sampleCount),
      })
    }

    const level = noiseLevel.value
    const amplitude = 60000 * level
    const chunk = new Float32Array(sampleCount)

    const rng = createLcg(seed, totalOffset)
    const α = AR_ALPHA[band.value] ?? AR_ALPHA.L
    // Normalise la couleur du bruit (écart-type 1) puis applique le niveau de la bande :
    // P ≈ 0,3, L ≈ 0,18, X ≈ 0,07, γ ≈ 0,014 d'écart-type
    const gain = (NOISE_STD_MAX * level) / (LEVEL_MAX * colouredNoiseStd(α) * amplitude)
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

      chunk[i] = Math.max(-1, Math.min(1, v * gain))
    }

    const synchro = synchrotronStd()
    if (synchro > 0) {
      for (let i = 0; i < sampleCount; i++) {
        chunk[i] = Math.max(-1, Math.min(1, chunk[i] + nextGaussian(rng) * synchro))
      }
    }

    return addPulsarPulses(chunk, emittingSignals(), { startSample: absoluteStartSample(totalOffset, sampleCount) })
  }

  return { noiseLevel, getNoiseSample }
}
