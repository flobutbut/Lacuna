import { describe, it, expect } from 'vitest'
import { buildObservationPayload, signalToObsPayload } from './observationPayload'

const NIVEAUX = { PASSIF: 'Passif', SYSTEME: 'Système', ORBITE: 'Orbite proche', CONTACT: 'Contact' }

describe('buildObservationPayload', () => {
  const context = { systemName: 'Proxima Centauri', systemId: 'PROXIMA', distance: '4,2 al', displayName: 'Proxima b' }

  it('conserve la désignation du corps observé', () => {
    const payload = buildObservationPayload({ type: 'PLANETE', designation: 'b' }, context, NIVEAUX)
    expect(payload.attributes).toEqual({ body_designation: 'b' })
  })

  it('n’ajoute rien sans désignation', () => {
    expect(buildObservationPayload({ type: 'PLANETE' }, context, NIVEAUX).attributes).toEqual({})
  })
})

describe('signalToObsPayload', () => {
  const emitter = {
    sourceType: 'EMITTER',
    sourceSystemId: 'PROXIMA',
    frequency: '1420 MHz',
    azimuth: 0,
    polarization: 'circulaire gauche',
    pulsePeriodS: 73,
    durationSec: 300,
  }

  it('rattache un émetteur à son système et reprend les mesures du signal', () => {
    const payload = signalToObsPayload(emitter, NIVEAUX, 'Proxima Centauri')
    expect(payload.system_id).toBe('PROXIMA')
    expect(payload.system).toBe('Proxima Centauri')
    expect(payload.attributes).toEqual({ polarization: 'circulaire gauche', pulse_period_s: 73 })
  })

  it('laisse un signal lointain sans système', () => {
    const payload = signalToObsPayload({ ...emitter, sourceType: 'PULSAR' }, NIVEAUX)
    expect(payload.system_id).toBeNull()
  })
})
