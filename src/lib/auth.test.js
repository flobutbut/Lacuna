import { describe, expect, it } from 'vitest'
import { authErrorFromUrlHash, authErrorMessage, validateEmail, validatePassword } from './authErrors'
import { resolveAuthRedirect, safeRedirect } from '@/router/authGuard'

describe('authErrorMessage', () => {
  it('traduit les codes Supabase connus', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toBe('Email ou mot de passe incorrect.')
    expect(authErrorMessage({ code: 'email_not_confirmed' })).toMatch(/non confirmée/)
  })

  it('reconnaît une erreur réseau', () => {
    expect(authErrorMessage({ name: 'AuthRetryableFetchError', status: 0 })).toMatch(/réseau/)
  })

  it('retombe sur un message générique', () => {
    expect(authErrorMessage({ code: 'inconnu' })).toBe('Une erreur est survenue. Réessayez.')
    expect(authErrorMessage(null)).toBe('Une erreur est survenue. Réessayez.')
  })
})

describe('authErrorFromUrlHash', () => {
  it('lit l’erreur d’un lien expiré', () => {
    const err = authErrorFromUrlHash('#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid')
    expect(err).toEqual({ code: 'otp_expired' })
    expect(authErrorMessage(err)).toMatch(/expiré/)
  })

  it('ignore une URL sans erreur', () => {
    expect(authErrorFromUrlHash('#access_token=abc&type=recovery')).toBeNull()
    expect(authErrorFromUrlHash('')).toBeNull()
  })
})

describe('validation des champs', () => {
  it('vérifie l’email', () => {
    expect(validateEmail('')).toMatch(/Indiquez/)
    expect(validateEmail('pas-un-email')).toBe('Adresse email invalide.')
    expect(validateEmail(' joueur@lacuna.fr ')).toBeNull()
  })

  it('exige 8 caractères pour le mot de passe', () => {
    expect(validatePassword('')).toMatch(/Indiquez/)
    expect(validatePassword('court')).toBe('8 caractères minimum.')
    expect(validatePassword('assezlong')).toBeNull()
  })
})

describe('safeRedirect', () => {
  it('accepte un chemin interne', () => {
    expect(safeRedirect('/carte?x=1')).toBe('/carte?x=1')
  })

  it('refuse les redirections externes', () => {
    expect(safeRedirect('https://exemple.com')).toBeNull()
    expect(safeRedirect('//exemple.com')).toBeNull()
    expect(safeRedirect('/\\exemple.com')).toBeNull()
    expect(safeRedirect(undefined)).toBeNull()
  })
})

describe('resolveAuthRedirect', () => {
  const page = (fullPath, meta = {}) => ({ fullPath, meta })
  const connexion = page('/connexion', { public: true, guestOnly: true })
  const nouveauMdp = page('/nouveau-mot-de-passe', { public: true })

  it('envoie un visiteur vers la connexion, avec le chemin de retour', () => {
    expect(resolveAuthRedirect(page('/carte'), { configured: true, authenticated: false })).toEqual({
      name: 'connexion',
      query: { redirect: '/carte' },
    })
    expect(resolveAuthRedirect(page('/'), { configured: true, authenticated: false })).toEqual({ name: 'connexion' })
  })

  it('laisse un visiteur sur les pages publiques', () => {
    expect(resolveAuthRedirect(connexion, { configured: true, authenticated: false })).toBe(true)
  })

  it('renvoie un joueur connecté hors des pages de connexion', () => {
    expect(resolveAuthRedirect(connexion, { configured: true, authenticated: true })).toEqual({ name: 'observatoire' })
    expect(resolveAuthRedirect(page('/carte'), { configured: true, authenticated: true })).toBe(true)
  })

  it('laisse un joueur connecté définir un nouveau mot de passe', () => {
    expect(resolveAuthRedirect(nouveauMdp, { configured: true, authenticated: true })).toBe(true)
  })

  const bienvenue = page('/bienvenue', { onboarding: true })

  it('envoie un joueur sans vaisseau vers /bienvenue', () => {
    const state = { configured: true, authenticated: true, hasShip: false }
    expect(resolveAuthRedirect(page('/carte'), state)).toEqual({ name: 'bienvenue' })
    expect(resolveAuthRedirect(bienvenue, state)).toBe(true)
    expect(resolveAuthRedirect(nouveauMdp, state)).toBe(true)
  })

  it('ferme /bienvenue une fois le vaisseau créé, ou aux visiteurs', () => {
    expect(resolveAuthRedirect(bienvenue, { configured: true, authenticated: true, hasShip: true })).toEqual({ name: 'observatoire' })
    expect(resolveAuthRedirect(bienvenue, { configured: true, authenticated: false })).toEqual({
      name: 'connexion',
      query: { redirect: '/bienvenue' },
    })
  })

  it('ne bloque pas le joueur si l’état du vaisseau est inconnu', () => {
    expect(resolveAuthRedirect(page('/carte'), { configured: true, authenticated: true, hasShip: null })).toBe(true)
  })

  it('réserve les outils admin aux comptes admin', () => {
    const vue3d = page('/conception-etoiles', { requiresAdmin: true })
    expect(resolveAuthRedirect(vue3d, { configured: true, authenticated: true, hasShip: true, isAdmin: false })).toEqual({ name: 'observatoire' })
    expect(resolveAuthRedirect(vue3d, { configured: true, authenticated: true, hasShip: true, isAdmin: true })).toBe(true)
    expect(resolveAuthRedirect(vue3d, { configured: false, authenticated: false })).toBe(true)
  })

  it('hors ligne : pas de compte, pages d’authentification inutiles', () => {
    expect(resolveAuthRedirect(page('/carte'), { configured: false, authenticated: false })).toBe(true)
    expect(resolveAuthRedirect(connexion, { configured: false, authenticated: false })).toEqual({ name: 'observatoire' })
  })
})
