import { describe, it, expect } from 'vitest'
import { supernovaState, SUPERNOVA_PHASES as P } from './supernova'

const t0 = Date.parse('2026-10-23T10:00:00Z')
const at = (ms) => supernovaState(t0, t0 + ms)

describe('supernovaState', () => {
  it('ne fait rien sans T0', () => {
    expect(supernovaState(null)).toEqual({ phase: 'none', level: null })
  })

  it("laisse l'étoile intacte avant la lumière", () => {
    expect(at(-1000)).toEqual({ phase: 'before', level: null })
    expect(at(5000).phase).toBe('burst')
    expect(at(P.BREAKOUT_START - 1)).toEqual({ phase: 'silence', level: null })
  })

  it('éclaire brièvement à la sortie du choc, puis retombe', () => {
    const flash = at(P.BREAKOUT_START + 0.1 * (P.RISE_START - P.BREAKOUT_START))
    expect(flash.phase).toBe('breakout')
    expect(flash.level).toBeCloseTo(0.5)
    expect(at(P.RISE_START - 1).level).toBeCloseTo(0.25, 2)
  })

  it('monte jusqu’au maximum à T0 + 2 h', () => {
    expect(at(P.RISE_START).level).toBeCloseTo(0.25)
    expect(at(P.PEAK - 1).level).toBeCloseTo(1, 3)
    expect(at((P.RISE_START + P.PEAK) / 2).level).toBeGreaterThan(0.6)
  })

  it('décline sur 7 jours puis laisse un rémanent faible', () => {
    expect(at(P.PEAK).level).toBeCloseTo(1)
    expect(at(3 * 24 * 3600 * 1000).level).toBeLessThan(0.3)
    expect(at(P.DECLINE_END + 1)).toEqual({ phase: 'remnant', level: 0.04 })
  })

  it('accepte une date ISO', () => {
    expect(supernovaState('2026-10-23T10:00:00Z', t0 + P.PEAK).phase).toBe('decline')
  })
})
