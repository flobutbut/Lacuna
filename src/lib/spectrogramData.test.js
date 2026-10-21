import { describe, expect, it } from 'vitest'
import { SAMPLE_RATE, computeSpectrogramColumn } from './spectrogramData'

describe('computeSpectrogramColumn', () => {
  it('range les fréquences en ordre croissant (bin k = k × 250 / 256 Hz)', () => {
    const values = Array.from({ length: 256 }, (_, i) => Math.sin((2 * Math.PI * 12.5 * i) / SAMPLE_RATE))
    const { magnitudes } = computeSpectrogramColumn(values, 128)
    expect(magnitudes).toHaveLength(128)
    expect(magnitudes.indexOf(Math.max(...magnitudes))).toBe(13)
  })
})
