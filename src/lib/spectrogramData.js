/**
 * Génération de données synthétiques pour spectrogramme (Analyseur spectral)
 * Simule un signal radio : ton principal + bruit. Déterministe via seed.
 * Format : Array<[timestamp_ms, amplitude]>
 */
import { seededRandom } from './random'

export const SAMPLE_RATE = 250 // Hz
export const DEFAULT_DURATION_SEC = 72

/**
 * Détecte le type de structure à partir d'une chaîne brute.
 * @returns {'sursaut'|'pulse'|'carre'|'continu-decroit'|'non-uniforme'}
 */
function parseStructure(s) {
  const str = (s ?? '').toLowerCase()
  if (/sursaut|burst/.test(str)) return 'sursaut'
  if (/carré|carre/.test(str)) return 'carre'
  if (/continu décroissant|decroissant/.test(str)) return 'continu-decroit'
  if (/pulsé|périodique|continu/.test(str)) return 'pulse'
  return 'non-uniforme'
}

/**
 * Génère des données de signal pour le spectrogramme
 * @param {Object} opts
 * @param {number} opts.durationSec - Durée en secondes (défaut 72)
 * @param {number} opts.freqHz - Fréquence du ton principal (défaut 12, dans la bande 0-25Hz)
 * @param {number} opts.seed - Seed pour reproductibilité (défaut hash de obsId)
 * @param {number} opts.noiseLevel - Niveau de bruit 0-1 (défaut 0.15)
 * @param {boolean} opts.anomalous - Signal « artificiel » : bande étroite, très stable, pulsé régulier
 * @param {string} [opts.structure] - Structure du signal : sursaut, pulsé, non uniforme, carré
 * @returns {Array<[number, number]>} [[timestamp_ms, amplitude], ...]
 */
export function generateSpectrogramData(opts = {}) {
  const durationSec = opts.durationSec ?? DEFAULT_DURATION_SEC
  const seed = opts.seed ?? 42
  const anomalous = opts.anomalous ?? false
  const structure = parseStructure(opts.structure)

  const samplesPerSec = SAMPLE_RATE
  const totalSamples = Math.floor(durationSec * samplesPerSec)
  const dt = 1000 / samplesPerSec
  const rng = seededRandom(seed)

  const data = []
  const amplitude = 60000
  const twoPi = 2 * Math.PI

  if (anomalous) {
    const freqHz = 14
    const noiseLevel = 0.02
    const pulsePeriod = 1.337
    const pulseWidth = 0.15
    for (let i = 0; i < totalSamples; i++) {
      const tSec = i / samplesPerSec
      const tMs = i * dt
      const phase = (tSec % pulsePeriod) / pulsePeriod
      const inPulse = phase < pulseWidth
      const envelope = inPulse ? 1 : 0.05
      const tone = amplitude * Math.sin(twoPi * freqHz * tSec) * envelope
      const noise = (rng() - 0.5) * 2 * amplitude * noiseLevel
      data.push([tMs, Math.round(tone + noise)])
    }
  } else if (structure === 'sursaut') {
    const noiseLevel = opts.noiseLevel ?? 0.12
    const burstCenter = durationSec * (0.2 + (seed % 60) / 100)
    const burstWidth = durationSec * (0.08 + (seed % 20) / 500)
    const freqHz = opts.freqHz ?? 8 + (seed % 10)
    for (let i = 0; i < totalSamples; i++) {
      const tSec = i / samplesPerSec
      const tMs = i * dt
      const dist = Math.abs(tSec - burstCenter) / burstWidth
      const envelope = Math.exp(-dist * dist * 2)
      const tone = amplitude * Math.sin(twoPi * freqHz * tSec) * envelope
      const noise = (rng() - 0.5) * 2 * amplitude * noiseLevel
      data.push([tMs, Math.round(tone + noise)])
    }
  } else if (structure === 'carre') {
    const freqHz = opts.freqHz ?? 10 + (seed % 8)
    const noiseLevel = opts.noiseLevel ?? 0.15
    for (let i = 0; i < totalSamples; i++) {
      const tSec = i / samplesPerSec
      const tMs = i * dt
      const phase = (tSec * freqHz) % 1
      const square = phase < 0.5 ? 1 : -1
      const tone = amplitude * 0.8 * square
      const noise = (rng() - 0.5) * 2 * amplitude * noiseLevel
      data.push([tMs, Math.round(tone + noise)])
    }
  } else if (structure === 'continu-decroit') {
    const freqHz = opts.freqHz ?? 8 + (seed % 10)
    const noiseLevel = opts.noiseLevel ?? 0.12
    const tauSec = durationSec * (0.3 + (seed % 30) / 100)
    for (let i = 0; i < totalSamples; i++) {
      const tSec = i / samplesPerSec
      const tMs = i * dt
      const envelope = Math.exp(-tSec / tauSec)
      const tone = amplitude * Math.sin(twoPi * freqHz * tSec) * envelope
      const noise = (rng() - 0.5) * 2 * amplitude * noiseLevel
      data.push([tMs, Math.round(tone + noise)])
    }
  } else {
    const freqHz = opts.freqHz ?? 10 + (seed % 8)
    const noiseLevel = opts.noiseLevel ?? 0.15
    for (let i = 0; i < totalSamples; i++) {
      const tSec = i / samplesPerSec
      const tMs = i * dt
      const tone = amplitude * Math.sin(twoPi * freqHz * tSec)
      const noise = (rng() - 0.5) * 2 * amplitude * noiseLevel
      data.push([tMs, Math.round(tone + noise)])
    }
  }

  return data
}

/**
 * Calcule un seed à partir d'un id d'observation
 */
export function seedFromObsId(obsId) {
  let h = 0
  const s = String(obsId)
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h) || 42
}

/**
 * Génère des données pour l'analyseur de structure temporelle.
 * La structure (sursaut, pulsé, etc.) est gérée par generateSpectrogramData.
 * @param {Object} opts - Mêmes options que generateSpectrogramData
 * @param {number} [opts.pulsePeriodSec] - Si défini (et non anomalous, non sursaut), modulation pulsée type pulsar
 * @param {boolean} [opts.anomalous] - Signal artificiel : déjà pulsé régulier
 * @param {string} [opts.structure] - Structure du signal : sursaut → une bosse, pulsé → train de pulses
 * @returns {Array<[number, number]>} [[timestamp_ms, amplitude], ...]
 */
export function generateStructureTemporelleData(opts = {}) {
  const { pulsePeriodSec, anomalous, structure, ...rest } = opts
  const struct = parseStructure(structure)
  const data = generateSpectrogramData({ ...rest, anomalous, structure: opts.structure })

  if (anomalous || struct === 'sursaut' || !pulsePeriodSec || pulsePeriodSec <= 0) return data

  const burstWidth = pulsePeriodSec * 0.3
  const samplesPerSec = SAMPLE_RATE

  return data.map(([tMs, val], i) => {
    const tSec = i / samplesPerSec
    const phase = (tSec % pulsePeriodSec) / pulsePeriodSec
    const inBurst = phase < burstWidth / pulsePeriodSec
    const envelope = inBurst ? 1 : 0.12
    return [tMs, Math.round(val * envelope)]
  })
}

/**
 * Calcule l'autocorrélation normalisée (lag → corrélation).
 * @param {number[]} values - Série d'amplitudes
 * @param {number} maxLag - Nombre max de décalages (défaut 2000)
 * @param {number} downsample - Prendre 1 échantillon sur N pour accélérer (défaut 10)
 * @returns {Array<[number, number]>} [[lag_ms, corrélation], ...] corrélation ∈ [-1, 1]
 */
export function computeAutocorrelation(values, maxLag = 2000, downsample = 10) {
  const step = Math.max(1, downsample)
  const v = values.filter((_, i) => i % step === 0)
  const n = v.length
  if (n < 10) return []

  const mean = v.reduce((a, x) => a + x, 0) / n
  const c0 = v.reduce((a, x) => a + (x - mean) ** 2, 0)
  if (c0 === 0) return []

  const lagMax = Math.min(maxLag, Math.floor(n / 2))
  const out = []
  const dtMs = (1000 / SAMPLE_RATE) * step

  for (let k = 0; k < lagMax; k += Math.max(1, Math.floor(lagMax / 500))) {
    let ck = 0
    for (let i = 0; i < n - k; i++) {
      ck += (v[i] - mean) * (v[i + k] - mean)
    }
    out.push([k * dtMs, ck / c0])
  }
  return out
}

/**
 * Calcule une seule colonne FFT (magnitudes) pour une fenêtre de signal.
 * Utilisé pour le rendu incrémental (canvas Radar).
 * @param {number[]} values - Fenêtre d'amplitudes (longueur 256 ou 64, puissance de 2)
 * @param {number} freqBins
 * @returns {{ magnitudes: number[], intensity: number }}
 */
export function computeSpectrogramColumn(values, freqBins) {
  if (!values || values.length < 64) return { magnitudes: [], intensity: 0 }
  const N = values.length
  const mean = values.reduce((a, x) => a + x, 0) / N
  const centered = values.map((x) => x - mean)

  const re = centered.slice()
  const im = new Array(N).fill(0)
  _fftInPlace(re, im)
  const scale = 1 / N
  const maxK = Math.min(freqBins, (N >> 1) + 1)
  const fftRow = []
  for (let k = 0; k < maxK; k++) {
    fftRow.push(Math.sqrt(re[k] * re[k] + im[k] * im[k]) * scale)
  }
  for (let k = maxK; k < freqBins; k++) fftRow.push(0)
  const row = []
  for (let r = freqBins - 1; r >= 0; r--) row.push(fftRow[r])

  const maxMagnitude = row.length ? Math.max(...row) : 0
  let intensity = row.reduce((s, v) => s + v, 0) / row.length || 0
  if (maxMagnitude === 0) {
    intensity = 0
  } else {
    intensity = Math.min(1, Math.max(0, intensity / maxMagnitude))
  }
  return { magnitudes: row, intensity }
}

function _fftInPlace(re, im) {
  const N = re.length
  const nbits = 31 - Math.clz32(N)
  for (let i = 0; i < N; i++) {
    let j = 0
    let x = i
    for (let b = 0; b < nbits; b++) {
      j = (j << 1) | (x & 1)
      x >>= 1
    }
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const half = len >> 1
    const angle = (-2 * Math.PI) / len
    for (let i = 0; i < N; i += len) {
      for (let j = 0; j < half; j++) {
        const k = i + j
        const l = k + half
        const wr = Math.cos(angle * j)
        const wi = Math.sin(angle * j)
        const tr = wr * re[l] - wi * im[l]
        const ti = wr * im[l] + wi * re[l]
        re[l] = re[k] - tr
        im[l] = im[k] - ti
        re[k] += tr
        im[k] += ti
      }
    }
  }
}

/**
 * Calcule la matrice spectrogramme (temps × fréquence) pour rendu D3 heatmap.
 * Résolution élevée : pas de limite pixel, adapté au zoom.
 * @param {Array<[number, number]>} data - [[timestamp_ms, amplitude], ...]
 * @param {number} sampleRate
 * @param {number} durationSec
 * @param {Object} opts
 * @param {boolean} opts.anomalous - Fenêtre FFT courte (64) pour résoudre la pulsation
 * @param {number} opts.timeSteps - Colonnes temporelles (défaut 450)
 * @param {number} opts.freqBins - Lignes fréquentielles (défaut 96)
 * @returns {{ cells: Array<{t: number, f: number, value: number}>, tDomain: [number,number], fDomain: [number,number], maxVal: number, dt: number, df: number }}
 */
export function computeSpectrogramMatrix(data, sampleRate, durationSec, opts = {}) {
  if (!data || data.length < 256) return null
  const values = data.map((d) => d[1])

  const anomalous = opts.anomalous ?? false
  const windowSize = anomalous ? 64 : 256
  const timeSteps = opts.timeSteps ?? 450
  const freqBins = opts.freqBins ?? 96

  function fftMagnitudes(realSamples, numBins) {
    const N = realSamples.length
    const re = realSamples.slice()
    const im = new Array(N).fill(0)
    _fftInPlace(re, im)
    const scale = 1 / N
    const maxK = Math.min(numBins, (N >> 1) + 1)
    const out = []
    for (let k = 0; k < maxK; k++) {
      out.push(Math.sqrt(re[k] * re[k] + im[k] * im[k]) * scale)
    }
    for (let k = maxK; k < numBins; k++) out.push(0)
    return out
  }

  const step = Math.max(1, Math.floor((values.length - windowSize) / timeSteps))
  const spectrogram = []
  let maxVal = 1e-6

  for (let ti = 0; ti < timeSteps; ti++) {
    const t = Math.min(ti * step, values.length - windowSize)
    if (t < 0) break
    const window = values.slice(t, t + windowSize)
    const mean = window.reduce((a, x) => a + x, 0) / window.length
    const centered = window.map((x) => x - mean)
    const fftRow = fftMagnitudes(centered, freqBins)
    const row = []
    for (let r = freqBins - 1; r >= 0; r--) row.push(fftRow[r])
    for (const m of row) {
      if (m > maxVal) maxVal = m
    }
    spectrogram.push(row)
  }

  const nyquist = sampleRate / 2
  const dt = durationSec / Math.max(1, spectrogram.length)
  const df = nyquist / freqBins

  const cells = []
  for (let col = 0; col < spectrogram.length; col++) {
    const tCenter = col * dt + dt / 2
    for (let row = 0; row < freqBins; row++) {
      const fCenter = (freqBins - 1 - row) * df + df / 2
      const val = Math.min(1, Math.max(0, spectrogram[col][row] / maxVal))
      cells.push({ t: tCenter, f: fCenter, value: val })
    }
  }

  return {
    cells,
    tDomain: [0, durationSec],
    fDomain: [0, nyquist],
    maxVal,
    dt,
    df,
    timeSteps: spectrogram.length,
    freqBins,
  }
}
