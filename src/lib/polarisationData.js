/**
 * Génération de données pour l'Analyseur de polarisation
 * État de polarisation : angle, ellipticité, degré.
 * Déterministe via seed (obsId).
 */
import { seedFromObsId } from './spectrogramData'

/**
 * Génère les paramètres de polarisation pour un signal.
 * @param {Object} opts
 * @param {string} opts.obsId - ID observation (détermine le seed)
 * @param {number} opts.fiability - Fiabilité 0-100 (ajoute du bruit sur les paramètres)
 * @param {boolean} opts.anomalous - Signal artificiel : polarisation linéaire, degré élevé (contrôlée)
 * @returns {{ angle: number, ellipticity: number, degree: number, stokes: { I: number, Q: number, U: number, V: number } }}
 */
export function generatePolarisationData(opts = {}) {
  const seed = seedFromObsId(opts.obsId ?? '')
  const fiability = Math.max(0, Math.min(100, opts.fiability ?? 80))
  const anomalous = opts.anomalous ?? false

  const rng = seededRandom(seed)
  const rng2 = seededRandom(seed + 1)
  const rng3 = seededRandom(seed + 2)

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

function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
