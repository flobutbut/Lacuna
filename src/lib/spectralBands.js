/**
 * Filtrage spectral — indices de couleur et magnitude par bande (UBVRI)
 * Réf. Johnson-Cousins, Pecaut & Mamajek
 */

import { luminosityFromSpectralType } from './habitableZone'

/** L/L☉ → facteur normalisé 0–1 (log scale) — partagé par brightness et taille */
export function getLuminosityFactor(luminosity, spectralType) {
  const L = parseFloat(luminosity)
  const lum = Number.isFinite(L) ? L : (spectralType ? luminosityFromSpectralType(spectralType) : 1)
  const logL = Math.log10(1 + Math.max(0, lum))
  return Math.min(1, logL / 5)
}

/** L/L☉ → baseBrightness (0.5–1.0) — plus de contraste entre étoiles brillantes et faibles */
export function luminosityToBaseBrightness(luminosity, spectralType) {
  const t = getLuminosityFactor(luminosity, spectralType)
  return 0.5 + 0.5 * t
}

/** L/L☉ → multiplicateur de rayon (0.6–1.5) — étoiles lumineuses = plus grandes */
export function luminosityToRadiusMultiplier(luminosity, spectralType) {
  const t = getLuminosityFactor(luminosity, spectralType)
  return 0.6 + 0.9 * t
}

/** Magnitude absolue estimée depuis spectral_type — aligné avec backend */
function spectralTypeToMabs(st) {
  if (!st || typeof st !== 'string') return 15
  const letter = st.toUpperCase()[0]
  const match = st.match(/[OBAGKMF]([0-9.]+)/)
  const matchLty = st.match(/^[LTY]([0-9.]+)/)
  const sub = match ? Math.min(9, Math.max(0, parseFloat(match[1]) || 5)) : matchLty ? Math.min(9, parseFloat(matchLty[1]) || 5) : 5
  if (letter === 'L' || letter === 'T' || letter === 'Y') {
    if (letter === 'L') return 18 + sub * 0.4
    if (letter === 'T') return 22 + sub * 0.4
    if (letter === 'Y') return 26 + sub * 0.4
    return 22
  }
  const anchors = {
    O: [-5.2, -5.8, -6.0],
    B: [-4.1, -1.1, 0.5],
    A: [0.7, 2.0, 2.8],
    F: [2.6, 3.4, 4.0],
    G: [4.4, 5.1, 5.7],
    K: [5.9, 7.3, 8.5],
    M: [9.0, 12.0, 16.0],
  }
  const [m0, m5, m9] = anchors[letter] ?? [15, 15, 15]
  const m = sub <= 5 ? m0 + (m5 - m0) * (sub / 5) : m5 + (m9 - m5) * ((sub - 5) / 4)
  return m
}

/** m_V = M_abs + 5 * log10(d / 10) avec d en al */
export function apparentMagnitudeFromDistance(spectralType, distanceLy) {
  const d = parseFloat(distanceLy) || 10
  if (d < 0.01) return 99
  const mAbs = spectralTypeToMabs(spectralType)
  return mAbs + 5 * Math.log10(Math.max(d / 10, 0.001))
}

/** Magnitude absolue en IR (bande J) pour naines brunes L/T/Y — bien plus brillantes qu'en visible */
function spectralTypeToMabsIR(st) {
  if (!st || typeof st !== 'string') return 16
  const letter = st.toUpperCase()[0]
  const matchLty = st.match(/^[LTY]([0-9.]+)/)
  const sub = matchLty ? Math.min(9, parseFloat(matchLty[1]) || 5) : 5
  if (letter === 'L') return 10.5 + sub * 0.3
  if (letter === 'T') return 13 + sub * 0.35
  if (letter === 'Y') return 16 + sub * 0.4
  return 16
}

/** Magnitude apparente en IR pour naines brunes — utilisée pour le filtre bande IR */
function apparentMagnitudeIRFromDistance(spectralType, distanceLy) {
  const d = parseFloat(distanceLy) || 10
  if (d < 0.01) return 99
  const mAbsIR = spectralTypeToMabsIR(spectralType)
  return mAbsIR + 5 * Math.log10(Math.max(d / 10, 0.001))
}

/**
 * Indice de couleur V-I typique par type spectral (séquence principale)
 * V-I = m_V - m_I → m_I = m_V - (V-I) ; plus (V-I) = plus brillant en IR
 */
function getColorIndexVI(spectralType) {
  if (!spectralType || typeof spectralType !== 'string') return 0.7
  const letter = spectralType.toUpperCase()[0]
  if (letter === 'L' || letter === 'T' || letter === 'Y') return 3.5
  const match = spectralType.match(/[OBAGKMF]([0-9.]+)/)
  const sub = match ? Math.min(9, Math.max(0, parseFloat(match[1]) || 5)) : 5
  // Ancres : O5=-0.15, B0=-0.11, A0=0, F5=0.49, G2=0.70, K5=1.45, M5=2.70
  const anchors = {
    O: [-0.15, -0.15, -0.12],
    B: [-0.11, -0.05, 0.05],
    A: [0, 0.2, 0.35],
    F: [0.35, 0.49, 0.6],
    G: [0.6, 0.7, 0.85],
    K: [0.85, 1.45, 2.0],
    M: [2.0, 2.7, 3.2],
  }
  const a = anchors[letter] ?? [0.7, 0.7, 0.7]
  const t = sub / 9
  return a[0] + (a[1] - a[0]) * t + (a[2] - a[1]) * t * 0.5
}

/**
 * Indice U-V typique. U-V = m_U - m_V → m_U = m_V + (U-V)
 * Étoiles chaudes : U-V négatif → plus brillantes en UV
 */
function getColorIndexUV(spectralType) {
  if (!spectralType || typeof spectralType !== 'string') return 0.5
  const letter = spectralType.toUpperCase()[0]
  const match = spectralType.match(/[OBAGKMF]([0-9.]+)/)
  const sub = match ? Math.min(9, Math.max(0, parseFloat(match[1]) || 5)) : 5
  const t = sub / 9
  // O/B très négatifs, M positifs
  const anchors = {
    O: [-1.2, -1.0],
    B: [-0.9, -0.4],
    A: [-0.1, 0.1],
    F: [0.1, 0.3],
    G: [0.3, 0.5],
    K: [0.5, 1.0],
    M: [1.0, 1.5],
  }
  const [a, b] = anchors[letter] ?? [0.5, 0.5]
  return a + (b - a) * t
}

/**
 * Magnitude apparente dans la bande sélectionnée.
 * @param {number} mVis - magnitude visuelle (m_V)
 * @param {string} spectralType - ex. G2V, M5V
 * @param {string} band - 'visible' | 'ir' | 'uv' | 'r'
 * @returns {number} magnitude dans la bande
 */
export function magnitudeInBand(mVis, spectralType, band) {
  if (band === 'visible' || !mVis) return mVis
  if (band === 'r') {
    const vi = getColorIndexVI(spectralType)
    return mVis - vi * 0.4
  }
  if (band === 'ir') {
    const vi = getColorIndexVI(spectralType)
    return mVis - vi
  }
  if (band === 'uv') {
    const uv = getColorIndexUV(spectralType)
    return mVis + uv
  }
  return mVis
}

/** Classe spectrale — premier caractère de spectral_type */
export function getSpectralClass(spectralType) {
  if (!spectralType) return 'G'
  const first = spectralType.trim().toUpperCase()[0]
  return ['O', 'B', 'A', 'F', 'G', 'K', 'M', 'L', 'T', 'Y'].includes(first) ? first : 'G'
}

const HOT_STARS = ['O', 'B', 'A']
const COLD_STARS = ['K', 'M', 'L', 'T', 'Y']
const WHITE_DWARF = (st) => st && /^D[ABCOQZX]/i.test(st)

/** B-V (color_index) → RGB — visible uniquement. -0.3 (bleu) → 2.0 (rouge) */
function colorIndexToRGB(colorIndex) {
  const ci = colorIndex ?? 0.65
  const t = Math.min(1, Math.max(0, (ci + 0.3) / 2.3))
  return {
    r: Math.round(100 + t * 155),
    g: Math.round(150 + t * 70),
    b: Math.round(255 - t * 200),
  }
}

/** Couleur d'étoile selon colorOverride (IR, UV, R) ou couleur réelle (visible) */
export function resolveStarColor(star, colorOverride) {
  const ci = star.color_index ?? 0.65
  if (colorOverride === 'IR') {
    const t = Math.min(1, Math.max(0, (ci ?? 1.0) / 2.0))
    return { r: 255, g: Math.round(120 - t * 80), b: Math.round(60 - t * 50) }
  }
  if (colorOverride === 'UV') {
    const t = Math.min(1, Math.max(0, (-(ci ?? 0) + 0.4) / 0.8))
    return { r: Math.round(180 + t * 75), g: Math.round(180 + t * 50), b: 255 }
  }
  if (colorOverride === 'R') {
    return { r: 255, g: Math.round(60 + (ci ?? 0.6) * 30), b: 40 }
  }
  return colorIndexToRGB(ci)
}

/** Étoiles pouvant apparaître dans au moins une bande (union des 4 filtres) */
export function getPoolForBandFilters(stars) {
  return stars.filter((star) => {
    const cls = getSpectralClass(star.spectral_type)
    const mag = star.apparent_magnitude ?? apparentMagnitudeFromDistance(star.spectral_type, star.distance) ?? 8
    if (cls === 'L' || cls === 'T' || cls === 'Y') {
      const mIR = apparentMagnitudeIRFromDistance(star.spectral_type, star.distance)
      return mIR <= 15
    }
    return mag <= 15
  })
}

/** Paramètres de rendu pour une étoile dans une bande — null si hors limite (pour filtrage) */
export function getStarBandParams(star, band) {
  const params = getStarBandParamsOrZero(star, band)
  if (params.opacity === 0) return null
  return params
}

/** Toujours retourne un objet — opacity 0 si hors limite (pour transition fluide) */
export function getStarBandParamsOrZero(star, band) {
  const cls = getSpectralClass(star.spectral_type)
  const mag = star.apparent_magnitude ?? apparentMagnitudeFromDistance(star.spectral_type, star.distance) ?? 8

  switch (band) {
    case 'ir': {
      const mIR = (cls === 'L' || cls === 'T' || cls === 'Y')
        ? apparentMagnitudeIRFromDistance(star.spectral_type, star.distance)
        : mag
      if (mIR > 15) return { opacity: 0, brightnessMultiplier: 0.5, colorOverride: null }
      const isWarm = COLD_STARS.includes(cls)
      return { opacity: isWarm ? 1.0 : 0.15, brightnessMultiplier: isWarm ? 1.2 : 0.5, colorOverride: isWarm ? 'IR' : null }
    }
    case 'uv': {
      if (mag > 12) return { opacity: 0, brightnessMultiplier: 0.5, colorOverride: null }
      const isHot = HOT_STARS.includes(cls) || WHITE_DWARF(star.spectral_type)
      return { opacity: isHot ? 1.0 : 0.15, brightnessMultiplier: isHot ? 1.2 : 0.5, colorOverride: isHot ? 'UV' : null }
    }
    case 'r': {
      if (mag > 12) return { opacity: 0, brightnessMultiplier: 1.0, colorOverride: null }
      const isCold = COLD_STARS.includes(cls)
      const isHot = HOT_STARS.includes(cls)
      return { opacity: 1.0, brightnessMultiplier: isCold ? 1.3 : isHot ? 0.7 : 1.0, colorOverride: 'R' }
    }
    default: {
      if (mag > 12 || cls === 'L' || cls === 'T' || cls === 'Y') return { opacity: 0, brightnessMultiplier: 1.0, colorOverride: null }
      return { opacity: 1.0, brightnessMultiplier: 1.0, colorOverride: null }
    }
  }
}

/**
 * Filtre les systèmes par bande spectrale — populations distinctes.
 * Retourne { star, opacity, brightnessMultiplier, colorOverride } ou null si hors limite.
 */
export function filterBySpectralBand(stars, band) {
  return stars
    .map((star) => {
      const params = getStarBandParams(star, band)
      if (!params) return null
      return { star, ...params }
    })
    .filter(Boolean)
}
