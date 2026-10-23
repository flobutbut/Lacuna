/**
 * Store Auth — session Supabase du joueur (inscription, connexion, mot de passe)
 * Les erreurs Supabase sont relancées telles quelles : les pages les traduisent avec authErrorMessage().
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { isExistingAccount } from '@/lib/authLinks'

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
  /** Compte supprimé par le joueur : la page de connexion le confirme */
  const accountDeleted = ref(false)

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

  /** Page d'arrivée du lien de confirmation (le jeton n'y est validé qu'au clic du joueur) */
  function confirmUrl() {
    return `${window.location.origin}/confirmer`
  }

  /**
   * Crée un compte. Avec la confirmation d'email activée, aucune session n'est ouverte :
   * le joueur doit cliquer sur le lien reçu avant de se connecter.
   * Adresse déjà inscrite et confirmée : Supabase répond sans erreur ni email (existingAccount).
   * captchaToken : jeton Turnstile, exigé par Supabase quand le CAPTCHA est activé (ici et ci-dessous).
   * @returns {Promise<{ needsConfirmation: boolean, existingAccount: boolean }>}
   */
  async function signUp(email, password, captchaToken) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: confirmUrl(), captchaToken: captchaToken || undefined },
    })
    if (error) throw error
    return { needsConfirmation: !data.session, existingAccount: isExistingAccount(data.user) }
  }

  /** Renvoie l'email de confirmation d'inscription (sans effet pour une adresse inconnue ou déjà confirmée) */
  async function resendConfirmation(email, captchaToken) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: confirmUrl(), captchaToken: captchaToken || undefined },
    })
    if (error) throw error
  }

  /**
   * Valide le jeton d'un lien d'email (confirmation ou réinitialisation) et ouvre la session.
   * @param {string} tokenHash
   * @param {string} type - 'signup' | 'email' | 'recovery'
   */
  async function verifyEmailLink(tokenHash, type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    if (error) throw error
    if (data?.session) session.value = data.session
    if (type === 'recovery') passwordRecovery.value = true
  }

  async function signIn(email, password, captchaToken) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      options: { captchaToken: captchaToken || undefined },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) console.warn('[auth] Erreur déconnexion:', error.message)
    session.value = null
  }

  /** Envoie le lien de réinitialisation (même réponse que l'adresse existe ou non) */
  async function requestPasswordReset(email, captchaToken) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/nouveau-mot-de-passe`,
      captchaToken: captchaToken || undefined,
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
        supabase.from('profiles').select('pseudo, role, fast_transit').eq('id', uid).maybeSingle(),
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

  /** Modifie le pseudo (seule colonne du profil modifiable par le joueur) */
  async function updatePseudo(newPseudo) {
    const pseudo = (newPseudo ?? '').trim()
    const uid = user.value?.id
    if (!uid) throw new Error('Connexion requise')
    const { data, error } = await supabase.from('profiles').update({ pseudo }).eq('id', uid).select('pseudo').single()
    if (error) throw error
    profile.value = { ...profile.value, pseudo: data.pseudo }
    return data.pseudo
  }

  /** Admin : active ou coupe l'accélération des voyages de ce compte (RPC set_fast_transit) */
  async function setFastTransit(enabled) {
    const { data, error } = await supabase.rpc('set_fast_transit', { p_enabled: enabled })
    if (error) throw error
    profile.value = { ...profile.value, fast_transit: data }
    return data
  }

  /**
   * Admin : efface la partie (vaisseau et toutes ses données) puis recharge l'écran de création de partie.
   * Le rechargement remet tous les stores à zéro.
   */
  async function resetGame() {
    const { error } = await supabase.rpc('reset_my_game')
    if (error) throw error
    hasShip.value = false
    window.location.assign('/bienvenue')
  }

  /**
   * Supprime définitivement le compte, la partie et les interprétations du joueur (RPC delete_account),
   * puis ferme la session locale : App.vue recharge alors la page de connexion.
   */
  async function deleteAccount() {
    const { error } = await supabase.rpc('delete_account')
    if (error) throw error
    accountDeleted.value = true
    // Les sessions serveur ont disparu avec le compte : seule la session locale reste à effacer
    await supabase.auth.signOut({ scope: 'local' })
    session.value = null
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
    updatePseudo,
    signUp,
    resendConfirmation,
    verifyEmailLink,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
    accountDeleted,
    deleteAccount,
    setFastTransit,
    resetGame,
  }
})
