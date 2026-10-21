/**
 * Calculs du spectrogramme Radar — LACUNA
 * Fonctions pures partagées par RadarView et RadarMiniature : indexation du buffer circulaire
 * de colonnes, bornes de fréquence, injection des pulsars, libellés de temps.
 */
import { SAMPLE_RATE } from './spectrogramData'

/** Nombre de bins de fréquence par colonne (0 → Nyquist) */
export const RADAR_FREQ_BINS = 128
/** Fréquence de Nyquist du signal simulé (Hz) */
export const RADAR_NYQUIST_HZ = SAMPLE_RATE / 2
/** Durée d'un tick d'acquisition (ms) */
export const RADAR_TICK_MS = 100

/**
 * Colonnes du buffer par pixel, selon l'échelle de temps.
 * @param {number} timeScaleMs - ms par colonne affichée (10 | 100 | 1000 | 10000)
 */
export function ticksPerPixel(timeScaleMs, tickMs = RADAR_TICK_MS) {
  return Math.max(1, Math.round(timeScaleMs / tickMs))
}

/**
 * Indice dans le buffer circulaire de la colonne affichée au pixel px (colonne la plus récente à droite).
 * @param {object} p
 * @param {number} p.writeCol - Prochaine colonne à écrire
 * @param {number} p.px - Pixel dans la zone utile (0 … innerW − 1)
 * @param {number} p.innerW - Largeur utile en px
 * @param {number} p.ticksPerPx
 * @param {number} p.historySize - Taille du buffer circulaire
 * @param {number} [p.scrollOffset=0] - Défilement vers le passé (px)
 */
export function columnIndexAt({ writeCol, px, innerW, ticksPerPx, historySize, scrollOffset = 0 }) {
  const colOffset = (innerW - 1 - px) * ticksPerPx
  return (writeCol - 1 - colOffset - Math.round(scrollOffset * ticksPerPx) + historySize * 100) % historySize
}

/**
 * Bornes de bins correspondant à une plage de fréquences (Hz).
 * @returns {{ binLow: number, binHigh: number, binRange: number }}
 */
export function freqRangeToBins(lowHz, highHz, freqBins = RADAR_FREQ_BINS) {
  const binLow = Math.floor((lowHz / RADAR_NYQUIST_HZ) * freqBins)
  const binHigh = Math.ceil((highHz / RADAR_NYQUIST_HZ) * freqBins)
  return { binLow, binHigh, binRange: binHigh - binLow || 1 }
}

/**
 * Ajoute les impulsions des pulsars actifs à une colonne de magnitudes (après FFT, avant normalisation).
 * Impulsion gaussienne dans les 5 % initiaux de la période, centrée sur la fréquence de rotation ;
 * un pulsar hors plage (milliseconde, > Nyquist) est étalé sur tous les bins à amplitude réduite.
 * @param {number[]} magnitudes - Colonne modifiée sur place
 * @param {Array<{ fluxRelative: number, pulsePeriodS: number, rotationFrequencyHz?: number }>} signals
 * @param {object} opts
 * @param {number} opts.tSec - Temps simulé courant (s)
 * @param {number} [opts.threshold=0] - Flux relatif minimum (0–1)
 * @param {number} [opts.freqBins=RADAR_FREQ_BINS]
 */
export function injectPulsarSignals(magnitudes, signals, { tSec, threshold = 0, freqBins = RADAR_FREQ_BINS }) {
  for (const signal of signals ?? []) {
    if (signal.fluxRelative < threshold) continue
    if (!signal.pulsePeriodS || !signal.fluxRelative) continue

    // Position dans la période courante (0 à 1) : impulsion seulement dans les 5 % initiaux
    const phase = (tSec % signal.pulsePeriodS) / signal.pulsePeriodS
    if (phase > 0.05) continue

    // Amplitude absolue dans [0, 1], normalisée ensuite avec le reste de la colonne
    const peakAmplitude = Math.pow(signal.fluxRelative, 0.6) * 0.8
    // Enveloppe gaussienne dans le temps : max au début de l'impulsion
    const sigma = 0.02
    const envelope = Math.exp(-(phase * phase) / (2 * sigma * sigma))

    const rotHz = signal.rotationFrequencyHz
    if (rotHz && rotHz <= RADAR_NYQUIST_HZ) {
      const centerBin = Math.max(0, Math.min(freqBins - 1, Math.round((rotHz / RADAR_NYQUIST_HZ) * freqBins)))
      // Quelques bins autour du centre
      const width = 3
      for (let b = centerBin - width; b <= centerBin + width; b++) {
        if (b < 0 || b >= freqBins) continue
        const dist = Math.abs(b - centerBin)
        magnitudes[b] += peakAmplitude * envelope * Math.exp(-(dist * dist) / (2 * 1.5 * 1.5))
      }
    } else {
      for (let bin = 0; bin < freqBins; bin++) {
        magnitudes[bin] += peakAmplitude * envelope * 0.1
      }
    }
  }
  return magnitudes
}

/**
 * Libellé d'un repère de temps sur l'axe X (âge de la colonne).
 * @example formatAgeLabel(300) → '-30s' ; formatAgeLabel(600) → '-1:00' ; formatAgeLabel(900) → '-1:30'
 */
export function formatAgeLabel(ageCols, tickMs = RADAR_TICK_MS) {
  const totalSeconds = Math.round((ageCols * tickMs) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `-${String(seconds).padStart(2, '0')}s`
  if (seconds === 0) return `-${minutes}:00`
  return `-${minutes}:${String(seconds).padStart(2, '0')}`
}
