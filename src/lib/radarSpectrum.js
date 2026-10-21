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

/**
 * Magnitude de référence des pulsars : magnitude médiane du bruit de la bande L
 * (0,0532 par unité d'écart-type × 0,177 d'écart-type). Un pulsar a donc le même niveau absolu
 * dans toutes les bandes et ressort plus ou moins selon le bruit de la bande (faible en P, fort en γ).
 */
export const PULSAR_REFERENCE_MAGNITUDE = 0.0094
/** Rapport signal / bruit (bande L) d'un pulsar de flux relatif 1 */
export const PULSAR_SNR_MAX = 40
/** Largeur de l'impulsion (écart-type, fraction de la période) */
const PULSE_SIGMA = 0.02

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
 * Distance (fraction de période) entre l'intervalle [tSec, tSec + dtSec] et le pic d'impulsion le plus proche ;
 * 0 si un pic tombe dans l'intervalle. Toutes les impulsions sont vues, quelle que soit la période.
 */
function pulseDistance(tSec, dtSec, periodS, offset) {
  if (dtSec >= periodS) return 0
  const phase = (((tSec / periodS + offset) % 1) + 1) % 1
  const untilNext = (1 - phase) % 1
  const dtPhase = dtSec / periodS
  if (untilNext <= dtPhase) return 0
  return Math.min(phase, untilNext - dtPhase)
}

/**
 * Fréquence apparente après échantillonnage (repliement autour de la fréquence d'échantillonnage) :
 * un pulsar milliseconde au-delà de Nyquist apparaît à sa fréquence repliée, comme sur un vrai récepteur.
 * @returns {number|null} 0 … RADAR_NYQUIST_HZ, ou null sans fréquence
 */
export function aliasedFrequencyHz(hz) {
  if (!hz) return null
  const fs = 2 * RADAR_NYQUIST_HZ
  return Math.abs(hz - fs * Math.round(hz / fs))
}

/**
 * Ajoute les impulsions des pulsars à une colonne de magnitudes (après FFT).
 * Impulsion gaussienne centrée sur la fréquence de rotation (repliée au-delà de Nyquist),
 * d'amplitude PULSAR_SNR_MAX × flux^0,6 fois la référence de bruit.
 * @param {number[]} magnitudes - Colonne modifiée sur place
 * @param {Array<{ id?: string, fluxRelative: number, pulsePeriodS: number, rotationFrequencyHz?: number, phaseOffset?: number }>} signals
 * @param {object} opts
 * @param {number} opts.tSec - Début de la colonne (s, temps d'acquisition)
 * @param {number} [opts.dtSec] - Durée couverte par la colonne (s)
 * @param {number} [opts.freqBins=RADAR_FREQ_BINS]
 */
export function injectPulsarSignals(magnitudes, signals, { tSec, dtSec = RADAR_TICK_MS / 1000, freqBins = RADAR_FREQ_BINS }) {
  for (const signal of signals ?? []) {
    if (!signal.pulsePeriodS || !signal.fluxRelative) continue

    const dist = pulseDistance(tSec, dtSec, signal.pulsePeriodS, pulsarPhaseOffset(signal))
    if (dist > 5 * PULSE_SIGMA) continue

    const peakAmplitude = PULSAR_REFERENCE_MAGNITUDE * PULSAR_SNR_MAX * Math.pow(signal.fluxRelative, 0.6)
    const envelope = Math.exp(-(dist * dist) / (2 * PULSE_SIGMA * PULSE_SIGMA))

    const rotHz = aliasedFrequencyHz(signal.rotationFrequencyHz)
    if (rotHz == null) continue
    const centerBin = Math.max(0, Math.min(freqBins - 1, Math.round((rotHz / RADAR_NYQUIST_HZ) * freqBins)))
    // Quelques bins autour du centre
    const width = 3
    for (let b = centerBin - width; b <= centerBin + width; b++) {
      if (b < 0 || b >= freqBins) continue
      const d = Math.abs(b - centerBin)
      magnitudes[b] += peakAmplitude * envelope * Math.exp(-(d * d) / (2 * 1.5 * 1.5))
    }
  }
  return magnitudes
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
