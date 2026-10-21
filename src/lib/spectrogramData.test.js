import { describe, expect, it } from 'vitest'
import { SAMPLE_RATE, computeSpectrogramColumn } from './spectrogramData'

describe('computeSpectrogramColumn', () => {
  it('range les fréquences en ordre croissant (bin k = k × 250 / 256 Hz)', () => {
    const values = Array.from({ length: 256 }, (_, i) => Math.sin((2 * Math.PI * 12.5 * i) / SAMPLE_RATE))
    const { magnitudes } = computeSpectrogramColumn(values, 128)
    expect(magnitudes).toHaveLength(128)
    expect(magnitudes.indexOf(Math.max(...magnitudes))).toBe(13)
  })

  it('montre une impulsion brève sur toute la bande, et pas une fois sortie de la fenêtre', () => {
    const impulsion = new Array(256).fill(0)
    impulsion[128] = 1
    const { magnitudes } = computeSpectrogramColumn(impulsion, 128)
    expect(Math.min(...magnitudes.slice(1, 120))).toBeGreaterThan(0.5 * Math.max(...magnitudes))
    const auBord = new Array(256).fill(0)
    auBord[0] = 1
    // Hors bins 0–1 (valeur moyenne retirée), presque rien : l'impulsion au bord est atténuée par la fenêtre
    expect(Math.max(...computeSpectrogramColumn(auBord, 128).magnitudes.slice(2))).toBeLessThan(0.01 * Math.max(...magnitudes))
  })
})
