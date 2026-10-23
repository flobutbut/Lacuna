import { describe, expect, it } from 'vitest'
import { isExistingAccount, parseEmailLink } from './authLinks'

describe('parseEmailLink', () => {
  it('lit le jeton d’un lien de confirmation', () => {
    expect(parseEmailLink('?token_hash=abc&type=signup', 'signup')).toEqual({ tokenHash: 'abc', type: 'signup' })
    expect(parseEmailLink('?token_hash=abc&type=email', 'signup')).toEqual({ tokenHash: 'abc', type: 'email' })
  })

  it('lit le jeton d’un lien de réinitialisation', () => {
    expect(parseEmailLink('?token_hash=abc&type=recovery', 'recovery')).toEqual({ tokenHash: 'abc', type: 'recovery' })
  })

  it('refuse un type qui ne correspond pas à la page', () => {
    expect(parseEmailLink('?token_hash=abc&type=recovery', 'signup')).toBeNull()
    expect(parseEmailLink('?token_hash=abc&type=signup', 'recovery')).toBeNull()
  })

  it('lien incomplet ou absent', () => {
    expect(parseEmailLink('?type=signup', 'signup')).toBeNull()
    expect(parseEmailLink('', 'signup')).toBeNull()
    expect(parseEmailLink(undefined, 'signup')).toBeNull()
  })
})

describe('isExistingAccount', () => {
  it('utilisateur sans identité : adresse déjà inscrite', () => {
    expect(isExistingAccount({ identities: [] })).toBe(true)
  })

  it('nouvelle inscription ou réponse sans utilisateur', () => {
    expect(isExistingAccount({ identities: [{ id: 'i' }] })).toBe(false)
    expect(isExistingAccount(null)).toBe(false)
    expect(isExistingAccount({})).toBe(false)
  })
})
