import { describe, it, expect } from 'vitest'
import { getMainDeviationFamily, formatVerdict, VERDICT_READINGS, CONFIDENCE_LEVELS } from './verdicts'

describe('getMainDeviationFamily', () => {
  it('renvoie null sans écart mesuré', () => {
    expect(getMainDeviationFamily([])).toBeNull()
    expect(getMainDeviationFamily([[{ family: 'ORBITALE', requiresNiveau: 'ORBITE' }]])).toBeNull()
  })

  it('choisit la famille mesurée par le plus de rapports, sans compter les ombres', () => {
    const lists = [
      [{ family: 'CHIMIQUE', requiresNiveau: null }],
      [{ family: 'GRAVITATIONNELLE', requiresNiveau: null }, { family: 'CHIMIQUE', requiresNiveau: 'CONTACT' }],
      [{ family: 'GRAVITATIONNELLE', requiresNiveau: null }],
    ]
    expect(getMainDeviationFamily(lists)).toBe('GRAVITATIONNELLE')
  })

  it('garde la première famille relevée à égalité', () => {
    const lists = [[{ family: 'THERMIQUE', requiresNiveau: null }], [{ family: 'CHIMIQUE', requiresNiveau: null }]]
    expect(getMainDeviationFamily(lists)).toBe('THERMIQUE')
  })
})

describe('formatVerdict', () => {
  it('donne la lecture et la confiance', () => {
    expect(formatVerdict({ reading: 'NATUREL_INEXPLIQUE', confidence: 'CONVICTION' })).toBe('Naturel inexpliqué · conviction')
  })
})

describe('valeurs SQL', () => {
  it('reprend les enums verdict_reading et confidence_level', () => {
    expect(VERDICT_READINGS.map((r) => r.id)).toEqual(['NATUREL_CONNU', 'NATUREL_INEXPLIQUE', 'ARTIFICIEL_POSSIBLE', 'INDETERMINE'])
    expect(CONFIDENCE_LEVELS.map((c) => c.id)).toEqual(['OBSERVATION', 'HYPOTHÈSE', 'CONVICTION', 'CERTITUDE'])
  })
})
