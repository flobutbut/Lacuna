import { describe, expect, it } from 'vitest'
import {
  RADAR_FREQ_BINS,
  columnIndexAt,
  formatAgeLabel,
  freqRangeToBins,
  injectPulsarSignals,
  ticksPerPixel,
} from './radarSpectrum'

describe('ticksPerPixel', () => {
  it('donne 1 colonne par pixel à 100 ms et au-dessous', () => {
    expect(ticksPerPixel(100)).toBe(1)
    expect(ticksPerPixel(10)).toBe(1)
  })

  it('regroupe les colonnes aux échelles plus longues', () => {
    expect(ticksPerPixel(1000)).toBe(10)
  })
})

describe('columnIndexAt', () => {
  const base = { writeCol: 50, innerW: 10, ticksPerPx: 1, historySize: 100 }

  it('place la colonne la plus récente au dernier pixel', () => {
    expect(columnIndexAt({ ...base, px: 9 })).toBe(49)
    expect(columnIndexAt({ ...base, px: 0 })).toBe(40)
  })

  it('reboucle dans le buffer circulaire', () => {
    expect(columnIndexAt({ ...base, writeCol: 2, px: 0 })).toBe(92)
  })

  it('recule dans le passé avec le défilement', () => {
    expect(columnIndexAt({ ...base, px: 9, scrollOffset: 5 })).toBe(44)
  })
})

describe('freqRangeToBins', () => {
  it('couvre tous les bins sur 0–125 Hz', () => {
    expect(freqRangeToBins(0, 125)).toEqual({ binLow: 0, binHigh: RADAR_FREQ_BINS, binRange: RADAR_FREQ_BINS })
  })

  it('n’a jamais une plage nulle', () => {
    expect(freqRangeToBins(0, 0).binRange).toBe(1)
  })
})

describe('injectPulsarSignals', () => {
  const pulsar = { fluxRelative: 1, pulsePeriodS: 1, rotationFrequencyHz: 62.5 }

  it('ajoute une impulsion centrée sur la fréquence de rotation au début de la période', () => {
    const mags = injectPulsarSignals(new Array(RADAR_FREQ_BINS).fill(0), [pulsar], { tSec: 0 })
    const peak = mags.indexOf(Math.max(...mags))
    expect(peak).toBe(64)
    expect(mags[64]).toBeCloseTo(0.8)
    expect(mags[0]).toBe(0)
  })

  it('n’ajoute rien hors de l’impulsion ou sous le seuil', () => {
    const horsImpulsion = injectPulsarSignals(new Array(RADAR_FREQ_BINS).fill(0), [pulsar], { tSec: 0.5 })
    expect(Math.max(...horsImpulsion)).toBe(0)
    const sousSeuil = injectPulsarSignals(new Array(RADAR_FREQ_BINS).fill(0), [{ ...pulsar, fluxRelative: 0.1 }], { tSec: 0, threshold: 0.5 })
    expect(Math.max(...sousSeuil)).toBe(0)
  })

  it('étale un pulsar milliseconde sur tous les bins', () => {
    const mags = injectPulsarSignals(new Array(RADAR_FREQ_BINS).fill(0), [{ ...pulsar, rotationFrequencyHz: 500 }], { tSec: 0 })
    expect(mags.every((m) => m > 0)).toBe(true)
    expect(mags[0]).toBeCloseTo(0.08)
  })
})

describe('formatAgeLabel', () => {
  it('formate secondes et minutes', () => {
    expect(formatAgeLabel(300)).toBe('-30s')
    expect(formatAgeLabel(600)).toBe('-1:00')
    expect(formatAgeLabel(900)).toBe('-1:30')
  })
})
