import { describe, expect, it } from 'vitest'
import { gameErrorMessage, isGameAlreadyStarted, validatePseudo, validateShipName } from './playerProfile'

describe('validatePseudo', () => {
  it('exige 2 à 24 caractères, espaces en bord ignorés', () => {
    expect(validatePseudo('')).toBe('Choisissez un pseudo.')
    expect(validatePseudo('  J  ')).toBe('Entre 2 et 24 caractères.')
    expect(validatePseudo('x'.repeat(25))).toBe('Entre 2 et 24 caractères.')
    expect(validatePseudo('  Flobutbut  ')).toBeNull()
  })
})

describe('validateShipName', () => {
  it('exige 2 à 32 caractères', () => {
    expect(validateShipName('   ')).toBe('Baptisez votre vaisseau.')
    expect(validateShipName('x'.repeat(33))).toBe('Entre 2 et 32 caractères.')
    expect(validateShipName('Odyssée')).toBeNull()
  })
})

describe('gameErrorMessage', () => {
  it('reprend le message rédigé par start_new_game', () => {
    expect(gameErrorMessage({ code: '22023', message: 'Le pseudo doit faire entre 2 et 24 caractères' })).toBe(
      'Le pseudo doit faire entre 2 et 24 caractères'
    )
  })

  it('reste générique pour une erreur inattendue', () => {
    expect(gameErrorMessage({ code: 'XX000', message: 'internal error' })).toBe('La création de la partie a échoué. Réessayez.')
    expect(gameErrorMessage({ message: 'TypeError: Failed to fetch' })).toMatch(/réseau/)
  })

  it('reconnaît une partie déjà créée', () => {
    expect(isGameAlreadyStarted({ code: '23505' })).toBe(true)
    expect(isGameAlreadyStarted({ code: '22023' })).toBe(false)
  })
})
