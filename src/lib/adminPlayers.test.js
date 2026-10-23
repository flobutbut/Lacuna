import { describe, expect, it } from 'vitest'
import { describeAction, filterPlayers, formatAdminDate, isSuspended, playerStatus } from './adminPlayers'

const NOW = Date.parse('2026-10-23T12:00:00Z')

const bob = {
  user_id: 'b',
  email: 'bob@exemple.fr',
  email_confirmed: true,
  pseudo: 'Bob',
  ship_id: 's1',
  ship_name: 'Artémis',
  banned_until: null,
}
const zoe = {
  user_id: 'z',
  email: 'zoe@exemple.fr',
  email_confirmed: true,
  pseudo: 'Zoé',
  ship_id: 's2',
  ship_name: 'Odyssée',
  banned_until: '2126-10-23T12:00:00Z',
}
const nul = {
  user_id: 'n',
  email: 'nul@exemple.fr',
  email_confirmed: true,
  pseudo: null,
  ship_id: null,
  ship_name: null,
  banned_until: null,
}
const non = {
  user_id: 'c',
  email: 'c@exemple.fr',
  email_confirmed: false,
  pseudo: null,
  ship_id: null,
  ship_name: null,
  banned_until: null,
}
const players = [bob, zoe, nul, non]

describe('statut d’un compte', () => {
  it('suspendu tant que banned_until est dans le futur', () => {
    expect(isSuspended(zoe, NOW)).toBe(true)
    expect(isSuspended({ banned_until: '2020-01-01T00:00:00Z' }, NOW)).toBe(false)
    expect(isSuspended(bob, NOW)).toBe(false)
  })

  it('priorité : suspendu, email non confirmé, sans partie, actif', () => {
    expect(playerStatus(zoe, NOW)).toBe('suspended')
    expect(playerStatus({ ...non, banned_until: zoe.banned_until }, NOW)).toBe('suspended')
    expect(playerStatus(non, NOW)).toBe('unconfirmed')
    expect(playerStatus(nul, NOW)).toBe('no-game')
    expect(playerStatus(bob, NOW)).toBe('active')
  })
})

describe('filtre de la liste', () => {
  const ids = (list) => list.map((p) => p.user_id)

  it('par statut', () => {
    expect(ids(filterPlayers(players, { filter: 'all' }, NOW))).toEqual(['b', 'z', 'n', 'c'])
    expect(ids(filterPlayers(players, { filter: 'active' }, NOW))).toEqual(['b'])
    expect(ids(filterPlayers(players, { filter: 'suspended' }, NOW))).toEqual(['z'])
    expect(ids(filterPlayers(players, { filter: 'no-game' }, NOW))).toEqual(['n', 'c'])
  })

  it('par texte, sans tenir compte de la casse ni des accents', () => {
    expect(ids(filterPlayers(players, { query: 'ZOE' }, NOW))).toEqual(['z'])
    expect(ids(filterPlayers(players, { query: 'artemis' }, NOW))).toEqual(['b'])
    expect(ids(filterPlayers(players, { query: '  odyssee ' }, NOW))).toEqual(['z'])
    expect(ids(filterPlayers(players, { query: 'exemple.fr' }, NOW))).toEqual(['b', 'z', 'n', 'c'])
    expect(filterPlayers(players, { query: 'introuvable' }, NOW)).toEqual([])
  })

  it('statut et texte se cumulent', () => {
    expect(ids(filterPlayers(players, { filter: 'suspended', query: 'bob' }, NOW))).toEqual([])
  })
})

describe('journal de modération', () => {
  it('décrit une suspension avec son motif', () => {
    expect(describeAction({ action: 'suspend', details: { reason: 'Pseudo injurieux' } })).toEqual({
      label: 'Suspension',
      detail: 'Motif : Pseudo injurieux',
    })
  })

  it('décrit un renommage avec les valeurs avant / après', () => {
    const { label, detail } = describeAction({
      action: 'rename',
      details: { pseudo: { before: 'Bob', after: 'Joueur 42' }, ship_name: { before: 'Artemis', after: 'Vaisseau propre' } },
    })
    expect(label).toBe('Renommage')
    expect(detail).toBe('Pseudo : Bob → Joueur 42 · Vaisseau : Artemis → Vaisseau propre')
  })

  it('garde l’action brute si elle est inconnue', () => {
    expect(describeAction({ action: 'autre' })).toEqual({ label: 'autre', detail: '' })
  })
})

describe('dates', () => {
  it('« — » quand la date manque ou est invalide', () => {
    expect(formatAdminDate(null)).toBe('—')
    expect(formatAdminDate('pas une date')).toBe('—')
    expect(formatAdminDate('2026-10-23T12:00:00Z')).toMatch(/^23\/10\/2026/)
  })
})
