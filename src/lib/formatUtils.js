/**
 * Utilitaires de formatage — LACUNA
 * barWidth, formatDate, barClass, valClass, formatRaDec
 */

/** Valeur 0–1 → pourcentage CSS pour barres de progression */
export function barWidth(val) {
  return Math.round((val || 0) * 100) + '%'
}

/** Date ISO → chaîne locale fr-FR (ex: "14 mars 2026") */
export function formatDate(iso, options = {}) {
  if (!iso) return ''
  const d = new Date(iso)
  const opts = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  }
  return d.toLocaleDateString('fr-FR', opts)
}

/**
 * Nombre → chaîne formatée français (séparateurs de milliers).
 * @param {number|string|null|undefined} n - Valeur à formater
 * @param {Object} [options] - Options Intl.NumberFormat + fallback si n invalide
 * @param {string} [options.fallback='—'] - Retour si n null/undefined/NaN
 * @returns {string}
 */
export function formatNumber(n, options = {}) {
  const { fallback = '—', ...intlOpts } = options
  const num = Number(n)
  if (n == null || Number.isNaN(num)) return fallback
  return new Intl.NumberFormat('fr-FR', intlOpts).format(num)
}

/** Tendance effectif ('up'|'down'|'stable') → symbole (↗ ↘ →) */
export function formatEffectifTrend(trend) {
  if (trend === 'up') return '↗'
  if (trend === 'down') return '↘'
  return '→'
}

/** Pourcentage (0–1) → classe CSS barre (bar-green, bar-amber, bar-red) */
export function barClass(pct) {
  if (pct >= 0.8) return 'bar-green'
  if (pct >= 0.5) return 'bar-amber'
  return 'bar-red'
}

/** Pourcentage (0–1) → classe CSS valeur (ok, warn, err) */
export function valClass(pct) {
  if (pct >= 0.8) return 'ok'
  if (pct >= 0.5) return 'warn'
  return 'err'
}

/**
 * Temps écoulé (timestamp) → "il y a X min/h/j"
 * @param {number|string|Date} ts - Timestamp ou date
 * @param {Object} options
 * @param {string} [options.prefix=''] - Préfixe (ex: "Reçu ")
 * @param {string} [options.fallback='—'] - Si ts vide
 * @param {boolean} [options.precise=false] - true : "X min" si < 60 min ; false : "< 1h" si < 1h
 */
export function formatRelativeTime(ts, options = {}) {
  const { prefix = '', fallback = '—', precise = false } = options
  if (!ts) return fallback
  const d = new Date(ts)
  const diffMs = Date.now() - d
  const min = Math.floor(diffMs / 60000)
  const h = Math.floor(min / 60)
  const j = Math.floor(h / 24)

  if (precise && min < 60) return `${prefix}il y a ${min} min`
  if (!precise && h < 1) return `${prefix}il y a < 1h`
  if (h < 24) return `${prefix}il y a ${h}h`
  return `${prefix}il y a ${j}j`
}

/** Fréquence Hz → chaîne affichable (ex: "1420 MHz", "50 keV", "1.33 Hz") */
export function formatFrequency(hz) {
  const n = Number(hz)
  if (Number.isNaN(n) || n <= 0) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} THz`
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GHz`
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)} MHz`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} kHz`
  return `${n} Hz`
}

/** Chaîne "1420 MHz" ou "408 MHz" → Hz */
export function parseFrequency(str) {
  if (!str || typeof str !== 'string') return 1420e6
  const m = str.match(/^([\d.]+)\s*(MHz|kHz|Hz)?$/i)
  if (!m) return 1420e6
  const v = parseFloat(m[1])
  const unit = (m[2] || 'Hz').toUpperCase()
  if (unit === 'MHZ') return v * 1e6
  if (unit === 'KHZ') return v * 1e3
  return v
}

/** Coordonnées équatoriales (ra, dec en degrés) → chaîne α h m s  δ ° ′ */
export function formatRaDec(ra, dec) {
  const raH = (ra ?? 0) / 15
  const h = Math.floor(raH)
  const m = Math.floor((raH - h) * 60)
  const s = Math.floor(((raH - h) * 60 - m) * 60)
  const decSign = (dec ?? 0) >= 0 ? '+' : '−'
  const decAbs = Math.abs(dec ?? 0)
  const decDeg = Math.floor(decAbs)
  const decMin = Math.floor((decAbs - decDeg) * 60)
  return `α ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s  δ ${decSign}${decDeg}° ${String(decMin).padStart(2, '0')}′`
}

/** Nom d'observation pour un signal — aligné création (SignalModal) / recherche (store) */
export function formatSignalObservationName(signal) {
  if (!signal) return ''
  return `${signal.frequency} · azimut ${signal.azimuth}°`
}
