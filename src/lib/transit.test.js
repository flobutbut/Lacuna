import { describe, it, expect } from 'vitest'
import { computeTransit, ANNEES_PAR_GENERATION } from './transit'

describe('computeTransit — générations', () => {
  it('compte une génération pour 25 ans simulés', () => {
    expect(ANNEES_PAR_GENERATION).toBe(25)
  })

  it('Proxima Centauri : 88 ans simulés, 3 générations', () => {
    const t = computeTransit(4.24)
    expect(t.tPhysTotal).toBeCloseTo(88)
    expect(t.generations).toBe(3)
  })

  it('Gliese 667C : 458 ans simulés, 18 générations', () => {
    expect(computeTransit(22).generations).toBe(18)
  })
})
