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

  /** Profil privé du joueur : { pseudo, role } — null tant que la partie n'est pas créée */
  const profile = ref(null)
  /** Le joueur a-t-il un vaisseau ? null = inconnu (pas encore chargé, ou erreur de chargement) */
  const hasShip = ref(null)

  const user = computed(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => !!session.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')

  let initPromise = null
  let playerPromise = null
  let playerUserId = null

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

  /**
   * Charge le profil et l'existence du vaisseau du joueur connecté (une fois par compte).
   * En cas d'erreur, hasShip reste null : la garde laisse passer plutôt que de bloquer le joueur.
   */
  function ensurePlayer() {
    const uid = user.value?.id
    if (!uid) {
      profile.value = null
      hasShip.value = null
      return Promise.resolve()
    }
    if (playerPromise && playerUserId === uid) return playerPromise
    playerUserId = uid
    playerPromise = (async () => {
      const [profileRes, shipRes] = await Promise.all([
        supabase.from('profiles').select('pseudo, role').eq('id', uid).maybeSingle(),
        supabase.from('ships').select('id', { count: 'exact', head: true }).eq('user_id', uid),
      ])
      if (profileRes.error) console.warn('[auth] Erreur profil:', profileRes.error.message)
      if (shipRes.error) console.warn('[auth] Erreur vaisseau:', shipRes.error.message)
      profile.value = profileRes.data ?? null
      hasShip.value = shipRes.error ? null : (shipRes.count ?? 0) > 0
    })()
    return playerPromise
  }

  /**
   * Crée la partie du joueur (profil, vaisseau à Sol, systèmes, population, carte, signaux de démo).
   * Lève l'erreur PostgREST telle quelle (voir gameErrorMessage).
   * @returns {Promise<string>} id du vaisseau
   */
  async function startNewGame(pseudo, shipName) {
    const { data, error } = await supabase.rpc('start_new_game', { p_pseudo: pseudo, p_ship_name: shipName })
    if (error) throw error
    profile.value = { role: 'player', ...profile.value, pseudo: pseudo.trim() }
    hasShip.value = true
    return data
  }

  return {
    session,
    ready,
    passwordRecovery,
    profile,
    hasShip,
    user,
    isAuthenticated,
    isAdmin,
    init,
    ensurePlayer,
    startNewGame,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
  }
})
