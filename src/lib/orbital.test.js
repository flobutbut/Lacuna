import { describe, expect, it } from 'vitest'
import { semiMajorAxisFromPeriod, distanceAuToPx } from './orbitalUtils'
import { generateOrbitalData } from './orbitalData'
import { habitableZoneLimits, luminosityFromMass } from './habitableZone'

describe('semiMajorAxisFromPeriod (Kepler 3)', () => {
  it('donne 1 UA pour une période terrestre', () => {
    expect(semiMajorAxisFromPeriod(365.25)).toBeCloseTo(1, 6)
  })

  it('donne ~5,2 UA pour Jupiter (4332,6 j)', () => {
    expect(semiMajorAxisFromPeriod(4332.6)).toBeCloseTo(5.2, 1)
  })

  it('renvoie null pour une période absente ou négative', () => {
    expect(semiMajorAxisFromPeriod(null)).toBeNull()
    expect(semiMajorAxisFromPeriod(-10)).toBeNull()
  })
})

describe('distanceAuToPx', () => {
  it('place les bornes au début et à la fin de la piste', () => {
    expect(distanceAuToPx(0.1, 20, 0.1, 30, 400)).toBeCloseTo(20)
    expect(distanceAuToPx(30, 20, 0.1, 30, 400)).toBeCloseTo(420)
  })

  it('renvoie le départ de piste pour une distance inconnue', () => {
    expect(distanceAuToPx(null, 20, 0.1, 30, 400)).toBe(20)
  })
})

describe('generateOrbitalData', () => {
  it('ne produit pas de NaN quand excentricité et inclinaison sont absentes', () => {
    const { orbits } = generateOrbitalData({
      systemObjects: [{ type: 'PLANET', name: 'b', orbital_semi_major_axis_au: 1 }],
    })
    expect(orbits).toHaveLength(1)
    expect(orbits[0].e).toBe(0)
    expect(orbits[0].i).toBe(0)
    expect(orbits[0].period).toBeNull()
  })

  it('déduit le demi-grand axe de la période et trie les orbites', () => {
    const { orbits } = generateOrbitalData({
      systemObjects: [
        { type: 'PLANET', name: 'loin', orbital_period_days: 4332.6 },
        { type: 'PLANET', name: 'proche', orbital_period_days: 365.25, orbital_eccentricity: 0.0167 },
        { type: 'STAR', name: 'Soleil' },
      ],
    })
    expect(orbits.map((o) => o.name)).toEqual(['proche', 'loin'])
    expect(orbits[0].a).toBeCloseTo(1, 6)
    expect(orbits[0].e).toBeCloseTo(0.0167)
  })

  it('est déterministe sans objets (orbites synthétiques)', () => {
    const a = generateOrbitalData({ obsId: 'obs-1' })
    const b = generateOrbitalData({ obsId: 'obs-1' })
    expect(a).toEqual(b)
    expect(a.orbits.length).toBeGreaterThan(0)
  })
})

describe('zone habitable', () => {
  it('encadre 1 UA pour le Soleil', () => {
    const { inner, outer } = habitableZoneLimits(luminosityFromMass(1))
    expect(inner).toBeLessThan(1)
    expect(outer).toBeGreaterThan(1)
  })
})
