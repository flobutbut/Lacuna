/**
 * Buffer circulaire de colonnes spectro (même source que RadarView).
 * Instancié une fois dans PageObservatoire ; RadarView écrit, RadarMiniature lit.
 */
export function useRadarColumnBuffer() {
  return {
    columnBuffer: null,
    columnBufferReady: false,
    specMaxVal: 1e-6,
    writeCol: 0,
  }
}
