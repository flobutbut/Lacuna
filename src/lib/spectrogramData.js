/**
 * Génération de données synthétiques pour spectrogramme (Analyseur spectral)
 * Simule un signal radio : ton principal + bruit. Déterministe via seed.
 * Format attendu par spectrogram-js : Array<[timestamp_ms, amplitude]>
 */
export const SAMPLE_RATE = 250 // Hz
export const DEFAULT_DURATION_SEC = 72

/**
 * Générateur pseudo-aléatoire déterministe (mulberry32)
 */
function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Génère des données de signal pour le spectrogramme
 * @param {Object} opts
 * @param {number} opts.durationSec - Durée en secondes (défaut 72)
 * @param {number} opts.freqHz - Fréquence du ton principal (défaut 12, dans la bande 0-25Hz)
 * @param {number} opts.seed - Seed pour reproductibilité (défaut hash de obsId)
 * @param {number} opts.noiseLevel - Niveau de bruit 0-1 (défaut 0.15)
 * @returns {Array<[number, number]>} [[timestamp_ms, amplitude], ...]
 */
export function generateSpectrogramData(opts = {}) {
  const durationSec = opts.durationSec ?? DEFAULT_DURATION_SEC
  const freqHz = opts.freqHz ?? 12
  const seed = opts.seed ?? 42
  const noiseLevel = opts.noiseLevel ?? 0.15

  const samplesPerSec = SAMPLE_RATE
  const totalSamples = Math.floor(durationSec * samplesPerSec)
  const dt = 1000 / samplesPerSec // ms entre échantillons
  const rng = seededRandom(seed)

  const data = []
  const amplitude = 60000 // amplitude du ton (les exemples README avaient ~30k-80k)
  const twoPi = 2 * Math.PI

  for (let i = 0; i < totalSamples; i++) {
    const tSec = i / samplesPerSec
    const tMs = i * dt
    const tone = amplitude * Math.sin(twoPi * freqHz * tSec)
    const noise = (rng() - 0.5) * 2 * amplitude * noiseLevel
    const value = Math.round(tone + noise)
    data.push([tMs, value])
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
 * Optionnellement ajoute une modulation pulsée (type pulsar) pour varier les signaux.
 * @param {Object} opts - Mêmes options que generateSpectrogramData + pulsePeriodSec
 * @param {number} [opts.pulsePeriodSec] - Si défini, applique une modulation pulsée (bursts)
 * @returns {Array<[number, number]>} [[timestamp_ms, amplitude], ...]
 */
export function generateStructureTemporelleData(opts = {}) {
  const { pulsePeriodSec, ...rest } = opts
  const data = generateSpectrogramData(rest)
  if (!pulsePeriodSec || pulsePeriodSec <= 0) return data

  const burstWidth = pulsePeriodSec * 0.3 // 30 % du cycle en burst
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
