import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  resend: vi.fn(),
  verifyOtp: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth } }))

const { useAuthStore } = await import('./auth')

describe('jeton CAPTCHA transmis à Supabase', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('window', { location: { origin: 'https://lacuna.test' } })
    auth.signUp.mockResolvedValue({ data: { session: null, user: { identities: [{}] } }, error: null })
    auth.resend.mockResolvedValue({ error: null })
    auth.signInWithPassword.mockResolvedValue({ error: null })
    auth.resetPasswordForEmail.mockResolvedValue({ error: null })
  })

  it('à l’inscription', async () => {
    await useAuthStore().signUp(' joueur@lacuna.fr ', 'assezlong', 'jeton')
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'joueur@lacuna.fr',
      password: 'assezlong',
      options: { emailRedirectTo: 'https://lacuna.test/confirmer', captchaToken: 'jeton' },
    })
  })

  it('à la connexion', async () => {
    await useAuthStore().signIn('joueur@lacuna.fr', 'assezlong', 'jeton')
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'joueur@lacuna.fr',
      password: 'assezlong',
      options: { captchaToken: 'jeton' },
    })
  })

  it('pour le mot de passe oublié', async () => {
    await useAuthStore().requestPasswordReset('joueur@lacuna.fr', 'jeton')
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('joueur@lacuna.fr', {
      redirectTo: 'https://lacuna.test/nouveau-mot-de-passe',
      captchaToken: 'jeton',
    })
  })

  it('sans CAPTCHA (clé de site absente), aucun jeton n’est envoyé', async () => {
    await useAuthStore().signIn('joueur@lacuna.fr', 'assezlong', '')
    expect(auth.signInWithPassword.mock.calls.at(-1)[0].options.captchaToken).toBeUndefined()
  })
})

describe('inscription et liens d’email', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('window', { location: { origin: 'https://lacuna.test' } })
  })

  it('nouvelle adresse : email de confirmation attendu', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null, user: { identities: [{ id: 'i' }] } }, error: null })
    expect(await useAuthStore().signUp('neuf@lacuna.fr', 'assezlong')).toEqual({
      needsConfirmation: true,
      existingAccount: false,
    })
  })

  it('adresse déjà inscrite : Supabase répond sans identité et sans email', async () => {
    auth.signUp.mockResolvedValue({ data: { session: null, user: { identities: [] } }, error: null })
    expect((await useAuthStore().signUp('connu@lacuna.fr', 'assezlong')).existingAccount).toBe(true)
  })

  it('renvoie l’email de confirmation vers la page /confirmer', async () => {
    auth.resend.mockResolvedValue({ error: null })
    await useAuthStore().resendConfirmation(' joueur@lacuna.fr ', 'jeton')
    expect(auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'joueur@lacuna.fr',
      options: { emailRedirectTo: 'https://lacuna.test/confirmer', captchaToken: 'jeton' },
    })
  })

  it('relance l’erreur du renvoi (limite d’envoi)', async () => {
    auth.resend.mockResolvedValue({ error: { code: 'over_email_send_rate_limit' } })
    await expect(useAuthStore().resendConfirmation('joueur@lacuna.fr')).rejects.toEqual({
      code: 'over_email_send_rate_limit',
    })
  })

  it('valide le jeton du lien et ouvre la session', async () => {
    const session = { access_token: 'a' }
    auth.verifyOtp.mockResolvedValue({ data: { session }, error: null })
    const store = useAuthStore()
    await store.verifyEmailLink('hash', 'signup')
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash', type: 'signup' })
    expect(store.session).toEqual(session)
    expect(store.passwordRecovery).toBe(false)
  })

  it('lien de réinitialisation : passe en mode nouveau mot de passe', async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: { access_token: 'a' } }, error: null })
    const store = useAuthStore()
    await store.verifyEmailLink('hash', 'recovery')
    expect(store.passwordRecovery).toBe(true)
  })

  it('jeton expiré ou déjà servi : l’erreur est relancée', async () => {
    auth.verifyOtp.mockResolvedValue({ data: {}, error: { code: 'otp_expired' } })
    await expect(useAuthStore().verifyEmailLink('hash', 'signup')).rejects.toEqual({ code: 'otp_expired' })
  })
})
