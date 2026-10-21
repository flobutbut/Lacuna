/**
 * Buffer circulaire de colonnes spectro (même source que RadarView).
 * Instancié une fois dans PageObservatoire ; RadarView écrit, RadarMiniature lit.
 * Créé une seule fois et jamais vidé : un redimensionnement de canvas ne touche pas aux données.
 * @param {number} historySize - Nombre de colonnes conservées (une par tick d'acquisition)
 */
export function useRadarColumnBuffer(historySize = 7200) {
  return {
    columnBuffer: new Array(historySize).fill(null),
    columnBufferReady: true,
    specMaxVal: 1e-6,
    writeCol: 0,
    /** Colonnes écrites depuis le début (croît sans repli) */
    count: 0,
  }
}
