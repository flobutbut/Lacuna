/**
 * Store Radar — réglages du spectrogramme (bande, pause, sélection, échelles, filtres, son, bruit)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRadarStore = defineStore('radar', () => {
  /** Bande de fréquences Radar : 'P' | 'L' | 'X' | 'G' */
  const radarFrequencyBand = ref('L')
  /** Radar en pause (n'acquiert plus de données) */
  const radarPaused = ref(false)
  /** Mode sélection Radar en pause : 'zone' | 'period' | null. Zone présélectionné. */
  const radarSelectionMode = ref('zone')
  /** Échelle temps spectrogramme radar : ms par pixel (10 = zoom ×10 | 100 | 1000 | 10000) */
  const radarTimeScale = ref(100)
  /** Seuil d'affichage (0–1, fraction de l'échelle dB de la fenêtre) : colonnes plus faibles masquées */
  const radarIntensityThreshold = ref(0)
  /** Son radar (spectrogramme) — UI seule tant que l’audio n’est pas branché */
  const radarSoundEnabled = ref(false)
  /** Bruit de fond du spectrogramme radar (thermique + synchrotron) */
  const radarNoiseEnabled = ref(true)
  /** Borne basse du zoom fréquentiel (0–125 Hz) */
  const radarFreqLow = ref(0)
  /** Borne haute du zoom fréquentiel (0–125 Hz) */
  const radarFreqHigh = ref(125)
  /** Acquisition spectrogramme (buffer radar) — piloté depuis le header */
  const radarEnabled = ref(true)

  function toggleRadarEnabled() {
    radarEnabled.value = !radarEnabled.value
  }

  function setRadarFrequencyBand(band) {
    if (band) radarFrequencyBand.value = band
  }

  function toggleRadarPaused() {
    radarPaused.value = !radarPaused.value
  }

  function setRadarSelectionMode(mode) {
    radarSelectionMode.value = mode === 'zone' || mode === 'period' ? mode : null
  }

  function setRadarTimeScale(ms) {
    if ([10, 100, 1000, 10000].includes(Number(ms))) {
      radarTimeScale.value = Number(ms)
    }
  }

  function setRadarIntensityThreshold(val) {
    const n = parseFloat(val)
    if (!isNaN(n)) {
      radarIntensityThreshold.value = Math.min(1, Math.max(0, n))
    }
  }

  function setRadarFreqLow(val) {
    const n = parseFloat(val)
    if (!isNaN(n)) {
      radarFreqLow.value = Math.min(
        radarFreqHigh.value - 1,
        Math.max(0, n)
      )
    }
  }

  function setRadarFreqHigh(val) {
    const n = parseFloat(val)
    if (!isNaN(n)) {
      radarFreqHigh.value = Math.max(
        radarFreqLow.value + 1,
        Math.min(125, n)
      )
    }
  }

  function toggleRadarSound() {
    radarSoundEnabled.value = !radarSoundEnabled.value
  }

  function toggleRadarNoise() {
    radarNoiseEnabled.value = !radarNoiseEnabled.value
  }

  return {
    radarFrequencyBand,
    setRadarFrequencyBand,
    radarPaused,
    toggleRadarPaused,
    radarSelectionMode,
    setRadarSelectionMode,
    radarTimeScale,
    setRadarTimeScale,
    radarIntensityThreshold,
    setRadarIntensityThreshold,
    radarSoundEnabled,
    toggleRadarSound,
    radarNoiseEnabled,
    toggleRadarNoise,
    radarFreqLow,
    setRadarFreqLow,
    radarFreqHigh,
    setRadarFreqHigh,
    radarEnabled,
    toggleRadarEnabled,
  }
})
