/**
 * Écarts du Laboratoire — LACUNA
 * Un écart est la différence entre ce qu'un modèle prédit pour un objet et ce que l'instrument mesure.
 * Les écarts sont déterminés par l'objet (même objet → mêmes écarts pour tous les vaisseaux),
 * jamais tirés à chaque analyse. Réf. LACUNA_VERDICT.md §4.
 */
import { seededRandom } from '@/lib/random'
import { seedFromObsId } from '@/lib/spectrogramData'
import { LAB_INSTRUMENTS, NIVEAU_ORDER, getBodyType, getInstrumentsForObservation } from '@/constants/lab'

/** Familles d'écart et instruments capables de les relever — LACUNA_LABORATOIRE_INSTRUMENTS.md §8 */
export const DEVIATION_FAMILIES = {
  ELECTROMAGNETIQUE: { label: 'Électromagnétique', instruments: ['analyseur-spectral', 'analyseur-polarisation', 'analyseur-spectre-energetique', 'spectro-stellaire'] },
  ORBITALE: { label: 'Orbitale', instruments: ['analyseur-orbital', 'analyseur-gravimetrique'] },
  CHIMIQUE: { label: 'Chimique', instruments: ['spectro-atmo', 'spectro-contact', 'analyseur-echantillon'] },
  MORPHOLOGIQUE: { label: 'Morphologique', instruments: ['scanner-morpho', 'analyseur-vol', 'magnetometre'] },
  THERMIQUE: { label: 'Thermique', instruments: ['scanner-morpho', 'spectro-atmo'] },
  TEMPORELLE: { label: 'Temporelle', instruments: ['analyseur-structure-temporelle', 'analyseur-neutrinos'] },
  GRAVITATIONNELLE: { label: 'Gravitationnelle', instruments: ['analyseur-gravimetrique', 'analyseur-orbital'] },
  ABSENCE: { label: 'Absence', instruments: ['analyseur-orbital', 'analyseur-vol', 'spectro-stellaire', 'magnetometre'] },
}

/** Familles possibles par type de corps (les signaux suivent leur support) */
const BODY_FAMILIES = {
  PLANETE: ['ORBITALE', 'GRAVITATIONNELLE', 'CHIMIQUE', 'MORPHOLOGIQUE', 'THERMIQUE', 'ABSENCE'],
  ETOILE: ['ELECTROMAGNETIQUE', 'ORBITALE', 'GRAVITATIONNELLE', 'ABSENCE'],
  ATMOSPHERE: ['CHIMIQUE', 'THERMIQUE'],
  MINEUR: ['ORBITALE', 'GRAVITATIONNELLE', 'MORPHOLOGIQUE', 'ABSENCE'],
  OBJET: ['ORBITALE', 'GRAVITATIONNELLE', 'MORPHOLOGIQUE', 'CHIMIQUE', 'THERMIQUE'],
}
const SIGNAL_FAMILIES = ['ELECTROMAGNETIQUE', 'TEMPORELLE', 'GRAVITATIONNELLE']

/** Part des corps qui portent un écart réel (à calibrer — LACUNA_VERDICT.md §11) */
export const BODY_DEVIATION_RATE = 0.12
/** Part des objets qui portent un écart parasite, visible seulement sur un rapport peu fiable */
export const SPURIOUS_DEVIATION_RATE = 0.3
/** Fiabilité en dessous de laquelle un écart parasite peut apparaître (§4.6) */
export const SPURIOUS_MAX_FIABILITY = 60

const NIVEAU_KEYS = Object.keys(NIVEAU_ORDER)

function fmt(n, digits = 1) {
  return n.toFixed(digits).replace('.', ',')
}

function between(rnd, min, max) {
  return min + rnd() * (max - min)
}

/**
 * Gabarits d'écart par famille. `types` et `instruments` restreignent le gabarit ;
 * `make` renvoie l'attendu et le mesuré, chiffrés par la graine de l'objet.
 */
const TEMPLATES = {
  ELECTROMAGNETIQUE: [
    { label: 'Structure non aléatoire dans le bruit de fond', make: (r) => ({ expected: 'bruit blanc (entropie 1,00)', measured: `entropie ${fmt(between(r, 0.62, 0.9), 2)}` }) },
    { label: 'Raie étroite hors de toute transition connue', instruments: ['analyseur-spectral', 'spectro-stellaire'], make: (r) => ({ expected: 'aucune raie', measured: `${fmt(between(r, 900, 1700), 1)} MHz, largeur < 1 Hz` }) },
    { label: 'Polarisation circulaire inattendue', instruments: ['analyseur-polarisation'], make: (r) => ({ expected: 'V/I < 1 %', measured: `V/I = ${Math.round(between(r, 12, 40))} %` }) },
    { label: 'Excès de flux à haute énergie', instruments: ['analyseur-spectre-energetique', 'spectro-stellaire'], make: (r) => ({ expected: 'loi de puissance, indice −2,1', measured: `bosse à ${Math.round(between(r, 40, 400))} keV` }) },
  ],
  TEMPORELLE: [
    { label: 'Périodicité trop stable', make: () => ({ expected: 'dérive Ṗ ≈ 10⁻¹⁵ s/s', measured: 'dérive non mesurable (< 10⁻²⁰ s/s)' }) },
    { label: "Modulation lente de l'intensité", make: (r) => ({ expected: 'intensité constante', measured: `modulation ${Math.round(between(r, 8, 30))} %, période ${fmt(between(r, 2, 40), 1)} j` }) },
    { label: 'Intervalles entre impulsions non aléatoires', make: (r) => ({ expected: 'distribution poissonnienne', measured: `χ² = ${fmt(between(r, 38, 90), 1)} (p < 0,001)` }) },
  ],
  GRAVITATIONNELLE: [
    { label: 'Résidu gravitationnel non expliqué', make: (r) => ({ expected: '0', measured: `${fmt(between(r, 0.1, 0.9), 1)} M⊕ éq., période ${Math.round(between(r, 10, 200))} j` }) },
    { label: 'Masse incompatible avec le volume', types: ['PLANETE', 'MINEUR', 'OBJET'], make: (r) => ({ expected: `densité ${fmt(between(r, 3, 5.5), 1)} g/cm³`, measured: `${fmt(between(r, 12, 20), 1)} g/cm³` }) },
    { label: "Onde sans contrepartie lumineuse", types: ['SIGNAL'], make: (r) => ({ expected: 'coalescence visible (kilonova)', measured: `aucune contrepartie, h ≈ ${fmt(between(r, 1, 9), 1)}·10⁻²²` }) },
  ],
  ORBITALE: [
    { label: 'Résonance quasi exacte', make: (r) => ({ expected: 'écart à la résonance ~10⁻²', measured: `écart ${fmt(between(r, 1, 9), 0)}·10⁻⁵ (rapport 3:2)` }) },
    { label: 'Accélération résiduelle sans source', make: (r) => ({ expected: '0', measured: `${fmt(between(r, 1, 8), 1)}·10⁻¹⁰ m/s²` }) },
    { label: 'Inclinaison incompatible avec le disque', make: (r) => ({ expected: 'i < 5°', measured: `i = ${Math.round(between(r, 20, 80))}°` }) },
  ],
  CHIMIQUE: [
    { label: 'Déséquilibre chimique O₂ + CH₄', types: ['PLANETE', 'ATMOSPHERE'], make: (r) => ({ expected: "CH₄ < 0,1 ppm en présence d'O₂", measured: `CH₄ ${fmt(between(r, 2, 9), 1)} ppm, O₂ ${Math.round(between(r, 5, 20))} %` }) },
    { label: 'Rapport isotopique incohérent', make: (r) => ({ expected: 'D/H ≈ 1,5·10⁻⁴', measured: `D/H ≈ ${fmt(between(r, 1.2, 6), 1)}·10⁻³` }) },
  ],
  MORPHOLOGIQUE: [
    { label: 'Symétrie régulière de la surface', instruments: ['scanner-morpho'], make: () => ({ expected: 'relief fractal (D ≈ 2,3)', measured: "D = 2,02, symétrie d'ordre 6" }) },
    { label: 'Couche interne de densité constante', instruments: ['analyseur-vol', 'magnetometre'], make: (r) => ({ expected: 'gradient continu', measured: `couche de ${Math.round(between(r, 4, 60))} km, densité uniforme ±1 %` }) },
  ],
  THERMIQUE: [
    { label: 'Source de chaleur sans contrepartie', make: (r) => ({ expected: `T_eq ${Math.round(between(r, 180, 300))} K`, measured: `point chaud +${Math.round(between(r, 15, 90))} K, stable` }) },
  ],
  ABSENCE: [
    { label: "Raie de l'eau attendue, non détectée", types: ['PLANETE'], instruments: ['spectro-stellaire'], make: () => ({ expected: 'H₂O à 1,4 µm (zone habitable)', measured: 'non détectée (seuil 3σ)' }) },
    { label: 'Satellite prédit, non observé', types: ['PLANETE', 'MINEUR'], instruments: ['analyseur-orbital', 'analyseur-vol'], make: (r) => ({ expected: `corps de ~${fmt(between(r, 0.05, 0.3), 2)} M⊕ (perturbation)`, measured: 'aucun corps détecté' }) },
    { label: 'Champ magnétique attendu, absent', types: ['PLANETE', 'MINEUR'], instruments: ['magnetometre'], make: (r) => ({ expected: `~${Math.round(between(r, 5, 40))} µT (rotation, noyau)`, measured: '< 0,01 µT' }) },
    { label: 'Lithium attendu, absent', types: ['ETOILE'], instruments: ['spectro-stellaire'], make: () => ({ expected: 'Li I 670,8 nm (étoile jeune)', measured: 'raie absente' }) },
    { label: 'Compagnon prédit, non observé', types: ['ETOILE'], instruments: ['analyseur-orbital', 'analyseur-vol'], make: (r) => ({ expected: `masse ~${fmt(between(r, 0.05, 0.4), 2)} M☉ (vitesse radiale)`, measured: 'aucune source' }) },
  ],
}

/** Clé stable de l'objet observé : même objet → même graine, quel que soit le vaisseau */
export function objectSeedKey(obs) {
  return `${obs.type}|${obs.system_id ?? obs.system ?? ''}|${obs.name}`
}

function pick(rnd, list) {
  return list[Math.floor(rnd() * list.length) % list.length]
}

function objectTypeKey(obs) {
  return obs.type === 'SIGNAL' ? 'SIGNAL' : getBodyType(obs)
}

/** Familles relevables pour cet objet : celles dont au moins un instrument s'applique */
function candidateFamilies(obs, availableIds) {
  const families = obs.type === 'SIGNAL' ? SIGNAL_FAMILIES : (BODY_FAMILIES[getBodyType(obs)] ?? [])
  return families.filter((f) => DEVIATION_FAMILIES[f].instruments.some((id) => availableIds.includes(id)))
}

/** Gabarits compatibles avec le type de l'objet, chacun avec ses instruments effectifs */
function candidateTemplates(family, typeKey, availableIds) {
  const familyIds = DEVIATION_FAMILIES[family].instruments.filter((id) => availableIds.includes(id))
  return TEMPLATES[family]
    .filter((t) => !t.types || t.types.includes(typeKey))
    .map((t) => ({ ...t, ids: familyIds.filter((id) => !t.instruments || t.instruments.includes(id)) }))
    .filter((t) => t.ids.length > 0)
}

/** Niveau minimal des instruments d'un écart (les signaux n'ont pas de niveau) */
function baseNiveau(instrumentIds) {
  const levels = LAB_INSTRUMENTS.filter((i) => instrumentIds.includes(i.id)).map((i) => NIVEAU_ORDER[i.niveau] ?? 0)
  return levels.length ? Math.min(...levels) : 0
}

function buildDeviation(rnd, id, family, typeKey, availableIds, isSignal) {
  const templates = candidateTemplates(family, typeKey, availableIds)
  if (templates.length === 0) return null
  const t = pick(rnd, templates)
  const { expected, measured } = t.make(rnd)
  // Un écart sur deux demande un niveau de plus que ses instruments pour être caractérisé (§4.7)
  const minNiveau = isSignal ? 0 : Math.min(NIVEAU_ORDER.CONTACT, baseNiveau(t.ids) + (rnd() < 0.5 ? 1 : 0))
  return { id, family, label: t.label, expected, measured, instruments: t.ids, minNiveau }
}

/** Écarts scénarisés déclarés dans les attributs de l'observation (fiches immuables, scénarios) */
function scriptedDeviations(obs, availableIds) {
  const list = obs.attributes?.deviations
  if (!Array.isArray(list)) return null
  return list
    .filter((d) => DEVIATION_FAMILIES[d.family])
    .map((d, i) => ({
      id: d.id ?? `script-${i}`,
      family: d.family,
      label: d.label,
      expected: d.expected ?? '',
      measured: d.measured ?? '',
      instruments: (d.instruments ?? DEVIATION_FAMILIES[d.family].instruments).filter((id) => availableIds.includes(id)),
      minNiveau: NIVEAU_ORDER[d.min_niveau] ?? 0,
    }))
    .filter((d) => d.instruments.length > 0)
}

/**
 * Écarts portés par un objet.
 * @param {object} obs - Observation (type, system_id, name, support, anomalous, attributes)
 * @returns {{ real: Array<object>, spurious: object|null }}
 *   real : écarts réels, chacun avec ses instruments et son niveau minimal ;
 *   spurious : écart parasite (un seul instrument), ou null.
 */
export function getObjectDeviations(obs) {
  if (!obs) return { real: [], spurious: null }
  const availableIds = getInstrumentsForObservation(obs).map((i) => i.id)
  const rnd = seededRandom(seedFromObsId(objectSeedKey(obs)))
  const isSignal = obs.type === 'SIGNAL'
  const typeKey = objectTypeKey(obs)
  const families = candidateFamilies(obs, availableIds)

  // Tirages dans un ordre fixe, pour que l'écart parasite ne dépende pas de la présence d'un écart réel
  const hasReal = isSignal ? !!obs.anomalous : rnd() < BODY_DEVIATION_RATE
  const realRnd = seededRandom(Math.floor(rnd() * 2 ** 31))
  const hasSpurious = rnd() < SPURIOUS_DEVIATION_RATE
  const spuriousRnd = seededRandom(Math.floor(rnd() * 2 ** 31))

  let real = scriptedDeviations(obs, availableIds)
  if (!real) {
    real = []
    if (hasReal && families.length) {
      const d = buildDeviation(realRnd, 'objet-0', pick(realRnd, families), typeKey, availableIds, isSignal)
      if (d) real.push(d)
    }
  }

  let spurious = null
  if (hasSpurious && families.length) {
    const d = buildDeviation(spuriousRnd, 'parasite', pick(spuriousRnd, families), typeKey, availableIds, true)
    if (d && !real.some((r) => r.label === d.label)) spurious = { ...d, instruments: [pick(spuriousRnd, d.instruments)] }
  }
  return { real, spurious }
}

/**
 * Écarts relevés par un rapport d'instrument.
 * @param {object} obs - Observation
 * @param {string} instrumentId - Instrument du rapport
 * @param {{ fiability: number, niveau: number }} ctx - Fiabilité du rapport, niveau d'observation effectif (NIVEAU_ORDER)
 * @returns {Array<{ id: string, family: string, label: string, expected: string|null, measured: string|null, requiresNiveau: string|null }>}
 *   requiresNiveau non nul : écart hors de portée à ce niveau (§4.7), sans valeurs.
 */
export function getReportDeviations(obs, instrumentId, { fiability, niveau }) {
  const { real, spurious } = getObjectDeviations(obs)
  const out = []
  for (const d of real) {
    if (!d.instruments.includes(instrumentId)) continue
    if (niveau >= d.minNiveau) {
      out.push({ id: d.id, family: d.family, label: d.label, expected: d.expected, measured: d.measured, requiresNiveau: null })
    } else {
      out.push({ id: d.id, family: d.family, label: d.label, expected: null, measured: null, requiresNiveau: NIVEAU_KEYS[d.minNiveau] })
    }
  }
  // L'écart parasite ne se distingue pas d'un écart réel ; il ne se recoupe simplement jamais (§4.6)
  if (spurious && spurious.instruments.includes(instrumentId) && fiability < SPURIOUS_MAX_FIABILITY) {
    out.push({ id: spurious.id, family: spurious.family, label: spurious.label, expected: spurious.expected, measured: spurious.measured, requiresNiveau: null })
  }
  return out
}

/**
 * Nombre de rapports qui mesurent chaque écart (les ombres ne comptent pas).
 * Un écart mesuré par au moins deux rapports est corroboré (§4.5).
 * @param {Array<Array<{ id: string, requiresNiveau: string|null }>>} reportDeviationLists
 * @returns {Map<string, number>}
 */
export function countDeviationSightings(reportDeviationLists) {
  const counts = new Map()
  for (const list of reportDeviationLists) {
    for (const d of list) {
      if (d.requiresNiveau) continue
      counts.set(d.id, (counts.get(d.id) ?? 0) + 1)
    }
  }
  return counts
}
