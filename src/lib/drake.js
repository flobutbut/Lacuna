/**
 * Équation de Drake — N de bord (LACUNA_VERDICT.md §7)
 * Ce que ce vaisseau croit, d'après ses verdicts. Même calcul que ship_drake_compute (migration 00077).
 *
 *   contribution = s(lecture) × w(confiance)
 *   T_bord = T_référence × 10^(k × Σ contributions), borné
 *   N = R* × fp × ne × fl × fi × fc × L
 */

/** Valeurs de référence (LACUNA_GDD.md §7) — N = 72 */
export const DRAKE_REFERENCE = { r_star: 3, fp: 1, ne: 0.4, fl: 0.3, fi: 0.1, fc: 0.2, l_val: 10000 }

/** Termes variables, influencés par les verdicts */
export const VARIABLE_TERMS = ['fl', 'fi', 'fc', 'l_val']

/** Famille d'écart → terme (LACUNA_VERDICT.md §7.2) */
export const FAMILY_TERM = {
  CHIMIQUE: 'fl',
  ORBITALE: 'fi',
  MORPHOLOGIQUE: 'fi',
  GRAVITATIONNELLE: 'fi',
  ELECTROMAGNETIQUE: 'fc',
  THERMIQUE: 'fc',
  TEMPORELLE: 'fc',
  ABSENCE: 'l_val',
}

/** s(lecture) : expliquer un écart rend l'univers un peu plus vide */
export const READING_SIGN = { ARTIFICIEL_POSSIBLE: 1, NATUREL_INEXPLIQUE: 0.3, NATUREL_CONNU: -0.3, INDETERMINE: 0 }
/** w(confiance) */
export const CONFIDENCE_WEIGHT = { OBSERVATION: 0.25, HYPOTHÈSE: 0.5, CONVICTION: 1, CERTITUDE: 1.5 }
/** Pente (à calibrer — LACUNA_VERDICT.md §11) */
export const DRAKE_K = 0.05

function bounds(term) {
  if (term === 'l_val') return [100, 1e7]
  const ref = DRAKE_REFERENCE[term]
  return [ref / 10, Math.min(ref * 10, 1)]
}

/** N à partir des sept termes */
export function computeN(t) {
  return t.r_star * t.fp * t.ne * t.fl * t.fi * t.fc * t.l_val
}

/** Contribution d'un verdict : 0 sans écart ou pour « indéterminé » */
export function verdictContribution(verdict) {
  if (!verdict?.family || !FAMILY_TERM[verdict.family]) return 0
  return (READING_SIGN[verdict.reading] ?? 0) * (CONFIDENCE_WEIGHT[verdict.confidence] ?? 0)
}

/**
 * Drake de bord à partir des verdicts courants (le plus récent de chaque observation).
 * @param {Array<{ family: string|null, reading: string, confidence: string }>} currentVerdicts
 * @returns {{ terms: object, n: number, contributions: Record<string, Array<{ verdict: object, value: number }>> }}
 */
export function computeShipDrake(currentVerdicts) {
  const sums = { fl: 0, fi: 0, fc: 0, l_val: 0 }
  const contributions = { fl: [], fi: [], fc: [], l_val: [] }
  for (const v of currentVerdicts) {
    const value = verdictContribution(v)
    const term = FAMILY_TERM[v.family]
    if (!term || value === 0) continue
    sums[term] += value
    contributions[term].push({ verdict: v, value })
  }
  const terms = { ...DRAKE_REFERENCE }
  for (const term of VARIABLE_TERMS) {
    const [min, max] = bounds(term)
    terms[term] = Math.min(max, Math.max(min, DRAKE_REFERENCE[term] * 10 ** (DRAKE_K * sums[term])))
  }
  return { terms, n: computeN(terms), contributions }
}

/** Poids maximal d'un vaisseau dans le N collectif, par terme (LACUNA_VERDICT.md §7.4) */
export const COLLECTIVE_WEIGHT_CAP = 20

/**
 * N collectif (LACUNA_VERDICT.md §7.4) — même calcul que drake_collective_compute (migration 00078).
 * Chaque terme variable est la moyenne géométrique des termes de bord des vaisseaux qui ont au moins
 * un verdict sur ce terme, pondérée par leur nombre de verdicts (plafonné à 20). Sans vaisseau : référence.
 * @param {Array<{ terms: object, counts: Record<string, number> }>} ships
 * @returns {{ terms: object, n: number }}
 */
export function computeCollectiveDrake(ships) {
  const terms = { ...DRAKE_REFERENCE }
  for (const term of VARIABLE_TERMS) {
    let weighted = 0
    let total = 0
    for (const s of ships) {
      const w = Math.min(s.counts?.[term] ?? 0, COLLECTIVE_WEIGHT_CAP)
      if (w < 1) continue
      weighted += w * Math.log(s.terms[term])
      total += w
    }
    if (total > 0) terms[term] = Math.exp(weighted / total)
  }
  return { terms, n: computeN(terms) }
}

/** Nombre de verdicts qui contribuent, par terme (pour le poids d'un vaisseau dans le N collectif) */
export function countContributions(contributions) {
  return Object.fromEntries(VARIABLE_TERMS.map((t) => [t, contributions[t]?.length ?? 0]))
}

/** Valeur d'un terme à l'affichage : fractions à trois décimales, L en années */
export function formatTerm(term, value) {
  if (value == null || !Number.isFinite(Number(value))) return '—'
  if (term === 'l_val') return `${Math.round(value).toLocaleString('fr-FR')} ans`
  if (term === 'r_star') return `${Number(value).toLocaleString('fr-FR')} /an`
  return Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
}

export function formatN(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—'
  return Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 1 })
}

/** Phrase sur l'écart entre le N de bord et le N collectif — sans dire lequel a raison */
export function describeGap(nShip, nCollective) {
  if (!nShip || !nCollective) return ''
  const ratio = nShip / nCollective
  if (ratio > 1.25) return 'Votre civilisation croit davantage à la vie que les autres vaisseaux.'
  if (ratio < 0.8) return 'Votre civilisation y croit moins que les autres vaisseaux.'
  return 'Votre civilisation pense comme la plupart des vaisseaux.'
}
