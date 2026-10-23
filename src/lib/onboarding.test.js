import { describe, it, expect } from 'vitest'
import { CATALOGUE_SYSTEM_IDS, isFirstChoicePending } from './onboarding'

describe('onboarding — premier choix', () => {
  it('compte neuf destinations au catalogue', () => {
    expect(CATALOGUE_SYSTEM_IDS.size).toBe(9)
  })

  it('reste affiché tant que le premier cap n’est pas fixé', () => {
    expect(isFirstChoicePending(null)).toBe(false)
    expect(isFirstChoicePending({ voyage: 1, travel_state: 'IDLE' })).toBe(true)
    expect(isFirstChoicePending({ voyage: 1, travel_state: 'IN_TRANSIT' })).toBe(false)
    expect(isFirstChoicePending({ voyage: 2, travel_state: 'IDLE' })).toBe(false)
  })
})
