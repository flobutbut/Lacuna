import { describe, expect, it } from 'vitest'
import {
  PULSAR_PULSE_AMPLITUDE,
  RADAR_DB_FLOOR_MARGIN,
  RADAR_DB_MIN_SPAN,
  RADAR_FREQ_BINS,
  addPulsarPulses,
  ageAtPx,
  angularSeparationDeg,
  beamGain,
  pulsarsInBeam,
  ageLabelInterval,
  binAtY,
  binToHz,
  binsToYRange,
  columnIndexAt,
  dbDisplayScale,
  dbToLevel,
  formatAgeLabel,
  freqRangeToBins,
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

describe('addPulsarPulses', () => {
  const pulsar = { fluxRelative: 1, pulsePeriodS: 1, phaseOffset: 0 }
  const peaks = (chunk) => Array.from(chunk).flatMap((v, i) => (v > PULSAR_PULSE_AMPLITUDE * 0.9 ? [i] : []))

  it('place une impulsion par période, à la phase du pulsar', () => {
    const chunk = addPulsarPulses(new Float32Array(1000), [pulsar], { startSample: 0, sampleRate: 250 })
    expect(peaks(chunk)).toEqual([0, 250, 500, 750])
    expect(chunk[250]).toBeCloseTo(PULSAR_PULSE_AMPLITUDE)
    expect(chunk[125]).toBe(0)
  })

  it('reste continu d’un bloc à l’autre', () => {
    const decale = { ...pulsar, phaseOffset: 0.5 }
    const entier = addPulsarPulses(new Float32Array(500), [decale], { startSample: 0, sampleRate: 250 })
    const a = addPulsarPulses(new Float32Array(126), [decale], { startSample: 0, sampleRate: 250 })
    const b = addPulsarPulses(new Float32Array(374), [decale], { startSample: 126, sampleRate: 250 })
    expect([...a, ...b].map((v) => v.toFixed(6))).toEqual([...entier].map((v) => v.toFixed(6)))
    expect(peaks(entier)).toEqual([125, 375])
  })

  it('suit le flux relatif et ignore un pulsar sans flux', () => {
    const faible = addPulsarPulses(new Float32Array(10), [{ ...pulsar, fluxRelative: 0.1 }], { startSample: 0, sampleRate: 250 })
    expect(faible[0]).toBeCloseTo(PULSAR_PULSE_AMPLITUDE * Math.pow(0.1, 0.6))
    const nul = addPulsarPulses(new Float32Array(10), [{ ...pulsar, fluxRelative: 0 }], { startSample: 0, sampleRate: 250 })
    expect(Math.max(...nul)).toBe(0)
  })

  it('décale les phases d’un pulsar à l’autre', () => {
    expect(pulsarPhaseOffset({ id: 'a' })).not.toBe(pulsarPhaseOffset({ id: 'b' }))
    expect(pulsarPhaseOffset({ id: 'a' })).toBe(pulsarPhaseOffset({ id: 'a' }))
    expect(pulsarPhaseOffset({ id: 'a', phaseOffset: 0.3 })).toBe(0.3)
  })
})

describe('faisceau du télescope', () => {
  it('mesure l’écart angulaire entre deux directions', () => {
    expect(angularSeparationDeg(10, 0, 20, 0)).toBeCloseTo(10)
    expect(angularSeparationDeg(0, 89, 180, 89)).toBeCloseTo(2)
    expect(angularSeparationDeg(350, 0, 10, 0)).toBeCloseTo(20)
  })

  it('donne un gain de 1 dans l’axe et 0,5 à mi-largeur', () => {
    expect(beamGain(0, 10)).toBe(1)
    expect(beamGain(5, 10)).toBeCloseTo(0.5)
  })

  it('ne garde que les pulsars proches de la direction visée, avec leur gain', () => {
    const pulsars = [
      { id: 'axe', azimuth: 100, elevation: 10 },
      { id: 'bord', azimuth: 105, elevation: 10 },
      { id: 'loin', azimuth: 200, elevation: -30 },
    ]
    const captes = pulsarsInBeam(pulsars, { ra: 100, dec: 10 }, 'L')
    expect(captes.map((p) => p.id)).toEqual(['axe', 'bord'])
    expect(captes[0].beamGain).toBeCloseTo(1)
    expect(captes[1].beamGain).toBeGreaterThan(0.4)
    expect(captes[1].beamGain).toBeLessThan(0.6)
    // Faisceau γ plus large : le même écart compte moins
    expect(pulsarsInBeam(pulsars, { ra: 100, dec: 10 }, 'G')[1].beamGain).toBeGreaterThan(0.9)
  })

  it('atténue les impulsions d’un pulsar hors de l’axe', () => {
    const chunk = addPulsarPulses(new Float32Array(10), [{ fluxRelative: 1, pulsePeriodS: 1, phaseOffset: 0, beamGain: 0.5 }], { startSample: 0, sampleRate: 250 })
    expect(chunk[0]).toBeCloseTo(PULSAR_PULSE_AMPLITUDE * 0.5)
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
