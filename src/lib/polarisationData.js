/**
 * Génération de données pour l'Analyseur de polarisation
 * État de polarisation : angle, ellipticité, degré.
 * Déterministe via seed (obsId).
 */
import { seedFromObsId } from './spectrogramData'
import { seededRandom } from './random'

/**
 * Génère les paramètres de polarisation pour un signal.
 * @param {Object} opts
 * @param {string} opts.obsId - ID observation (détermine le seed)
 * @param {number} opts.fiability - Fiabilité 0-100 (ajoute du bruit sur les paramètres)
 * @param {boolean} opts.anomalous - Signal artificiel : polarisation linéaire, degré élevé (contrôlée)
 * @param {string|null} opts.polarization - Polarisation mesurée du signal (ex. « circulaire gauche ») : si elle
 *   est circulaire, l'ellipse est un cercle et V porte le sens (convention de jeu : V < 0 = gauche, V > 0 = droite)
 * @returns {{ angle: number, ellipticity: number, degree: number, stokes: { I: number, Q: number, U: number, V: number } }}
 */
export function generatePolarisationData(opts = {}) {
  const seed = seedFromObsId(opts.obsId ?? '')
  const fiability = Math.max(0, Math.min(100, opts.fiability ?? 80))
  const anomalous = opts.anomalous ?? false

  const rng = seededRandom(seed)
  const rng2 = seededRandom(seed + 1)
  const rng3 = seededRandom(seed + 2)

  const handedness = circularHandedness(opts.polarization)
  if (handedness) {
    const degree = 0.9 + rng3() * 0.09
    const noise = (1 - fiability / 100) * 0.05
    const d = Math.max(0.1, Math.min(1, degree + (rng() - 0.5) * noise))
    return {
      angle: 0,
      ellipticity: handedness,
      degree: d,
      stokes: { I: 1, Q: 0, U: 0, V: handedness * d },
    }
  }

  let angle, ellipticity, degree

  if (anomalous) {
    angle = (rng() * Math.PI) / 2
    ellipticity = 0
    degree = 0.95 + rng2() * 0.04
  } else {
  const mode = seed % 7
  if (mode === 0) {
    angle = (rng() * Math.PI) / 2
    ellipticity = 0
    degree = 0.85 + rng2() * 0.12
  } else if (mode === 1 || mode === 2) {
    angle = (rng() * Math.PI)
    ellipticity = (rng2() - 0.5) * 0.3
    degree = 0.7 + rng3() * 0.25
  } else if (mode === 3 || mode === 4) {
    angle = (rng() * Math.PI)
    ellipticity = 0.6 + rng2() * 0.35
    degree = 0.75 + rng3() * 0.2
  } else {
    angle = (rng() * Math.PI)
    ellipticity = (rng2() - 0.5) * 2
    degree = 0.5 + rng3() * 0.4
  }
  }

  const noise = anomalous ? 0.02 : (1 - fiability / 100) * 0.15
  angle += (rng() - 0.5) * noise * Math.PI
  ellipticity += (rng2() - 0.5) * noise
  degree = Math.max(0.1, Math.min(1, degree + (rng3() - 0.5) * noise))

  const stokes = stokesFromEllipse(angle, ellipticity, degree)
  return { angle, ellipticity, degree, stokes }
}

/** Sens d'une polarisation circulaire : -1 gauche, +1 droite, null si le signal n'est pas circulaire à sens connu */
export function circularHandedness(polarization) {
  const p = String(polarization ?? '').toLowerCase()
  if (!p.includes('circulaire')) return null
  if (p.includes('gauche')) return -1
  if (p.includes('droite')) return 1
  return null
}

function stokesFromEllipse(angle, ellipticity, degree) {
  const I = 1
  const p = degree
  const chi = Math.atan(ellipticity) * 0.5
  const psi = angle
  const Q = p * I * Math.cos(2 * chi) * Math.cos(2 * psi)
  const U = p * I * Math.cos(2 * chi) * Math.sin(2 * psi)
  const V = p * I * Math.sin(2 * chi)
  return { I, Q, U, V }
}

