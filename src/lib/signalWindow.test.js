import { describe, it, expect } from 'vitest'
import { parseSignalWindow, windowPhaseS, isWindowOpen } from './signalWindow'

const EPOCH = '2026-01-01T00:00:00Z'
const raw = { epoch: EPOCH, cycle_s: 219600, offset_s: 0, duration_s: 2400 }
const epochMs = Date.parse(EPOCH)

describe('parseSignalWindow', () => {
  it('renvoie null sans fenêtre ou avec des valeurs invalides', () => {
    expect(parseSignalWindow(null)).toBeNull()
    expect(parseSignalWindow({ ...raw, cycle_s: 0 })).toBeNull()
    expect(parseSignalWindow({ ...raw, epoch: 'pas une date' })).toBeNull()
  })

  it('normalise les clés', () => {
    expect(parseSignalWindow(raw)).toEqual({ epochMs, cycleS: 219600, offsetS: 0, durationS: 2400 })
  })
})

describe('isWindowOpen', () => {
  const win = parseSignalWindow(raw)

  it('est ouverte pendant les 40 premières minutes du cycle de 61 h', () => {
    expect(isWindowOpen(win, epochMs)).toBe(true)
    expect(isWindowOpen(win, epochMs + 2399 * 1000)).toBe(true)
  })

  it('est fermée ensuite, puis rouverte au cycle suivant', () => {
    expect(isWindowOpen(win, epochMs + 2400 * 1000)).toBe(false)
    expect(isWindowOpen(win, epochMs + 219599 * 1000)).toBe(false)
    expect(isWindowOpen(win, epochMs + 219600 * 1000)).toBe(true)
  })

  it('applique le décalage de phase et gère les dates antérieures à l’époque', () => {
    const shifted = parseSignalWindow({ ...raw, offset_s: 3600 })
    expect(isWindowOpen(shifted, epochMs)).toBe(false)
    expect(isWindowOpen(shifted, epochMs + 3600 * 1000)).toBe(true)
    expect(windowPhaseS(win, epochMs - 1000)).toBe(219599)
  })

  it('un signal sans fenêtre est toujours actif', () => {
    expect(isWindowOpen(null, 0)).toBe(true)
  })
})
