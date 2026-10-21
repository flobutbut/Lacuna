/**
 * Génération de données pour l'Analyseur orbital
 * Diagramme orbital (vue plan) + paramètres a, e, i, période
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md §4.7, §5
 */
import { semiMajorAxisFromPeriod } from './orbitalUtils'
import { seededRandom } from './random'

/** Label par défaut des planètes */
const DEFAULT_LABELS = ['b', 'c', 'd', 'e', 'f', 'g', 'h']

/** Hash simple pour obsId / systemId → seed */
function seedFromIds(obsId, systemId) {
  let h = 0
  const s = String(obsId || '') + String(systemId || '')
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h) >>> 0
}

/**
 * Génère les points d'une ellipse Keplerienne (vue plan, étoile au foyer)
 * x = a*(cos(E) - e), y = a*sqrt(1-e²)*sin(E)
 */
function ellipsePoints(a, e, nPoints = 64) {
  if (!a || a <= 0) return []
  const b = a * Math.sqrt(Math.max(0, 1 - e * e))
  const points = []
  for (let i = 0; i <= nPoints; i++) {
    const E = (i / nPoints) * 2 * Math.PI
    const x = a * (Math.cos(E) - e)
    const y = b * Math.sin(E)
    points.push([x, y])
  }
  return points
}

/**
 * Convertit des system_objects en orbites pour le diagramme
 */
function systemObjectsToOrbits(objects) {
  const orbits = []
  const planetaryTypes = ['PLANET', 'MOON', 'MINOR_BODY']
  for (const obj of objects || []) {
    if (!planetaryTypes.includes(obj.type)) continue
    const a =
      obj.orbital_semi_major_axis_au != null
        ? Number(obj.orbital_semi_major_axis_au)
        : obj.orbital_period_days != null
          ? semiMajorAxisFromPeriod(obj.orbital_period_days)
          : null
    if (!a || a <= 0) continue
    const e = Math.min(0.99, Math.max(0, Number(obj.orbital_eccentricity) || 0))
    const i = Number(obj.orbital_inclination_deg) || 0
    const period = obj.orbital_period_days != null ? Number(obj.orbital_period_days) : null
    const label = obj.designation || obj.name || `P${orbits.length + 1}`
    orbits.push({
      label,
      a,
      e,
      i,
      period,
      name: obj.name,
      inHz: obj.in_habitable_zone ?? false,
      path: ellipsePoints(a, e),
    })
  }
  const sorted = orbits.sort((p, q) => p.a - q.a)
  sorted.forEach((o, i) => { o.phase = (2 * Math.PI * i) / Math.max(1, sorted.length) })
  return sorted
}

/**
 * Génère des orbites synthétiques à partir d'un seed (fallback sans system_objects)
 */
function generateSynthOrbits(seed) {
  const rng = seededRandom(seed)
  const nOrbits = 3 + (seed % 4)
  const orbits = []
  let aBase = 0.1 + rng() * 0.3
  for (let i = 0; i < nOrbits; i++) {
    aBase *= 1.8 + rng() * 1.2
    const a = Math.min(40, aBase)
    const e = Math.min(0.4, rng() * 0.35)
    const i = rng() * 5
    const period = Math.pow(a, 1.5) * 365.25
    const label = DEFAULT_LABELS[i] || `P${i + 1}`
    orbits.push({
      label,
      a,
      e,
      i,
      period,
      name: label,
      inHz: false,
      path: ellipsePoints(a, e),
      phase: (2 * Math.PI * i) / nOrbits,
    })
  }
  return orbits
}

/**
 * Détecte les résonances orbitales (rapports de périodes proches de fractions simples)
 */
function detectResonances(orbits) {
  const res = []
  const periods = orbits.map((o) => o.period).filter(Boolean)
  for (let i = 0; i < periods.length - 1; i++) {
    for (let j = i + 1; j < periods.length; j++) {
      const ratio = periods[j] / periods[i]
      const targets = [2, 3, 4, 1 / 2, 1 / 3, 1 / 4, 2 / 3, 3 / 2]
      for (const t of targets) {
        if (Math.abs(ratio - t) < 0.08) {
          res.push({
            inner: orbits[i].label,
            outer: orbits[j].label,
            ratio: `~${ratio.toFixed(2)}`,
            target: t,
          })
        }
      }
    }
  }
  return res
}

/**
 * Génère les données pour le rapport Analyseur orbital
 * @param {Object} opts
 * @param {string} [opts.obsId] - ID observation (seed fallback)
 * @param {string} [opts.systemId] - ID système (pour system_objects)
 * @param {Array} [opts.systemObjects] - Objets du système (prioritaire)
 * @param {number} [opts.fiability] - 0–100, impacte le bruit
 * @param {boolean} [opts.anomalous] - Résonances suspectes, accélération résiduelle
 */
export function generateOrbitalData(opts = {}) {
  const { obsId, systemId, systemObjects, fiability = 80, anomalous = false } = opts

  let orbits =
    systemObjects?.length > 0
      ? systemObjectsToOrbits(systemObjects)
      : generateSynthOrbits(seedFromIds(obsId, systemId))

  if (orbits.length === 0) {
    orbits = generateSynthOrbits(seedFromIds(obsId, systemId))
  }

  const resonances = anomalous ? detectResonances(orbits) : []
  if (anomalous && resonances.length === 0 && orbits.length >= 2) {
    resonances.push({
      inner: orbits[0].label,
      outer: orbits[1].label,
      ratio: '~2.0',
      target: 2,
    })
  }

  const residualAcceleration =
    anomalous && fiability < 85 ? 2.3e-5 + (100 - fiability) * 1e-6 : null

  return {
    orbits,
    resonances,
    residualAcceleration,
  }
}
