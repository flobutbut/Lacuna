/**
 * Filtrage spectral — indices de couleur et magnitude par bande (UBVRI)
 * Réf. Johnson-Cousins, Pecaut & Mamajek
 */

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

/**
 * Filtre les systèmes par magnitude dans la bande sélectionnée.
 * @param {Array} systems - [{ apparent_magnitude?, spectral_type, distance, ... }]
 * @param {string} band
 * @param {number} limit - magnitude max (défaut 12)
 */
export function filterBySpectralBand(systems, band, limit = 12) {
  const letter = (s) => (s.spectral_type || '').toUpperCase()[0]
  const isBrownDwarf = (s) => ['L', 'T', 'Y'].includes(letter(s))
  if (band === 'ir') {
    return systems.filter((s) => {
      if (isBrownDwarf(s)) {
        const mIR = apparentMagnitudeIRFromDistance(s.spectral_type, s.distance)
        return mIR <= limit
      }
      const mVis = s.apparent_magnitude ?? apparentMagnitudeFromDistance(s.spectral_type, s.distance)
      const mBand = magnitudeInBand(mVis, s.spectral_type, band)
      return mBand <= limit
    })
  }
  return systems.filter((s) => {
    if (isBrownDwarf(s)) return false
    const mVis = s.apparent_magnitude ?? apparentMagnitudeFromDistance(s.spectral_type, s.distance)
    const mBand = magnitudeInBand(mVis, s.spectral_type, band)
    return mBand <= limit
  })
}
