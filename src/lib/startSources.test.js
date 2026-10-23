import { describe, it, expect } from 'vitest'
import { START_CONTINUUM, START_PULSARS, continuumLevel } from './startSources'

const [synchrotron, k452] = START_CONTINUUM
const start = Date.parse('2026-10-23T14:00:00Z')
const MIN = 60 * 1000

describe('sources du ciel de départ', () => {
  it('PSR B1919+21 bat à 1,337 s en bande L', () => {
    expect(START_PULSARS[0]).toMatchObject({ band: 'L', pulsePeriodS: 1.337, azimuth: 290, elevation: 22 })
  })

  it('le synchrotron émet en permanence, en bande P', () => {
    expect(synchrotron.band).toBe('P')
    expect(continuumLevel(synchrotron, null)).toBeCloseTo(0.85)
    expect(continuumLevel(synchrotron, start, start + 1000 * MIN)).toBeCloseTo(0.85)
  })

  it('SN-2341-K452 décroît jusqu’à s’éteindre une heure après la création', () => {
    expect(continuumLevel(k452, start, start)).toBeCloseTo(0.85)
    expect(continuumLevel(k452, start, start + 30 * MIN)).toBeCloseTo(0.425)
    expect(continuumLevel(k452, start, start + 60 * MIN)).toBe(0)
    expect(continuumLevel(k452, null, start)).toBe(0)
  })
})
