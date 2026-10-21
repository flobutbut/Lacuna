import { describe, expect, it } from 'vitest'
import { seededRandom } from './random'

describe('seededRandom', () => {
  it('produit la même suite pour la même graine', () => {
    const a = seededRandom(42)
    const b = seededRandom(42)
    const suiteA = Array.from({ length: 5 }, () => a())
    const suiteB = Array.from({ length: 5 }, () => b())
    expect(suiteA).toEqual(suiteB)
  })

  it('produit des suites différentes pour des graines différentes', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)())
  })

  it('reste dans [0, 1)', () => {
    const rng = seededRandom(123)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
