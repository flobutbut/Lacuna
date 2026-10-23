import { describe, it, expect } from 'vitest'
import {
  getMainDeviationFamily,
  formatVerdict,
  buildVerdictJournalText,
  suggestSubtype,
  suggestDesignation,
  VERDICT_READINGS,
  CONFIDENCE_LEVELS,
} from './verdicts'

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

describe('buildVerdictJournalText', () => {
  it('reprend la lecture, la confiance, l’écart principal et la note (même texte que verdict_journal_text)', () => {
    expect(buildVerdictJournalText({ reading: 'NATUREL_INEXPLIQUE', confidence: 'CONVICTION', family: 'GRAVITATIONNELLE', sightings: 2, note: ' Un corps invisible. ' }))
      .toBe('Naturel inexpliqué (conviction). Écart principal (gravitationnelle), mesuré par 2 rapports.\n« Un corps invisible. »')
  })

  it('dit qu’aucun écart n’a été mesuré, sans note', () => {
    expect(buildVerdictJournalText({ reading: 'INDETERMINE', confidence: 'HYPOTHÈSE', family: null, sightings: 0 }))
      .toBe('Indéterminé (hypothèse). Aucun écart mesuré.')
  })

  it('accorde « rapport » au singulier', () => {
    expect(buildVerdictJournalText({ reading: 'NATUREL_CONNU', confidence: 'OBSERVATION', family: 'ORBITALE', sightings: 1 }))
      .toBe('Naturel connu (observation). Écart principal (orbitale), mesuré par 1 rapport.')
  })
})

describe('artefact', () => {
  it('suggère Découverte pour un écart inexpliqué ou artificiel, Annotation sinon', () => {
    expect(suggestSubtype('NATUREL_INEXPLIQUE')).toBe('DISCOVERY')
    expect(suggestSubtype('ARTIFICIEL_POSSIBLE')).toBe('DISCOVERY')
    expect(suggestSubtype('NATUREL_CONNU')).toBe('ANNOTATION')
    expect(suggestSubtype('INDETERMINE')).toBe('ANNOTATION')
  })

  it('suggère une désignation depuis le nom de l’objet, sans son type', () => {
    expect(suggestDesignation('Proxima c · Corps planétaire')).toBe('PROXIMA-C')
    expect(suggestDesignation('PSR B1919+21 · Signal')).toBe('PSR-B1919+21')
    expect(suggestDesignation('')).toBe('TRACE')
  })
})
