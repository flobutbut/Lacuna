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
 * Échantillons analysés par colonne (256 ms à 250 Hz), complétés à 256 pour garder 128 bins :
 * assez court pour séparer les impulsions des pulsars de période ≥ 0,25 s, au prix de raies larges de ~4 Hz
 */
export const RADAR_FFT_WINDOW = 64

/**
 * Colonnes du buffer par pixel, selon l'échelle de temps : 0,1 à 10 ms (zoom ×10, une colonne
 * sur 10 px), 1 à 100 ms, 10 à 1 s, 100 à 10 s (maximum des colonnes regroupées).
 * @param {number} timeScaleMs - ms par pixel affiché (10 | 100 | 1000 | 10000)
 */
export function ticksPerPixel(timeScaleMs, tickMs = RADAR_TICK_MS) {
  return timeScaleMs / tickMs
}

/** Colonnes depuis le bord droit jusqu'au pixel (arrondi bas, tolérant aux erreurs de virgule flottante) */
function colsFromRight(px, innerW, ticksPerPx) {
  return Math.floor((innerW - 1 - px) * ticksPerPx + 1e-9)
}

/**
 * Âge (colonnes, 0 = la plus récente) de la première colonne représentée au pixel px.
 * @param {number} scrollCols - Défilement vers le passé, en colonnes
 */
export function ageAtPx(px, innerW, ticksPerPx, scrollCols = 0) {
  return colsFromRight(px, innerW, ticksPerPx) + scrollCols
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
  const age = ageAtPx(px, innerW, ticksPerPx, Math.round(scrollOffset * ticksPerPx))
  return (writeCol - 1 - age + historySize * 100) % historySize
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

/** Écart-type du bruit de la bande L (plan galactique), référence des pulsars */
const NOISE_STD_L = 0.177
/**
 * Amplitude d'une impulsion de pulsar de flux relatif 1 : 400 écarts-types du bruit de la bande L.
 * Une impulsion de flux 0,13 ressort d'environ 20 dB au-dessus du bruit de la bande L, une de flux 0,01 de 3 dB.
 * Même amplitude absolue dans toutes les bandes : un pulsar ressort peu en P, beaucoup en γ.
 */
export const PULSAR_PULSE_AMPLITUDE = 400 * NOISE_STD_L
/** Largeur d'une impulsion (écart-type, s) : un demi-échantillon, donc une impulsion large bande (jusqu'à ~100 Hz) */
export const PULSAR_PULSE_SIGMA_S = 0.002

/** Décalage de phase stable (0–1) dérivé de l'identifiant : les pulsars ne battent pas en même temps */
export function pulsarPhaseOffset(signal) {
  if (signal.phaseOffset != null) return signal.phaseOffset
  const key = String(signal.id ?? '')
  let h = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 4294967296
}

/**
 * Ajoute au signal temporel le train d'impulsions de chaque pulsar (avant la FFT).
 * Une impulsion par période, gaussienne, d'amplitude PULSAR_PULSE_AMPLITUDE × flux^0,6 :
 * un pulsar lent donne une barre verticale par impulsion, un pulsar rapide un peigne de raies
 * (fréquence de rotation et harmoniques, repliées au-delà de Nyquist comme sur un vrai récepteur).
 * @param {Float32Array} chunk - Échantillons modifiés sur place
 * @param {Array<{ id?: string, fluxRelative: number, pulsePeriodS: number, phaseOffset?: number }>} signals
 * @param {object} opts
 * @param {number} opts.startSample - Indice absolu du premier échantillon
 * @param {number} [opts.sampleRate=SAMPLE_RATE]
 */
export function addPulsarPulses(chunk, signals, { startSample, sampleRate = SAMPLE_RATE }) {
  const reach = 4 * PULSAR_PULSE_SIGMA_S
  const twoSigma2 = 2 * PULSAR_PULSE_SIGMA_S * PULSAR_PULSE_SIGMA_S
  const t0 = startSample / sampleRate
  const t1 = (startSample + chunk.length - 1) / sampleRate
  for (const signal of signals ?? []) {
    const period = signal.pulsePeriodS
    if (!period || !signal.fluxRelative) continue
    const amplitude = PULSAR_PULSE_AMPLITUDE * Math.pow(signal.fluxRelative, 0.6)
    const offset = pulsarPhaseOffset(signal)
    // Impulsions centrées en (k − offset) × période, seulement celles qui touchent ce bloc
    const kFirst = Math.ceil((t0 - reach) / period + offset)
    const kLast = Math.floor((t1 + reach) / period + offset)
    for (let k = kFirst; k <= kLast; k++) {
      const tc = (k - offset) * period
      const iFrom = Math.max(0, Math.ceil((tc - reach) * sampleRate) - startSample)
      const iTo = Math.min(chunk.length - 1, Math.floor((tc + reach) * sampleRate) - startSample)
      for (let i = iFrom; i <= iTo; i++) {
        const dt = (startSample + i) / sampleRate - tc
        chunk[i] += amplitude * Math.exp(-(dt * dt) / twoSigma2)
      }
    }
  }
  return chunk
}

// ── Échelle d'affichage en dB ────────────────────────────────────────────────

/** Étendue minimale de l'échelle (dB) : le bruit seul ne remplit pas toute la palette */
export const RADAR_DB_MIN_SPAN = 40
/** Marge sous le bruit médian (dB) : le bas de la palette reste au-dessous du plancher de bruit */
export const RADAR_DB_FLOOR_MARGIN = 10
const DB_EPS = 1e-6
const HIST_MIN_DB = -130
const HIST_MAX_DB = 20

/** Magnitude → dB (−120 dB pour une magnitude nulle) */
export function magnitudeToDb(m) {
  return 20 * Math.log10(m + DB_EPS)
}

/**
 * Échelle de la fenêtre affichée : plancher RADAR_DB_FLOOR_MARGIN sous la médiane (le bruit),
 * plafond au maximum de la fenêtre, avec au moins RADAR_DB_MIN_SPAN d'étendue.
 * Médiane par histogramme de 1 dB (valeurs NaN ignorées).
 * @param {ArrayLike<number>} dbValues
 * @returns {{ floorDb: number, spanDb: number } | null} null si aucune valeur
 */
export function dbDisplayScale(dbValues) {
  const hist = new Uint32Array(HIST_MAX_DB - HIST_MIN_DB + 1)
  let n = 0
  let maxDb = -Infinity
  for (let i = 0; i < dbValues.length; i++) {
    const db = dbValues[i]
    if (Number.isNaN(db)) continue
    n++
    if (db > maxDb) maxDb = db
    const k = Math.max(0, Math.min(hist.length - 1, Math.floor(db) - HIST_MIN_DB))
    hist[k]++
  }
  if (!n) return null
  let acc = 0
  let medianDb = HIST_MIN_DB
  for (let k = 0; k < hist.length; k++) {
    acc += hist[k]
    if (acc * 2 >= n) {
      medianDb = k + HIST_MIN_DB + 0.5
      break
    }
  }
  const floorDb = medianDb - RADAR_DB_FLOOR_MARGIN
  return { floorDb, spanDb: Math.max(RADAR_DB_MIN_SPAN, maxDb - floorDb) }
}

/** Niveau d'affichage (0–1) d'une valeur en dB sur l'échelle de la fenêtre */
export function dbToLevel(db, { floorDb, spanDb }) {
  return Math.min(1, Math.max(0, (db - floorDb) / spanDb))
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

/**
 * Bin de fréquence affiché à la hauteur y (px canvas) : haut du tracé = fréquence la plus haute
 * de la plage zoomée, bas = la plus basse. Même correspondance pour le dessin et la sélection.
 * @param {number} y
 * @param {{ top: number, innerH: number, binLow: number, binRange: number }} geom
 * @returns {number|null} null hors du tracé
 */
export function binAtY(y, { top, innerH, binLow, binRange }) {
  const rel = (y - top) / innerH
  if (!(rel >= 0 && rel < 1)) return null
  return binLow + binRange - 1 - Math.floor(rel * binRange)
}

/**
 * Bande verticale (px canvas) couvrant les bins b0…b1 inclus, limitée à la plage zoomée.
 * @returns {{ y: number, h: number } | null} null si la bande est hors de la plage affichée
 */
export function binsToYRange(b0, b1, { top, innerH, binLow, binRange }) {
  const lo = Math.max(Math.min(b0, b1), binLow)
  const hi = Math.min(Math.max(b0, b1), binLow + binRange - 1)
  if (hi < lo) return null
  const yTop = top + ((binLow + binRange - 1 - hi) / binRange) * innerH
  const yBottom = top + ((binLow + binRange - lo) / binRange) * innerH
  return { y: yTop, h: yBottom - yTop }
}

/** Fréquence (Hz) du bord inférieur d'un bin */
export function binToHz(bin, freqBins = RADAR_FREQ_BINS) {
  return (bin / freqBins) * RADAR_NYQUIST_HZ
}

/**
 * Écart entre deux repères de temps (en colonnes) : 30 s à 100 ms par pixel, puis proportionnel
 * à l'échelle pour garder des repères espacés d'environ 300 px.
 */
export function ageLabelInterval(ticksPerPx, baseCols = 300) {
  return Math.max(1, Math.round(baseCols * ticksPerPx))
}
