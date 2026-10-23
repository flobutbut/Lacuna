import { describe, it, expect } from 'vitest'
import { generatePolarisationData, circularHandedness } from './polarisationData'

describe('circularHandedness', () => {
  it('reconnaît le sens d’une polarisation circulaire', () => {
    expect(circularHandedness('circulaire gauche')).toBe(-1)
    expect(circularHandedness('circulaire droite')).toBe(1)
  })

  it('renvoie null sinon', () => {
    expect(circularHandedness('circulaire')).toBeNull()
    expect(circularHandedness('linéaire')).toBeNull()
    expect(circularHandedness(null)).toBeNull()
  })
})

describe('generatePolarisationData — polarisation circulaire gauche', () => {
  const data = generatePolarisationData({ obsId: 'obs-1', fiability: 80, polarization: 'circulaire gauche' })

  it('est un cercle dont le Stokes V est négatif', () => {
    expect(Math.abs(data.ellipticity)).toBe(1)
    expect(data.stokes.Q).toBe(0)
    expect(data.stokes.U).toBe(0)
    expect(data.stokes.V).toBeLessThan(-0.85)
  })

  it('est déterministe', () => {
    expect(generatePolarisationData({ obsId: 'obs-1', fiability: 80, polarization: 'circulaire gauche' })).toEqual(data)
  })

  it('ne change pas le comportement sans polarisation', () => {
    const a = generatePolarisationData({ obsId: 'x', fiability: 70 })
    const b = generatePolarisationData({ obsId: 'x', fiability: 70, polarization: 'circulaire' })
    expect(b).toEqual(a)
  })
})
