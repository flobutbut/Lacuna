/**
 * Génération de données pour le Scanner morphologique
 * Modèle de surface (forme), carte thermique — Oumuamua, Ryugu, Bennu
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md §4.10, §5
 */
import { seedFromObsId } from './spectrogramData'
import { seededRandom } from './random'

const THERMAL_GRID_SIZE = 24

/**
 * Génère les données morphologiques (forme + thermique)
 * @param {Object} opts
 * @param {string} [opts.obsId] - ID observation (seed)
 * @param {string} [opts.systemId] - ID système
 * @param {number} [opts.fiability] - 0–100, bruit
 * @param {boolean} [opts.anomalous] - forme allongée (Oumuamua), facettes planes, gradient thermique anormal
 * @returns {{ shape: { type: string, aspectRatio: number, facets?: number }, thermal: { grid: number[][], min: number, max: number }, params: { elongation: string, symetrie: string } }}
 */
export function generateMorphoData(opts = {}) {
  const { obsId = '', systemId = '', fiability = 80, anomalous = false } = opts
  const seed = seedFromObsId(String(obsId) + String(systemId))
  const rng = seededRandom(seed)

  const noiseLevel = Math.max(0.02, (1 - fiability / 100) * 0.15)

  let shape
  let params

  if (anomalous) {
    const mode = seed % 3
    if (mode === 0) {
      // Forme allongée type Oumuamua (rapport 1:5 à 1:10)
      const ratio = 4 + rng() * 6
      shape = { type: 'elongated', aspectRatio: ratio }
      params = { elongation: `${(1 / ratio).toFixed(2)} (L/l)`, symetrie: 'axiale' }
    } else if (mode === 1) {
      // Forme facettée (symétries régulières — géométrie non naturelle)
      const facets = [6, 8][seed % 2]
      shape = { type: 'faceted', facets, aspectRatio: 1.1 + rng() * 0.3 }
      params = { elongation: '~1', symetrie: `${facets} faces` }
    } else {
      // Asymétrie marquée + faces planes
      shape = { type: 'irregular', aspectRatio: 2 + rng() * 2 }
      params = { elongation: `${(1 / shape.aspectRatio).toFixed(2)}`, symetrie: 'faible' }
    }
  } else {
    // Forme quasi sphérique (astéroïde typique)
    shape = { type: 'spheroid', aspectRatio: 1 + rng() * 0.4 }
    params = { elongation: '~1', symetrie: 'irrégulière' }
  }

  // Carte thermique (température de surface en K, vue projetée)
  const grid = []
  const sunDir = anomalous && seed % 5 === 2 ? 0.7 : 0.3 // anomalie : gradient décalé
  for (let i = 0; i < THERMAL_GRID_SIZE; i++) {
    const row = []
    for (let j = 0; j < THERMAL_GRID_SIZE; j++) {
      const nx = (i / THERMAL_GRID_SIZE) * 2 - 1
      const ny = (j / THERMAL_GRID_SIZE) * 2 - 1
      // Gradient soleil / ombre (face éclairée plus chaude)
      let T = 150 + 120 * (sunDir + 0.5 * nx + 0.3 * ny)
      T += (rng() - 0.5) * noiseLevel * 80
      if (anomalous && seed % 7 === 3) {
        // Hotspot non aligné (source interne ?)
        const hx = 0.5 * (rng() * 2 - 1)
        const hy = 0.4 * (rng() * 2 - 1)
        const d = Math.hypot(nx - hx, ny - hy)
        T += 80 * Math.exp(-d * d * 4)
      }
      T = Math.max(100, Math.min(400, T))
      row.push(T)
    }
    grid.push(row)
  }

  const flat = grid.flat()
  return {
    shape,
    thermal: { grid, min: Math.min(...flat), max: Math.max(...flat) },
    params,
  }
}

/**
 * Objet shape (type, aspectRatio, facets) → attribut d d'un path SVG.
 * @param {object} shape - { type: 'elongated'|'irregular'|'faceted'|'spheroid', aspectRatio: number, facets?: number }
 * @param {number} [shapeSize=180] - Taille du canvas en px
 * @returns {string}
 */
export function getShapePath(shape, shapeSize = 180) {
  const cx = shapeSize / 2
  const cy = shapeSize / 2
  const r = Math.min(cx, cy) - 8
  if (shape.type === 'elongated' || shape.type === 'irregular') {
    const ratio = shape.aspectRatio
    const rx = r
    const ry = Math.max(4, r / ratio)
    return `M ${cx - rx},${cy} A ${rx},${ry} 0 0 1 ${cx + rx},${cy} A ${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`
  }
  if (shape.type === 'faceted') {
    const n = shape.facets || 6
    const points = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2
      points.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`)
    }
    return `M ${points.join(' L ')} Z`
  }
  const rx = r * (0.9 + (shape.aspectRatio - 1) * 0.3)
  const ry = r * 1.1
  return `M ${cx - rx},${cy} A ${rx},${ry} 0 0 1 ${cx + rx},${cy} A ${rx},${ry} 0 0 1 ${cx - rx},${cy} Z`
}
