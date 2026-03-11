/**
 * Projection stéréographique — Ciel Observatoire
 * FOV 120°, conversion ra/dec ↔ coordonnées écran
 */

const RAD = Math.PI / 180
const FOV_DEG = 120
const FOV_HALF = FOV_DEG / 2

/** ra,dec (deg) → vecteur unitaire */
export function raDecToVector(ra, dec) {
  const d = (dec ?? 0) * RAD
  const r = ((ra ?? 0) % 360) * RAD
  const cd = Math.cos(d)
  return { x: cd * Math.cos(r), y: cd * Math.sin(r), z: Math.sin(d) }
}

/** Projette étoile (ra,dec) dans FOV 120° — vue (raView, decView), projection stéréographique */
export function projectStarInFov(ra, dec, raView, decView, w, h) {
  const S = raDecToVector(ra, dec)
  const V = raDecToVector(raView, decView)
  const dot = S.x * V.x + S.y * V.y + S.z * V.z
  const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)))
  const angleDeg = angleRad / RAD
  if (angleDeg > FOV_HALF) return null

  const worldUp = { x: 0, y: 0, z: 1 }
  let Rx = V.y * worldUp.z - V.z * worldUp.y
  let Ry = V.z * worldUp.x - V.x * worldUp.z
  let Rz = V.x * worldUp.y - V.y * worldUp.x
  const rLen = Math.hypot(Rx, Ry, Rz)
  if (rLen < 0.01) {
    Rx = 1
    Ry = 0
    Rz = 0
  } else {
    Rx /= rLen
    Ry /= rLen
    Rz /= rLen
  }
  let Ux = Ry * V.z - Rz * V.y
  let Uy = Rz * V.x - Rx * V.z
  let Uz = Rx * V.y - Ry * V.x
  const uLen = Math.hypot(Ux, Uy, Uz)
  Ux /= uLen
  Uy /= uLen
  Uz /= uLen

  const sx = S.x * Rx + S.y * Ry + S.z * Rz
  const sy = S.x * Ux + S.y * Uy + S.z * Uz
  const sinA = Math.sin(angleRad) || 0.001
  const scale = (Math.max(w, h) / 2) / (2 * Math.tan((FOV_HALF * RAD) / 2))
  const r = 2 * Math.tan(angleRad / 2) * scale
  return { x: w / 2 + (sx / sinA) * r, y: h / 2 - (sy / sinA) * r }
}

/** Projette une nébuleuse (ellipse ou polygone) en vertices écran — retourne path ou null si hors FOV */
export function projectNebulaShape(nebula, raView, decView, w, h) {
  const coords = nebula.coordinates || {}
  const ra0 = coords.ra ?? 0
  const dec0 = coords.dec ?? 0
  const params = nebula.shape_params || {}
  if (nebula.shape_type === 'ELLIPSE') {
    const semiMajor = params.semi_major_arcmin ?? 60
    const semiMinor = params.semi_minor_arcmin ?? 40
    const paDeg = params.position_angle_deg ?? 0
    const paRad = (paDeg * Math.PI) / 180
    const decRad = (dec0 * Math.PI) / 180
    const arcminToDeg = 1 / 60
    const vertices = []
    for (let i = 0; i <= 36; i++) {
      const theta = (i / 36) * Math.PI * 2
      const xArcmin = semiMajor * Math.cos(theta) * Math.cos(paRad) - semiMinor * Math.sin(theta) * Math.sin(paRad)
      const yArcmin = semiMajor * Math.cos(theta) * Math.sin(paRad) + semiMinor * Math.sin(theta) * Math.cos(paRad)
      const dra = (xArcmin * arcminToDeg) / Math.max(0.01, Math.cos(decRad))
      const ddec = yArcmin * arcminToDeg
      const pos = projectStarInFov(ra0 + dra, dec0 + ddec, raView, decView, w, h)
      if (pos) vertices.push(pos)
    }
    return vertices.length > 3 ? vertices : null
  }
  if (nebula.shape_type === 'POLYGON') {
    const verts = params.vertices || []
    const decRad = (dec0 * Math.PI) / 180
    const arcminToDeg = 1 / 60
    const positions = verts.map((v) => {
      const dra = ((v.dra_arcmin ?? 0) * arcminToDeg) / Math.max(0.01, Math.cos(decRad))
      const ddec = (v.ddec_arcmin ?? 0) * arcminToDeg
      return projectStarInFov(ra0 + dra, dec0 + ddec, raView, decView, w, h)
    })
    if (positions.every((p) => p)) return positions
    return null
  }
  return null
}

/** Position d'un signal sur le bord du ciel (azimuth en degrés) */
export function signalPosition(azimuthDeg, w, h) {
  const r = Math.min(w, h) * 0.45
  const rad = (azimuthDeg * Math.PI) / 180
  return {
    x: w / 2 + r * Math.sin(rad),
    y: h / 2 - r * Math.cos(rad),
  }
}

export { FOV_DEG, FOV_HALF, RAD }
