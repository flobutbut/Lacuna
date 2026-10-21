import { describe, expect, it } from 'vitest'
import { formatFrequency, parseFrequency } from './formatUtils'
import { getSpectralLetter, getSpectralLetterFromObject } from './starClassification'
import { parseCoordinates } from './stellarCoordinates'
import { lerpAngle } from './geometry'

describe('fréquences', () => {
  it('formate selon l’unité adaptée', () => {
    expect(formatFrequency(408e6)).toBe('408 MHz')
    expect(formatFrequency(1420e6)).toBe('1.42 GHz')
    expect(formatFrequency(8.4e9)).toBe('8.40 GHz')
    expect(formatFrequency(0)).toBe('—')
  })

  it('relit une fréquence formatée', () => {
    expect(parseFrequency('408 MHz')).toBe(408e6)
    expect(parseFrequency('12 kHz')).toBe(12e3)
    expect(parseFrequency('n’importe quoi')).toBe(1420e6)
  })
})

describe('getSpectralLetter', () => {
  it('extrait la classe principale', () => {
    expect(getSpectralLetter('G2V')).toBe('G')
    expect(getSpectralLetter('sdT1')).toBe('T')
    expect(getSpectralLetter('esdY4')).toBe('Y')
    expect(getSpectralLetter('dM3')).toBe('M')
    expect(getSpectralLetter('DA2')).toBe('D')
    expect(getSpectralLetter('M5.5Ve')).toBe('M')
  })

  it('reconnaît les pulsars', () => {
    expect(getSpectralLetter('PSR J0437-4715')).toBe('PULSAR')
    expect(getSpectralLetterFromObject({ type: 'PULSAR', spectral_type: 'G2V' })).toBe('PULSAR')
  })

  it('retombe sur M sans type', () => {
    expect(getSpectralLetter(null)).toBe('M')
  })
})

describe('parseCoordinates', () => {
  it('lit des degrés décimaux', () => {
    expect(parseCoordinates('217.5 -62.7')).toEqual({ ra: 217.5, dec: -62.7 })
  })

  it('convertit les heures en degrés', () => {
    expect(parseCoordinates('14 30 -62')).toEqual({ ra: 217.5, dec: -62 })
  })

  it('refuse une saisie incomplète', () => {
    expect(parseCoordinates('217')).toBeNull()
  })
})

describe('lerpAngle', () => {
  it('passe par le chemin le plus court', () => {
    expect(lerpAngle(350, 10, 0.5)).toBe(360)
    expect(lerpAngle(10, 350, 0.5)).toBe(0)
  })
})
