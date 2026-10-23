import { describe, it, expect } from 'vitest'
import { generateNeutrinoData } from './neutrinoData'

describe('generateNeutrinoData', () => {
  it('est déterministe pour une même observation', () => {
    const a = generateNeutrinoData({ obsId: 'obs-n', fiability: 80 })
    expect(generateNeutrinoData({ obsId: 'obs-n', fiability: 80 })).toEqual(a)
  })

  it('reprend les mesures du signal', () => {
    const d = generateNeutrinoData({
      obsId: 'x',
      fiability: 100,
      attributes: { event_count: 300, duration_s: 10, mean_energy_mev: 12, direction: { ra: 88.8, dec: 7.4 }, uncertainty_deg: 3 },
    })
    expect(d.total).toBe(300)
    expect(d.durationS).toBe(10)
    expect(d.direction).toEqual({ ra: 88.8, dec: 7.4 })
    expect(d.uncertaintyDeg).toBe(3)
    expect(d.background).toBe(0)
    const sum = d.timeBins.reduce((s, b) => s + b.count, 0)
    expect(sum).toBeGreaterThan(290)
    expect(sum).toBeLessThan(310)
  })

  it('décroît dans le temps : plus d’événements au début de la bouffée', () => {
    const d = generateNeutrinoData({ obsId: 'y', fiability: 100, attributes: { event_count: 2000 } })
    const first = d.timeBins.slice(0, 5).reduce((s, b) => s + b.count, 0)
    const last = d.timeBins.slice(-5).reduce((s, b) => s + b.count, 0)
    expect(first).toBeGreaterThan(last * 3)
  })

  it('montre un taux qui monte pour la pré-supernova', () => {
    const d = generateNeutrinoData({ obsId: 'p', fiability: 100, attributes: { event_count: 2000, duration_s: 300, profile: 'rising' } })
    const first = d.timeBins.slice(0, 5).reduce((s, b) => s + b.count, 0)
    const last = d.timeBins.slice(-5).reduce((s, b) => s + b.count, 0)
    expect(last).toBeGreaterThan(first * 3)
    expect(d.timeBins[d.timeBins.length - 1].t1).toBeCloseTo(300)
  })

  it('remet à l’échelle une bouffée de plusieurs millions d’événements', () => {
    const d = generateNeutrinoData({ obsId: 'z', fiability: 100, attributes: { event_count: 3_000_000 } })
    const sum = d.timeBins.reduce((s, b) => s + b.count, 0)
    expect(sum / 3_000_000).toBeGreaterThan(0.99)
    expect(sum / 3_000_000).toBeLessThan(1.01)
  })

  it('élargit le cône de direction quand la fiabilité baisse', () => {
    const att = { direction: { ra: 0, dec: 0 }, uncertainty_deg: 4 }
    const good = generateNeutrinoData({ obsId: 'w', fiability: 100, attributes: att })
    const poor = generateNeutrinoData({ obsId: 'w', fiability: 50, attributes: att })
    expect(poor.uncertaintyDeg).toBeGreaterThan(good.uncertaintyDeg)
  })
})
