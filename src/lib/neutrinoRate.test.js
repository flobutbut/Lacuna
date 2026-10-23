import { describe, it, expect } from 'vitest'
import { expectedNeutrinoRate, neutrinoCount, neutrinoCountsWindow, NEUTRINO_BACKGROUND_RATE } from './neutrinoRate'

const t0 = Date.parse('2026-10-23T12:00:00Z')
const t0s = t0 / 1000

describe('expectedNeutrinoRate', () => {
  it('ne contient que le bruit de fond sans supernova ou avant la montée', () => {
    expect(expectedNeutrinoRate(null, t0s)).toBe(NEUTRINO_BACKGROUND_RATE)
    expect(expectedNeutrinoRate(t0, t0s - 600)).toBe(NEUTRINO_BACKGROUND_RATE)
  })

  it('monte pendant les 5 minutes de pré-supernova', () => {
    const early = expectedNeutrinoRate(t0, t0s - 290)
    const late = expectedNeutrinoRate(t0, t0s - 10)
    expect(late).toBeGreaterThan(early * 20)
  })

  it('intègre ~200 événements sur la montée et ~5 millions sur la bouffée', () => {
    let pre = 0
    // Pas de 0,1 s centrés : on ne touche pas l'instant T0 lui-même
    for (let s = -299.95; s < 0; s += 0.1) pre += (expectedNeutrinoRate(t0, t0s + s) - NEUTRINO_BACKGROUND_RATE) * 0.1
    let burst = 0
    for (let s = 0; s < 60; s += 0.01) burst += (expectedNeutrinoRate(t0, t0s + s) - NEUTRINO_BACKGROUND_RATE) * 0.01
    expect(pre).toBeGreaterThan(190)
    expect(pre).toBeLessThan(210)
    expect(burst / 5_000_000).toBeGreaterThan(0.99)
  })

  it('retombe au bruit de fond après la bouffée', () => {
    expect(expectedNeutrinoRate(t0, t0s + 120)).toBeCloseTo(NEUTRINO_BACKGROUND_RATE, 5)
  })
})

describe('neutrinoCount', () => {
  it('est déterministe', () => {
    expect(neutrinoCount(t0, t0s - 3)).toBe(neutrinoCount(t0, t0s - 3))
  })

  it('compte des centaines de milliers au début de la bouffée', () => {
    expect(neutrinoCount(t0, t0s)).toBeGreaterThan(100_000)
  })

  it('rend une fenêtre de la bonne taille, la plus récente en dernier', () => {
    const w = neutrinoCountsWindow(t0, t0s, 600)
    expect(w).toHaveLength(600)
    expect(w[599]).toBe(neutrinoCount(t0, t0s))
    expect(w[0]).toBeLessThan(5)
  })
})
