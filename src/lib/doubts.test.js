import { describe, it, expect } from 'vitest'
import {
  getEffectiveNiveau,
  getOpenDoubts,
  isInstrumentRelaunchable,
  distanceBetweenSystems,
} from './doubts'
import { NIVEAU_ORDER } from '@/constants/lab'

const shadow = (id, requiresNiveau = 'ORBITE') => ({ id, family: 'GRAVITATIONNELLE', label: 'x', expected: null, measured: null, requiresNiveau })
const measured = (id) => ({ id, family: 'GRAVITATIONNELLE', label: 'x', expected: 'a', measured: 'b', requiresNiveau: null })
const obs = { id: 'o', type: 'PLANETE', system_id: 'proxima', name: 'Proxima c', niveau: 'Système' }

describe('getEffectiveNiveau', () => {
  it('relève un corps du système courant au moins à l’orbite proche', () => {
    expect(getEffectiveNiveau(obs, 'sol')).toBe(NIVEAU_ORDER.SYSTEME)
    expect(getEffectiveNiveau(obs, 'proxima')).toBe(NIVEAU_ORDER.ORBITE)
    expect(getEffectiveNiveau({ ...obs, niveau: 'Contact' }, 'proxima')).toBe(NIVEAU_ORDER.CONTACT)
  })

  it('ne relève pas un signal', () => {
    expect(getEffectiveNiveau({ ...obs, type: 'SIGNAL', niveau: 'Passif' }, 'proxima')).toBe(NIVEAU_ORDER.PASSIF)
  })
})

describe('getOpenDoubts', () => {
  const reports = [
    { instrumentId: 'analyseur-orbital', fiability: 80, deviations: [shadow('a')] },
    { instrumentId: 'analyseur-gravimetrique', fiability: 70, deviations: [shadow('a'), shadow('b', 'CONTACT')] },
  ]

  it('regroupe une ombre vue par plusieurs instruments', () => {
    const [a] = getOpenDoubts(obs, reports, NIVEAU_ORDER.SYSTEME)
    expect(a).toMatchObject({ id: 'a', requiresNiveau: 'ORBITE', reachable: false })
    expect(a.instrumentIds).toEqual(['analyseur-orbital', 'analyseur-gravimetrique'])
  })

  it('dit quand le niveau actuel suffit', () => {
    const doubts = getOpenDoubts(obs, reports, NIVEAU_ORDER.ORBITE)
    expect(doubts.find((d) => d.id === 'a').reachable).toBe(true)
    expect(doubts.find((d) => d.id === 'b').reachable).toBe(false)
  })

  it('lève un doute dès qu’un rapport mesure l’écart', () => {
    const lifted = [...reports, { instrumentId: 'analyseur-orbital', fiability: 80, deviations: [measured('a')] }]
    expect(getOpenDoubts(obs, lifted, NIVEAU_ORDER.ORBITE).map((d) => d.id)).toEqual(['b'])
  })
})

describe('isInstrumentRelaunchable', () => {
  it('ne relance qu’un instrument qui a deviné un doute désormais à portée', () => {
    const doubts = [{ id: 'a', instrumentIds: ['analyseur-orbital'], reachable: true }, { id: 'b', instrumentIds: ['magnetometre'], reachable: false }]
    expect(isInstrumentRelaunchable('analyseur-orbital', doubts)).toBe(true)
    expect(isInstrumentRelaunchable('magnetometre', doubts)).toBe(false)
    expect(isInstrumentRelaunchable('spectro-stellaire', doubts)).toBe(false)
  })
})

describe('distanceBetweenSystems', () => {
  it('mesure la distance entre deux systèmes en coordonnées cartésiennes', () => {
    const sol = { coordinates: { x: 0, y: 0, z: 0 } }
    const target = { coordinates: { x: 3, y: 4, z: 0 } }
    expect(distanceBetweenSystems(sol, target)).toBe(5)
    expect(distanceBetweenSystems(null, target)).toBeNull()
  })
})
