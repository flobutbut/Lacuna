<script setup>
/**
 * Arrivée du lien de confirmation d'inscription.
 *   • Lien à jeton (?token_hash=…&type=signup, modèle d'email LACUNA) : le jeton n'est validé
 *     qu'au clic sur « Activer mon compte » — un aperçu de lien ou un antivirus qui ouvre l'URL
 *     ne le consomme plus.
 *   • Lien Supabase par défaut (/auth/v1/verify) : Supabase a déjà validé et ouvert la session.
 *   • Lien expiré ou déjà servi (#error_code=…) : message et renvoi de l'email.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authErrorFromUrlHash, authErrorMessage } from '@/lib/authErrors'
import { parseEmailLink } from '@/lib/authLinks'
import AuthPanel from '@/components/auth/AuthPanel.vue'
import ResendConfirmation from '@/components/auth/ResendConfirmation.vue'

const router = useRouter()
const authStore = useAuthStore()

const link = parseEmailLink(window.location.search, 'signup')
const linkError = ref('')
const verifying = ref(false)
const confirmed = ref(false)

const title = computed(() => {
  if (linkError.value) return 'Lien invalide'
  if (confirmed.value || (!link && authStore.isAuthenticated)) return 'Compte activé'
  return 'Activer votre compte'
})

async function activate() {
  verifying.value = true
  linkError.value = ''
  try {
    await authStore.verifyEmailLink(link.tokenHash, link.type)
    confirmed.value = true
  } catch (err) {
    linkError.value = authErrorMessage(err)
  } finally {
    verifying.value = false
  }
}

/** La garde envoie un joueur sans partie vers la création de partie */
function play() {
  router.replace({ name: 'observatoire' })
}

onMounted(() => {
  const urlError = authErrorFromUrlHash(window.location.hash)
  if (urlError) linkError.value = authErrorMessage(urlError)
  else if (!link && !authStore.isAuthenticated) linkError.value = 'Ce lien est incomplet. Ouvrez le lien reçu par email.'
})
</script>

<template>
  <AuthPanel :title="title">
    <template v-if="linkError">
      <p class="auth-alert auth-alert--error" role="alert">{{ linkError }}</p>
      <p class="auth-text">Demandez un nouvel email de confirmation :</p>
      <ResendConfirmation />
    </template>

    <template v-else-if="confirmed || (!link && authStore.isAuthenticated)">
      <p class="auth-alert auth-alert--success" role="status">Votre adresse est confirmée.</p>
      <button type="button" class="btn btn-primary auth-form__submit" @click="play">Commencer</button>
    </template>

    <template v-else>
      <p class="auth-text">Un dernier clic pour confirmer votre adresse email et activer votre compte.</p>
      <button type="button" class="btn btn-primary auth-form__submit" :disabled="verifying" @click="activate">
        {{ verifying ? 'Activation…' : 'Activer mon compte' }}
      </button>
    </template>

    <template #footer>
      <span>Déjà activé ? <RouterLink :to="{ name: 'connexion' }">Se connecter</RouterLink></span>
    </template>
  </AuthPanel>
</template>
