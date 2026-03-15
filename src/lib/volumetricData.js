/**
 * Génération de données pour l'Analyseur volumétrique
 * Cartes de densité 2D, coupes, gradients — tomographie / cartographie radar
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md §4.9, §5 — Magellan/Vénus, structures internes
 */
import { seedFromObsId } from './spectrogramData'

function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const GRID_SIZE = 28

/**
 * Génère une carte de densité 2D
 * @param {Object} opts
 * @param {string} [opts.obsId] - ID observation (seed)
 * @param {string} [opts.systemId] - ID système
 * @param {number} [opts.fiability] - 0–100, bruit
 * @param {boolean} [opts.anomalous] - surconcentration, déplétion ou asymétrie
 * @returns {{ grid: number[][], min: number, max: number, cutX: number[], cutY: number[], labels: { x: string, y: string } }}
 */
export function generateVolumetricData(opts = {}) {
  const { obsId = '', systemId = '', fiability = 80, anomalous = false } = opts
  const seed = seedFromObsId(String(obsId) + String(systemId))
  const rng = seededRandom(seed)

  const noiseLevel = Math.max(0.03, (1 - fiability / 100) * 0.2)
  const grid = []

  for (let i = 0; i < GRID_SIZE; i++) {
    const row = []
    for (let j = 0; j < GRID_SIZE; j++) {
      const nx = (i / GRID_SIZE) * 2 - 1
      const ny = (j / GRID_SIZE) * 2 - 1
      // Base : gradient radial léger (centre un peu plus dense)
      let v = 0.5 - 0.15 * (nx * nx + ny * ny)
      v += (rng() - 0.5) * noiseLevel * 2
      v += (rng() - 0.5) * 0.08

      if (anomalous) {
        const mode = seed % 4
        if (mode === 0) {
          // Surconcentration localisée (hotspot)
          const hx = 0.3 * (rng() * 2 - 1)
          const hy = 0.2 * (rng() * 2 - 1)
          const d = Math.hypot(nx - hx, ny - hy)
          v += 0.4 * Math.exp(-d * d * 8)
        } else if (mode === 1) {
          // Zone de déplétion
          const dx = 0.4 * (rng() * 2 - 1)
          const dy = 0.3 * (rng() * 2 - 1)
          const d = Math.hypot(nx - dx, ny - dy)
          v -= 0.35 * Math.exp(-d * d * 6)
        } else if (mode === 2) {
          // Asymétrie (gradient fort)
          v += 0.25 * nx * (rng() * 0.5 + 0.5)
        } else {
          // Structure en couches (bandes)
          v += 0.2 * Math.sin(nx * 5 + rng() * 2) * Math.cos(ny * 4)
        }
      }

      v = Math.max(0.05, Math.min(1, v))
      row.push(v)
    }
    grid.push(row)
  }

  const flat = grid.flat()
  const min = Math.min(...flat)
  const max = Math.max(...flat)

  // Coupes (profils horizontaux et verticaux au centre)
  const mid = Math.floor(GRID_SIZE / 2)
  const cutX = grid[mid].map((_, j) => [j / GRID_SIZE, grid[mid][j]])
  const cutY = grid.map((row, i) => [i / GRID_SIZE, row[mid]])

  return {
    grid,
    min,
    max,
    cutX,
    cutY,
    labels: { x: 'Position relative', y: 'Densité (u.a.)' },
  }
}
