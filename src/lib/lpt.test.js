import { describe, it, expect } from 'vitest'
import {
  parseLpt,
  lptPulse,
  lptPulses,
  lptActivePulse,
  lptMeasuredPeriod,
  LPT_PERIOD_S,
  LPT_MAX_PULSES,
} from './lpt'

const raw = { epoch: '2026-10-01T00:00:00Z', period_s: LPT_PERIOD_S, first_k: 1476 }
const lpt = parseLpt(raw)
const startOf = (k) => lpt.epochMs + k * LPT_PERIOD_S * 1000

describe('parseLpt', () => {
  it('lit la phase stockée', () => {
    expect(lpt).toEqual({ epochMs: Date.parse(raw.epoch), periodS: LPT_PERIOD_S, firstK: 1476 })
  })

  it('refuse une phase incomplète', () => {
    expect(parseLpt(null)).toBeNull()
    expect(parseLpt({ epoch: 'x', first_k: 1 })).toBeNull()
    expect(parseLpt({ epoch: raw.epoch })).toBeNull()
  })
})

describe('lptPulse', () => {
  it('est déterministe et reste dans les plages de la doc', () => {
    for (let k = 0; k < 500; k++) {
      const p = lptPulse(lpt, k)
      expect(p).toEqual(lptPulse(lpt, k))
      expect(p.durationS).toBeGreaterThanOrEqual(30)
      expect(p.durationS).toBeLessThanOrEqual(300)
      expect(p.intensity).toBeGreaterThanOrEqual(1)
      expect(p.intensity).toBeLessThanOrEqual(100)
      expect(p.linearPct).toBeGreaterThanOrEqual(10)
      expect(p.linearPct).toBeLessThanOrEqual(100)
      expect(Math.abs(p.circularPct)).toBeLessThanOrEqual(5)
    }
  })

  it('varie d’une impulsion à l’autre', () => {
    const intensities = new Set(Array.from({ length: 20 }, (_, k) => lptPulse(lpt, k).intensity))
    expect(intensities.size).toBeGreaterThan(10)
  })

  it('commence à époque + k × période', () => {
    expect(lptPulse(lpt, 1476).startMs).toBe(startOf(1476))
  })
})

describe('lptPulses', () => {
  it('ne compte que les impulsions commencées depuis la première', () => {
    expect(lptPulses(lpt, startOf(1476) - 1)).toHaveLength(0)
    expect(lptPulses(lpt, startOf(1476))).toHaveLength(1)
    expect(lptPulses(lpt, startOf(1478) + 1000).map((p) => p.k)).toEqual([1476, 1477, 1478])
  })

  it(`s'arrête à ${LPT_MAX_PULSES} impulsions`, () => {
    expect(lptPulses(lpt, startOf(1476 + 200))).toHaveLength(LPT_MAX_PULSES)
  })
})

describe('lptActivePulse', () => {
  it('monte puis redescend pendant la durée de l’impulsion', () => {
    const p = lptPulse(lpt, 1477)
    const mid = lptActivePulse(lpt, p.startMs + (p.durationS * 1000) / 2)
    expect(mid.pulse.k).toBe(1477)
    expect(mid.envelope).toBeCloseTo(1)
    expect(lptActivePulse(lpt, p.startMs + p.durationS * 1000 + 1)).toBeNull()
  })

  it('reste muet avant la première impulsion reçue', () => {
    const p = lptPulse(lpt, 1475)
    expect(lptActivePulse(lpt, p.startMs + 1000)).toBeNull()
  })
})

describe('lptMeasuredPeriod', () => {
  it('ne donne rien avec une seule impulsion', () => {
    expect(lptMeasuredPeriod(lptPulses(lpt, startOf(1476)))).toBeNull()
  })

  it('retrouve la période, plus précise avec plus d’impulsions', () => {
    const two = lptMeasuredPeriod(lptPulses(lpt, startOf(1477)))
    const five = lptMeasuredPeriod(lptPulses(lpt, startOf(1480)))
    expect(two.periodS).toBeCloseTo(LPT_PERIOD_S, 3)
    expect(five.uncertaintyS).toBeLessThan(two.uncertaintyS)
  })
})
