import { describe, it, expect } from 'vitest'
import {
  getObjectDeviations,
  getReportDeviations,
  countDeviationSightings,
  BODY_DEVIATION_RATE,
  SPURIOUS_MAX_FIABILITY,
} from './deviations'
import { NIVEAU_ORDER } from '@/constants/lab'

const planet = (i) => ({ id: `obs-${i}`, type: 'PLANET', system_id: `sys-${i}`, name: `Planète ${i}` })
const planets = Array.from({ length: 2000 }, (_, i) => planet(i))

describe('getObjectDeviations', () => {
  it('donne les mêmes écarts pour le même objet, quel que soit le vaisseau', () => {
    const a = getObjectDeviations({ ...planet(7), id: 'vaisseau-a' })
    const b = getObjectDeviations({ ...planet(7), id: 'vaisseau-b' })
    expect(a).toEqual(b)
  })

  it('garde les écarts réels rares chez les corps', () => {
    const withReal = planets.filter((p) => getObjectDeviations(p).real.length > 0).length / planets.length
    expect(withReal).toBeGreaterThan(BODY_DEVIATION_RATE / 2)
    expect(withReal).toBeLessThan(BODY_DEVIATION_RATE * 1.5)
  })

  it("ne donne d'écart réel à un signal que s'il est atypique", () => {
    const signal = { type: 'SIGNAL', support: 'EM_RADIO', system_id: 'psr', name: 'PSR' }
    expect(getObjectDeviations({ ...signal, anomalous: false }).real).toEqual([])
    expect(getObjectDeviations({ ...signal, anomalous: true }).real).toHaveLength(1)
  })

  it('rattache chaque écart à des instruments applicables à l’objet', () => {
    const signal = { type: 'SIGNAL', support: 'GAMMA_X', system_id: 'grb', name: 'GRB', anomalous: true }
    const [d] = getObjectDeviations(signal).real
    for (const id of d.instruments) {
      expect(['analyseur-structure-temporelle', 'analyseur-spectre-energetique']).toContain(id)
    }
  })

  it('utilise les écarts scénarisés quand l’observation en déclare', () => {
    const obs = {
      ...planet(1),
      attributes: { deviations: [{ id: 'fil-75', family: 'ORBITALE', label: 'Résonance', expected: 'a', measured: 'b', min_niveau: 'ORBITE' }] },
    }
    const { real } = getObjectDeviations(obs)
    expect(real).toEqual([
      expect.objectContaining({ id: 'fil-75', family: 'ORBITALE', minNiveau: NIVEAU_ORDER.ORBITE }),
    ])
  })
})

describe('getReportDeviations', () => {
  const withReal = planets.find((p) => getObjectDeviations(p).real.some((d) => d.minNiveau > NIVEAU_ORDER.SYSTEME))

  it('montre une ombre sans valeurs sous le niveau requis, puis les valeurs au niveau atteint', () => {
    const d = getObjectDeviations(withReal).real[0]
    const instrumentId = d.instruments[0]
    const below = getReportDeviations(withReal, instrumentId, { fiability: 90, niveau: d.minNiveau - 1 })
      .find((x) => x.id === d.id)
    expect(below).toMatchObject({ expected: null, measured: null })
    expect(below.requiresNiveau).toBeTruthy()

    const atLevel = getReportDeviations(withReal, instrumentId, { fiability: 90, niveau: d.minNiveau })
      .find((x) => x.id === d.id)
    expect(atLevel).toMatchObject({ expected: d.expected, measured: d.measured, requiresNiveau: null })
  })

  it("ne montre l'écart parasite que sur un rapport peu fiable de son seul instrument", () => {
    const obs = planets.find((p) => {
      const { real, spurious } = getObjectDeviations(p)
      return spurious && real.length === 0
    })
    const { spurious } = getObjectDeviations(obs)
    const [instrumentId] = spurious.instruments
    const at = (fiability) => getReportDeviations(obs, instrumentId, { fiability, niveau: NIVEAU_ORDER.CONTACT })
    expect(at(SPURIOUS_MAX_FIABILITY - 1).map((d) => d.id)).toContain(spurious.id)
    expect(at(SPURIOUS_MAX_FIABILITY)).toEqual([])
  })
})

describe('countDeviationSightings', () => {
  it('compte les rapports qui mesurent un écart, sans les ombres', () => {
    const measured = { id: 'a', requiresNiveau: null }
    const shadow = { id: 'a', requiresNiveau: 'ORBITE' }
    const counts = countDeviationSightings([[measured], [measured], [shadow]])
    expect(counts.get('a')).toBe(2)
  })
})
