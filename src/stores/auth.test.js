import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  resetPasswordForEmail: vi.fn(),
}))
vi.mock('@/lib/supabase', () => ({ supabase: { auth } }))

const { useAuthStore } = await import('./auth')

describe('jeton CAPTCHA transmis à Supabase', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('window', { location: { origin: 'https://lacuna.test' } })
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null })
    auth.signInWithPassword.mockResolvedValue({ error: null })
    auth.resetPasswordForEmail.mockResolvedValue({ error: null })
  })

  it('à l’inscription', async () => {
    await useAuthStore().signUp(' joueur@lacuna.fr ', 'assezlong', 'jeton')
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'joueur@lacuna.fr',
      password: 'assezlong',
      options: { emailRedirectTo: 'https://lacuna.test/connexion', captchaToken: 'jeton' },
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
