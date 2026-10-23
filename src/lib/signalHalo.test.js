import { describe, it, expect } from 'vitest'
import { haloEdges, pulseIndex, isSlowPulsed } from './signalHalo'

describe('haloEdges', () => {
  const view = { ra: 180, dec: 0 }

  it('est uniforme pour un signal sans direction', () => {
    const e = haloEdges(null, view)
    expect(e.top).toBe(e.left)
    expect(e.right).toBe(e.bottom)
  })

  it('est uniforme et maximal quand le signal est droit devant', () => {
    const e = haloEdges({ ra: 180, dec: 0 }, view)
    expect(e.left).toBeCloseTo(e.right)
    expect(e.top).toBeCloseTo(e.bottom)
    expect(e.left).toBeCloseTo(0.6)
  })

  it('éclaire le bord tourné vers le signal', () => {
    const e = haloEdges({ ra: 180, dec: 60 }, view)
    expect(e.top).toBeGreaterThan(e.bottom)
    expect(e.top).toBeGreaterThan(e.left)
  })

  it('distingue la gauche de la droite', () => {
    const a = haloEdges({ ra: 240, dec: 0 }, view)
    const b = haloEdges({ ra: 120, dec: 0 }, view)
    expect(Math.sign(a.right - a.left)).toBe(-Math.sign(b.right - b.left))
    expect(a.right).not.toBeCloseTo(a.left)
  })

  it('est plus intense quand la vue se tourne vers le signal', () => {
    const near = haloEdges({ ra: 220, dec: 0 }, view)
    const far = haloEdges({ ra: 20, dec: 0 }, view)
    expect(Math.max(near.left, near.right)).toBeGreaterThan(Math.max(far.left, far.right))
  })
})

describe('pulseIndex', () => {
  const signal = { id: 's', pulsePeriodS: 73, phaseOffset: 0 }

  it('change exactement au passage d’une impulsion', () => {
    expect(pulseIndex(signal, 72.9)).toBe(0)
    expect(pulseIndex(signal, 73)).toBe(1)
    expect(pulseIndex(signal, 145.9)).toBe(1)
    expect(pulseIndex(signal, 146)).toBe(2)
  })

  it('tient compte du décalage de phase', () => {
    expect(pulseIndex({ ...signal, phaseOffset: 0.5 }, 36.5)).toBe(1)
  })
})

describe('isSlowPulsed', () => {
  it('retient les signaux d’une minute ou plus', () => {
    expect(isSlowPulsed({ pulsePeriodS: 73 })).toBe(true)
    expect(isSlowPulsed({ pulsePeriodS: 1.337 })).toBe(false)
    expect(isSlowPulsed({})).toBe(false)
  })
})
