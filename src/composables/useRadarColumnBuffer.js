/**
 * Buffer circulaire de colonnes spectro (même source que RadarView).
 * Instancié une fois dans PageObservatoire ; RadarView écrit, RadarMiniature lit.
 * Chaque colonne garde ses magnitudes brutes ({ magnitudes: Float32Array }) : la mise à l'échelle dB se fait au dessin.
 * Créé une seule fois et jamais vidé : un redimensionnement de canvas ne touche pas aux données.
 * @param {number} historySize - Nombre de colonnes conservées (une par tick d'acquisition)
 */
export function useRadarColumnBuffer(historySize = 7200) {
  return {
    columnBuffer: new Array(historySize).fill(null),
    columnBufferReady: true,
    writeCol: 0,
    /** Colonnes écrites depuis le début (croît sans repli) */
    count: 0,
  }
}
