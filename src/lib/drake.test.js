import { describe, it, expect } from 'vitest'
import {
  computeShipDrake,
  computeCollectiveDrake,
  countContributions,
  computeN,
  verdictContribution,
  describeGap,
  formatTerm,
  DRAKE_REFERENCE,
} from './drake'

const v = (family, reading, confidence) => ({ family, reading, confidence })

describe('computeShipDrake', () => {
  it('donne les valeurs de référence sans verdict (N = 72)', () => {
    const { terms, n } = computeShipDrake([])
    expect(terms).toEqual(DRAKE_REFERENCE)
    expect(n).toBeCloseTo(72)
  })

  it('fait monter le terme de la famille pour « origine artificielle possible »', () => {
    const { terms, contributions } = computeShipDrake([v('GRAVITATIONNELLE', 'ARTIFICIEL_POSSIBLE', 'CONVICTION')])
    expect(terms.fi).toBeCloseTo(0.1 * 10 ** 0.05)
    expect(terms.fl).toBe(DRAKE_REFERENCE.fl)
    expect(contributions.fi).toHaveLength(1)
  })

  it('fait baisser le terme pour « naturel connu »', () => {
    const { terms } = computeShipDrake([v('CHIMIQUE', 'NATUREL_CONNU', 'CERTITUDE')])
    expect(terms.fl).toBeLessThan(DRAKE_REFERENCE.fl)
  })

  it('ignore les verdicts sans écart et les indéterminés', () => {
    const { terms } = computeShipDrake([v(null, 'ARTIFICIEL_POSSIBLE', 'CERTITUDE'), v('ORBITALE', 'INDETERMINE', 'CERTITUDE')])
    expect(terms).toEqual(DRAKE_REFERENCE)
  })

  it('borne les termes', () => {
    const many = Array.from({ length: 200 }, () => v('TEMPORELLE', 'ARTIFICIEL_POSSIBLE', 'CERTITUDE'))
    expect(computeShipDrake(many).terms.fc).toBe(1)
    const few = Array.from({ length: 200 }, () => v('ABSENCE', 'NATUREL_CONNU', 'CERTITUDE'))
    expect(computeShipDrake(few).terms.l_val).toBe(100)
  })
})

describe('verdictContribution', () => {
  it('vaut s(lecture) × w(confiance)', () => {
    expect(verdictContribution(v('ORBITALE', 'NATUREL_INEXPLIQUE', 'HYPOTHÈSE'))).toBeCloseTo(0.15)
  })
})

describe('affichage', () => {
  it('calcule N et formate les termes', () => {
    expect(computeN(DRAKE_REFERENCE)).toBeCloseTo(72)
    expect(formatTerm('l_val', 10000)).toBe('10 000 ans')
    expect(formatTerm('fi', 0.1122)).toBe('0,112')
  })

  it('compare le N de bord au N collectif sans trancher', () => {
    expect(describeGap(100, 72)).toMatch(/davantage/)
    expect(describeGap(50, 72)).toMatch(/moins/)
    expect(describeGap(72, 72)).toMatch(/comme la plupart/)
  })
})

describe('computeCollectiveDrake', () => {
  const ship = (verdicts) => {
    const { terms, contributions } = computeShipDrake(verdicts)
    return { terms, counts: countContributions(contributions) }
  }

  it('reste aux références sans vaisseau ni verdict', () => {
    expect(computeCollectiveDrake([]).terms).toEqual(DRAKE_REFERENCE)
    expect(computeCollectiveDrake([ship([])]).n).toBeCloseTo(72)
  })

  it('ne compte, pour un terme, que les vaisseaux qui ont un verdict dessus', () => {
    const a = ship([v('GRAVITATIONNELLE', 'ARTIFICIEL_POSSIBLE', 'CERTITUDE')])
    const b = ship([v('CHIMIQUE', 'NATUREL_CONNU', 'CONVICTION')])
    const { terms } = computeCollectiveDrake([a, b])
    expect(terms.fi).toBeCloseTo(a.terms.fi)
    expect(terms.fl).toBeCloseTo(b.terms.fl)
    expect(terms.fc).toBe(DRAKE_REFERENCE.fc)
  })

  it('fait une moyenne géométrique pondérée par le nombre de verdicts', () => {
    const up = ship([v('ORBITALE', 'ARTIFICIEL_POSSIBLE', 'CERTITUDE')])
    const down = ship([
      v('ORBITALE', 'NATUREL_CONNU', 'CERTITUDE'),
      v('MORPHOLOGIQUE', 'NATUREL_CONNU', 'CERTITUDE'),
    ])
    const expected = Math.exp((1 * Math.log(up.terms.fi) + 2 * Math.log(down.terms.fi)) / 3)
    expect(computeCollectiveDrake([up, down]).terms.fi).toBeCloseTo(expected)
  })

  it('plafonne le poids d’un vaisseau très actif', () => {
    const busy = { terms: { ...DRAKE_REFERENCE, fc: 0.8 }, counts: { fl: 0, fi: 0, fc: 500, l_val: 0 } }
    const quiet = { terms: { ...DRAKE_REFERENCE, fc: 0.1 }, counts: { fl: 0, fi: 0, fc: 20, l_val: 0 } }
    expect(computeCollectiveDrake([busy, quiet]).terms.fc).toBeCloseTo(Math.sqrt(0.8 * 0.1))
  })
})
