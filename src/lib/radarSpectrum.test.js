import { describe, expect, it } from 'vitest'
import {
  PULSAR_REFERENCE_MAGNITUDE,
  PULSAR_SNR_MAX,
  RADAR_DB_FLOOR_MARGIN,
  RADAR_DB_MIN_SPAN,
  RADAR_FREQ_BINS,
  ageAtPx,
  ageLabelInterval,
  aliasedFrequencyHz,
  binAtY,
  binToHz,
  binsToYRange,
  columnIndexAt,
  dbDisplayScale,
  dbToLevel,
  formatAgeLabel,
  freqRangeToBins,
  injectPulsarSignals,
  magnitudeToDb,
  pulsarPhaseOffset,
  ticksPerPixel,
} from './radarSpectrum'

describe('ticksPerPixel / ageAtPx', () => {
  it('donne 1 colonne par pixel à 100 ms et 0,1 à 10 ms (zoom ×10)', () => {
    expect(ticksPerPixel(100)).toBe(1)
    expect(ticksPerPixel(10)).toBeCloseTo(0.1)
  })

  it('regroupe les colonnes aux échelles plus longues', () => {
    expect(ticksPerPixel(1000)).toBe(10)
  })

  it('étale une colonne sur 10 pixels à 10 ms', () => {
    const ages = Array.from({ length: 20 }, (_, i) => ageAtPx(99 - i, 100, ticksPerPixel(10)))
    expect(ages.slice(0, 10).every((a) => a === 0)).toBe(true)
    expect(ages.slice(10).every((a) => a === 1)).toBe(true)
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

  it('répète la même colonne sur 10 pixels en zoom ×10', () => {
    expect(columnIndexAt({ ...base, ticksPerPx: 0.1, px: 9 })).toBe(49)
    expect(columnIndexAt({ ...base, ticksPerPx: 0.1, px: 0 })).toBe(49)
    expect(columnIndexAt({ ...base, ticksPerPx: 0.1, innerW: 20, px: 0 })).toBe(48)
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
  const pulsar = { fluxRelative: 1, pulsePeriodS: 1, rotationFrequencyHz: 62.5, phaseOffset: 0 }
  const peak = PULSAR_REFERENCE_MAGNITUDE * PULSAR_SNR_MAX

  it('ajoute une impulsion centrée sur la fréquence de rotation au début de la période', () => {
    const mags = injectPulsarSignals(new Array(RADAR_FREQ_BINS).fill(0), [pulsar], { tSec: 0 })
    expect(mags.indexOf(Math.max(...mags))).toBe(64)
    expect(mags[64]).toBeCloseTo(peak)
    expect(mags[0]).toBe(0)
  })

  it('n’ajoute rien hors de l’impulsion', () => {
    const horsImpulsion = injectPulsarSignals(new Array(RADAR_FREQ_BINS).fill(0), [pulsar], { tSec: 0.5 })
    expect(Math.max(...horsImpulsion)).toBe(0)
  })

  it('voit chaque impulsion qui tombe dans la colonne, quelle que soit la période', () => {
    // Pic à t = 0,93 s : dans la colonne [0,9 ; 1,0] mais pas à son début
    const decale = { ...pulsar, phaseOffset: 0.07 }
    const mags = injectPulsarSignals(new Array(RADAR_FREQ_BINS).fill(0), [decale], { tSec: 0.9, dtSec: 0.1 })
    expect(mags[64]).toBeCloseTo(peak)
  })

  it('décale les phases d’un pulsar à l’autre', () => {
    expect(pulsarPhaseOffset({ id: 'a' })).not.toBe(pulsarPhaseOffset({ id: 'b' }))
    expect(pulsarPhaseOffset({ id: 'a' })).toBe(pulsarPhaseOffset({ id: 'a' }))
    expect(pulsarPhaseOffset({ id: 'a', phaseOffset: 0.3 })).toBe(0.3)
  })

  it('suit le flux relatif', () => {
    const faible = injectPulsarSignals(new Array(RADAR_FREQ_BINS).fill(0), [{ ...pulsar, fluxRelative: 0.1 }], { tSec: 0 })
    expect(faible[64]).toBeCloseTo(peak * Math.pow(0.1, 0.6))
  })

  it('replie un pulsar milliseconde au-delà de Nyquist', () => {
    expect(aliasedFrequencyHz(300)).toBeCloseTo(50)
    expect(aliasedFrequencyHz(366.6)).toBeCloseTo(116.6)
    const mags = injectPulsarSignals(new Array(RADAR_FREQ_BINS).fill(0), [{ ...pulsar, rotationFrequencyHz: 300 }], { tSec: 0 })
    expect(mags.indexOf(Math.max(...mags))).toBe(51)
    expect(mags[0]).toBe(0)
  })
})

describe('dbDisplayScale / dbToLevel', () => {
  it('place le plancher sous le bruit médian et garde une étendue minimale', () => {
    const bruit = new Float32Array(1000).fill(magnitudeToDb(0.01))
    const scale = dbDisplayScale(bruit)
    expect(scale.floorDb).toBeCloseTo(-40 - RADAR_DB_FLOOR_MARGIN + 0.5, 0)
    expect(scale.spanDb).toBe(RADAR_DB_MIN_SPAN)
    expect(dbToLevel(magnitudeToDb(0.01), scale)).toBeCloseTo(RADAR_DB_FLOOR_MARGIN / RADAR_DB_MIN_SPAN, 1)
  })

  it('met le maximum de la fenêtre en haut de la palette', () => {
    const values = new Float32Array(1000).fill(magnitudeToDb(0.01))
    values[10] = magnitudeToDb(1)
    const scale = dbDisplayScale(values)
    expect(dbToLevel(values[10], scale)).toBe(1)
    expect(dbToLevel(values[0], scale)).toBeLessThan(0.25)
  })

  it('ignore les pixels sans données', () => {
    expect(dbDisplayScale(new Float32Array(10).fill(NaN))).toBeNull()
  })
})

describe('formatAgeLabel', () => {
  it('formate secondes et minutes', () => {
    expect(formatAgeLabel(300)).toBe('-30s')
    expect(formatAgeLabel(600)).toBe('-1:00')
    expect(formatAgeLabel(900)).toBe('-1:30')
  })
})

describe('binAtY / binsToYRange (fréquences ↔ hauteur)', () => {
  const geom = { top: 8, innerH: 128, binLow: 0, binRange: 128 }

  it('place les hautes fréquences en haut', () => {
    expect(binAtY(8, geom)).toBe(127)
    expect(binAtY(8 + 127.5, geom)).toBe(0)
    expect(binAtY(7, geom)).toBeNull()
    expect(binAtY(8 + 128, geom)).toBeNull()
  })

  it('tient compte du zoom fréquentiel', () => {
    const zoom = { top: 0, innerH: 100, binLow: 64, binRange: 32 }
    expect(binAtY(0, zoom)).toBe(95)
    expect(binAtY(99.9, zoom)).toBe(64)
  })

  it('redonne la bande des bins sélectionnés (aller-retour)', () => {
    const r = binsToYRange(96, 64, geom)
    expect(binAtY(r.y + 0.1, geom)).toBe(96)
    expect(binAtY(r.y + r.h - 0.1, geom)).toBe(64)
    expect(binsToYRange(0, 10, { ...geom, binLow: 64, binRange: 64 })).toBeNull()
  })

  it('convertit un bin en Hz', () => {
    expect(binToHz(64)).toBeCloseTo(62.5)
    expect(binToHz(128)).toBeCloseTo(125)
  })
})

describe('ageLabelInterval', () => {
  it('garde des repères espacés quand l’échelle grossit', () => {
    expect(ageLabelInterval(1)).toBe(300)
    expect(ageLabelInterval(10)).toBe(3000)
    expect(ageLabelInterval(0.1)).toBe(30)
  })
})
