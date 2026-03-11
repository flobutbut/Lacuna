/**
 * Zone habitable — Kopparapu et al. 2013 (ApJ 765, 131)
 * d (AU) = √(L/L☉ / S_eff)
 * S_inner = 1.04 (runaway greenhouse), S_outer = 0.35 (max greenhouse)
 */

const S_INNER = 1.04
const S_OUTER = 0.35

/** L/L☉ depuis mass_stellar (M☉) — relation masse-luminosité séquence principale */
export function luminosityFromMass(massStellar) {
  const m = parseFloat(massStellar)
  if (!m || m <= 0) return 0.01
  if (m < 0.43) return 0.23 * Math.pow(m, 2.3)
  if (m <= 2) return Math.pow(m, 4)
  return 1.4 * Math.pow(m, 3.5)
}

/** L/L☉ typique par type spectral (séquence principale) — fallback si pas de masse */
const L_BY_LETTER = {
  O: 50000,
  B: 1000,
  A: 20,
  F: 3,
  G: 1,
  K: 0.35,
  M: 0.05,
  L: 0.001,
  T: 0.0001,
  Y: 0.00001,
}

export function luminosityFromSpectralType(spectralType) {
  if (!spectralType || typeof spectralType !== 'string') return 0.01
  const upper = spectralType.toUpperCase()
  if (upper.startsWith('PSR') || upper.includes('PULSAR') || upper.includes('NEUTRON')) return 0.0001
  const letter = upper[0]
  const base = L_BY_LETTER[letter] ?? 0.05
  const match = spectralType.match(/[OBAGKMF]([0-9.]+)/)
  const sub = match ? parseFloat(match[1]) || 5 : 5
  const t = sub / 9
  const nextLetter = { O: 'B', B: 'A', A: 'F', F: 'G', G: 'K', K: 'M', M: 'L', L: 'T', T: 'Y' }[letter]
  const nextBase = nextLetter ? L_BY_LETTER[nextLetter] ?? base : base
  return base * Math.pow(nextBase / base, t)
}

/**
 * Limites zone habitable en AU
 * @param {number} luminosity - L/L☉
 * @returns {{ inner: number, outer: number }}
 */
export function habitableZoneLimits(luminosity) {
  const L = Math.max(1e-6, luminosity)
  return {
    inner: Math.sqrt(L / S_INNER),
    outer: Math.sqrt(L / S_OUTER),
  }
}
