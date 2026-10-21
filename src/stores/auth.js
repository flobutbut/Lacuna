/**
 * Store Auth — session Supabase du joueur (inscription, connexion, mot de passe)
 * Les erreurs Supabase sont relancées telles quelles : les pages les traduisent avec authErrorMessage().
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  /** Session initiale chargée (la garde de routeur l'attend) */
  const ready = ref(false)
  /** Arrivée par un lien de réinitialisation du mot de passe */
  const passwordRecovery = ref(false)

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => !!session.value)

  let initPromise = null

  /** Charge la session existante (et celle d'un lien email dans l'URL), puis suit ses changements */
  function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      if (!useSupabaseStore().isConfigured()) {
        ready.value = true
        return
      }
      const { data, error } = await supabase.auth.getSession()
      if (error) console.warn('[auth] Erreur session:', error.message)
      session.value = data?.session ?? null
      supabase.auth.onAuthStateChange((event, newSession) => {
        session.value = newSession
        if (event === 'PASSWORD_RECOVERY') passwordRecovery.value = true
      })
      ready.value = true
    })()
    return initPromise
  }

  /**
   * Crée un compte. Avec la confirmation d'email activée, aucune session n'est ouverte :
   * le joueur doit cliquer sur le lien reçu avant de se connecter.
   * @returns {Promise<{ needsConfirmation: boolean }>}
   */
  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/connexion` },
    })
    if (error) throw error
    return { needsConfirmation: !data.session }
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.warn('[auth] Erreur déconnexion:', error.message)
    session.value = null
  }

  /** Envoie le lien de réinitialisation (même réponse que l'adresse existe ou non) */
  async function requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
    })
    if (error) throw error
  }

  async function updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    passwordRecovery.value = false
  }

  return {
    session,
    ready,
    passwordRecovery,
    user,
    isAuthenticated,
    init,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
  }
})
