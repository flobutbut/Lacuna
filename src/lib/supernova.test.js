import { describe, it, expect } from 'vitest'
import { supernovaState, supernovaBands, SUPERNOVA_PHASES as P } from './supernova'

const t0 = Date.parse('2026-10-23T10:00:00Z')
const at = (ms) => supernovaState(t0, t0 + ms)
const bands = (ms) => supernovaBands(t0, t0 + ms)

describe('supernovaState', () => {
  it('ne fait rien sans T0', () => {
    expect(supernovaState(null).phase).toBe('none')
  })

  it("laisse l'étoile intacte avant la lumière (6 minutes de silence)", () => {
    expect(at(-6 * 60 * 1000).phase).toBe('before')
    expect(at(-1000)).toMatchObject({ phase: 'precursor', level: null })
    expect(at(-2.5 * 60 * 1000).u).toBeCloseTo(0.5)
    expect(at(5000).phase).toBe('burst')
    expect(at(P.BREAKOUT_START - 1)).toMatchObject({ phase: 'silence', level: null })
    expect(P.BREAKOUT_START).toBe(6 * 60 * 1000)
  })

  it('éclaire brièvement à la sortie du choc, puis retombe', () => {
    const flash = at(P.BREAKOUT_START + 0.1 * (P.RISE_START - P.BREAKOUT_START))
    expect(flash.phase).toBe('breakout')
    expect(flash.level).toBeCloseTo(0.5)
    expect(at(P.RISE_START - 1).level).toBeCloseTo(0.25, 2)
  })

  it('monte jusqu’au maximum à T0 + 2 h', () => {
    expect(at(P.PEAK - 1).level).toBeCloseTo(1, 3)
  })

  it('décline sur 7 jours puis laisse un rémanent faible', () => {
    expect(at(3 * 24 * 3600 * 1000).level).toBeLessThan(0.4)
    expect(at(P.DECLINE_END + 1)).toMatchObject({ phase: 'remnant', level: 0.06 })
  })

  it('accepte une date ISO', () => {
    expect(supernovaState('2026-10-23T10:00:00Z', t0 + P.PEAK).phase).toBe('decline')
  })
})

describe('supernovaBands', () => {
  it('ne montre rien avant la lumière', () => {
    expect(bands(P.BREAKOUT_START - 1)).toBeNull()
  })

  it("l'éclair de sortie du choc est surtout UV", () => {
    const b = bands(P.BREAKOUT_START + 0.1 * (P.RISE_START - P.BREAKOUT_START))
    expect(b.uv).toBeCloseTo(1)
    expect(b.uv).toBeGreaterThan(b.visible)
  })

  it("l'IR culmine en fin de déclin, après le visible", () => {
    const early = bands(P.PEAK + 0.1 * (P.DECLINE_END - P.PEAK))
    const late = bands(P.PEAK + 0.55 * (P.DECLINE_END - P.PEAK))
    expect(late.ir).toBeGreaterThan(early.ir)
    expect(late.ir).toBeGreaterThan(late.visible)
  })

  it('la radio monte pendant le déclin et reste au rémanent', () => {
    expect(bands(P.PEAK - 1).radio).toBe(0)
    expect(bands(P.PEAK + 0.5 * (P.DECLINE_END - P.PEAK)).radio).toBeGreaterThan(0.5)
    expect(bands(P.DECLINE_END + 1).radio).toBeGreaterThan(0.5)
  })

  it('la couleur refroidit et la nébuleuse apparaît en fin de déclin', () => {
    const peak = bands(P.PEAK)
    const remnant = bands(P.DECLINE_END + 1)
    expect(remnant.color.b).toBeLessThan(peak.color.b)
    expect(peak.nebula).toBe(0)
    expect(remnant.nebula).toBe(1)
  })
})
