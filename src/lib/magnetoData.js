/**
 * Génération de données pour le Magnétomètre
 * Carte du champ magnétique, profils, intensité × position
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md §4.11, §5 — Terre, Mars (champ absent)
 */
import { seedFromObsId } from './spectrogramData'
import { seededRandom } from './random'

const GRID_SIZE = 24
const BASE_INTENSITY = 40000 // nT — ordre de grandeur Terre (25–65 µT = 25000–65000 nT)

/**
 * Génère les données magnétométriques
 * @param {Object} opts
 * @param {string} [opts.obsId] - ID observation (seed)
 * @param {string} [opts.systemId] - ID système
 * @param {number} [opts.fiability] - 0–100, bruit
 * @param {boolean} [opts.anomalous] - champ absent, anomalie locale, orientation atypique
 * @returns {{ grid: number[][], min: number, max: number, profile: Array<[number,number]>, params: { dipoleTilt: number, Bmax: number } }}
 */
export function generateMagnetoData(opts = {}) {
  const { obsId = '', systemId = '', fiability = 80, anomalous = false } = opts
  const seed = seedFromObsId(String(obsId) + String(systemId))
  const rng = seededRandom(seed)

  const noiseLevel = Math.max(0.02, (1 - fiability / 100) * 0.25)

  let grid = []
  let dipoleTilt = 5 + rng() * 15
  let Bmax = BASE_INTENSITY * (0.6 + rng() * 0.8)

  if (anomalous) {
    const mode = seed % 3
    if (mode === 0) {
      // Champ absent (Mars-like — atmosphère érodée)
      Bmax = 50 + rng() * 150
      for (let i = 0; i < GRID_SIZE; i++) {
        const row = []
        for (let j = 0; j < GRID_SIZE; j++) {
          const v = Bmax * 0.3 + (rng() - 0.5) * Bmax
          row.push(Math.max(0, v))
        }
        grid.push(row)
      }
    } else if (mode === 1) {
      // Anomalie locale (structure sous-surfacique, matériau atypique)
      const ax = 0.3 + rng() * 0.4
      const ay = 0.3 + rng() * 0.4
      for (let i = 0; i < GRID_SIZE; i++) {
        const row = []
        for (let j = 0; j < GRID_SIZE; j++) {
          const nx = i / GRID_SIZE
          const ny = j / GRID_SIZE
          const d = Math.hypot(nx - ax, ny - ay)
          let v = BASE_INTENSITY * (0.4 - 0.2 * (nx * nx + ny * ny))
          v += 25000 * Math.exp(-d * d * 12)
          v += (rng() - 0.5) * noiseLevel * BASE_INTENSITY
          row.push(Math.max(0, v))
        }
        grid.push(row)
      }
    } else {
      // Orientation atypique (dipôle fortement incliné, multipôle)
      dipoleTilt = 60 + rng() * 35
      const tiltRad = (dipoleTilt * Math.PI) / 180
      for (let i = 0; i < GRID_SIZE; i++) {
        const row = []
        for (let j = 0; j < GRID_SIZE; j++) {
          const nx = (i / GRID_SIZE) * 2 - 1
          const ny = (j / GRID_SIZE) * 2 - 1
          const proj = nx * Math.sin(tiltRad) + ny * Math.cos(tiltRad)
          let v = BASE_INTENSITY * (0.5 + 0.5 * proj) + (rng() - 0.5) * noiseLevel * BASE_INTENSITY
          v = Math.max(0, v)
          row.push(v)
        }
        grid.push(row)
      }
    }
  } else {
    // Champ dipolaire typique (pôles plus intenses)
    for (let i = 0; i < GRID_SIZE; i++) {
      const row = []
      for (let j = 0; j < GRID_SIZE; j++) {
        const nx = (i / GRID_SIZE) * 2 - 1
        const ny = (j / GRID_SIZE) * 2 - 1
        const r = Math.sqrt(nx * nx + ny * ny) || 0.01
        const colat = Math.acos(Math.max(-1, Math.min(1, ny / r)))
        const tiltRad = (dipoleTilt * Math.PI) / 180
        const B = (Bmax / (r * r + 0.3)) * Math.sqrt(1 + 3 * Math.cos(colat + tiltRad) ** 2)
        let v = B * 0.3 + (rng() - 0.5) * noiseLevel * Bmax
        v = Math.max(0, Math.min(Bmax * 1.2, v))
        row.push(v)
      }
      grid.push(row)
    }
  }

  const flat = grid.flat()
  const min = Math.min(...flat)
  const max = Math.max(...flat)

  const mid = Math.floor(GRID_SIZE / 2)
  const profile = grid[mid].map((v, j) => [j / GRID_SIZE, v])

  return {
    grid,
    min,
    max,
    profile,
    params: { dipoleTilt: Math.round(dipoleTilt), Bmax: Math.round(max) },
  }
}

/** Champ magnétique (nT) → chaîne affichable "X nT" ou "X.X µT" */
export function formatB(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)} µT`
  return `${Math.round(n)} nT`
}
