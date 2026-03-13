/**
 * Génération de données synthétiques pour l'Analyseur gravimétrique
 * Modèle de sources (masses déduites, positions) + courbe des perturbations résiduelles
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md §4.5, §5
 */
import { seedFromObsId } from './spectrogramData'

/**
 * Générateur pseudo-aléatoire déterministe (mulberry32)
 */
function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function parseStructure(s) {
  const str = (s ?? '').toLowerCase()
  if (/sursaut|burst/.test(str)) return 'sursaut'
  if (/pulsé|périodique|continu/.test(str)) return 'pulse'
  return 'non-uniforme'
}

/**
 * Génère les données pour le rapport gravimétrique
 * @param {Object} opts
 * @param {string} [opts.obsId] - ID observation pour reproductibilité
 * @param {number} [opts.fiability] - Fiabilité 0–100 (affecte le bruit des résidus)
 * @param {number} [opts.durationSec] - Durée du signal analysé (s)
 * @param {boolean} [opts.anomalous] - Anomalie : résidus structurés (perturbation sans source)
 * @param {string} [opts.structure] - Structure du signal (sursaut, pulsé, non uniforme)
 * @param {string} [opts.obsType] - SIGNAL ou PLANETE/MINEUR/OBJET (données orbitales)
 * @returns {{ sources: Array<{label:string, massSolar:number, x:number, y:number}>, residuals: Array<[number,number]>, distanceMpc?: number }}
 */
export function generateGravimetriqueData(opts = {}) {
  const obsId = opts.obsId ?? ''
  const fiability = opts.fiability ?? 80
  const durationSec = Math.min(opts.durationSec ?? 72, 60)
  const anomalous = opts.anomalous ?? false
  const structure = parseStructure(opts.structure)
  const obsType = opts.obsType ?? 'SIGNAL'

  const seed = seedFromObsId(obsId)
  const rng = seededRandom(seed)

  const noiseLevel = Math.max(0.05, 0.6 - (fiability / 100) * 0.5)

  // Modèle de sources — binaire compact (fusion) ou système multi-corps
  let sources
  if (obsType !== 'SIGNAL' && ['PLANETE', 'MINEUR', 'OBJET', 'ETOILE'].includes(obsType)) {
    // Données orbitales : étoile centrale + corps déduits
    const nPlanets = 1 + (seed % 3)
    sources = [{ label: 'Étoile', massSolar: 0.8 + rng() * 0.6, x: 0.5, y: 0.5 }]
    for (let i = 0; i < nPlanets; i++) {
      const angle = (i / nPlanets) * Math.PI * 2 + rng() * 0.5
      const r = 0.12 + 0.2 * (i + 1) + rng() * 0.08
      sources.push({
        label: `Corps ${i + 1}`,
        massSolar: 0.001 + rng() * 0.05,
        x: 0.5 + r * Math.cos(angle),
        y: 0.5 + r * Math.sin(angle),
      })
    }
  } else {
    // Signal gravitationnel : binaire compact (fusion)
    const m1 = 10 + (seed % 30)
    const m2 = 8 + (seed % 25)
    const sep = 0.2 + rng() * 0.15
    sources = [
      { label: `${m1} M☉`, massSolar: m1, x: 0.5 - sep, y: 0.5 },
      { label: `${m2} M☉`, massSolar: m2, x: 0.5 + sep, y: 0.5 },
    ]
    if (anomalous && seed % 3 === 1) {
      // Corps invisible — perturbation sans source identifiée
      sources.push({
        label: '?',
        massSolar: 0.5 + rng() * 2,
        x: 0.5 + (rng() - 0.5) * 0.4,
        y: 0.3 + rng() * 0.4,
      })
    }
  }

  // Courbe des perturbations résiduelles (observed - model) vs temps
  const nPoints = Math.min(200, Math.floor(durationSec * 4))
  const residuals = []
  const dt = durationSec / nPoints

  for (let i = 0; i < nPoints; i++) {
    const t = i * dt
    let r = (rng() - 0.5) * 2 * noiseLevel

    if (anomalous && structure === 'sursaut') {
      // Pic résiduel non expliqué — perturbation sans source
      const tAnomaly = durationSec * (0.4 + (seed % 30) / 100)
      const width = durationSec * 0.08
      const gauss = Math.exp(-((t - tAnomaly) ** 2) / (2 * width * width))
      r += 0.15 * gauss
    }
    if (anomalous && structure === 'non-uniforme' && seed % 5 === 2) {
      // Train d'oscillations résiduelles
      r += 0.08 * Math.sin(t * 12 + seed) * Math.exp(-t * 0.1)
    }

    residuals.push([t, r])
  }

  const out = { sources, residuals }
  if (obsType === 'SIGNAL') {
    out.distanceMpc = 100 + (seed % 800)
  }
  return out
}
