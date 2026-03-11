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
