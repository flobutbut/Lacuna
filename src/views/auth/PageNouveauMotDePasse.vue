<script setup>
/**
 * Ouverte depuis le lien de réinitialisation.
 *   • Lien à jeton (?token_hash=…&type=recovery, modèle d'email LACUNA) : le jeton n'est validé
 *     qu'au clic sur « Continuer » (un aperçu de lien ne le consomme plus), ce qui ouvre la session.
 *   • Lien Supabase par défaut : Supabase a déjà ouvert une session temporaire à partir de l'URL.
 * La session autorise la mise à jour du mot de passe.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { PASSWORD_MIN_LENGTH, authErrorFromUrlHash, authErrorMessage, validatePassword } from '@/lib/authErrors'
import { parseEmailLink } from '@/lib/authLinks'
import AuthPanel from '@/components/auth/AuthPanel.vue'
import AppTextField from '@/components/AppTextField.vue'

const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

const password = ref('')
const passwordConfirm = ref('')
const errors = ref({ password: '', passwordConfirm: '' })
const formError = ref('')
const submitting = ref(false)
const linkError = ref('')
const link = parseEmailLink(window.location.search, 'recovery')
/** Lien à jeton : validé au clic du joueur */
const verified = ref(false)
const verifying = ref(false)

async function continueWithLink() {
  verifying.value = true
  linkError.value = ''
  try {
    await authStore.verifyEmailLink(link.tokenHash, link.type)
    verified.value = true
  } catch (err) {
    linkError.value = authErrorMessage(err)
  } finally {
    verifying.value = false
  }
}

async function submit() {
  formError.value = ''
  errors.value = {
    password: validatePassword(password.value) ?? '',
    passwordConfirm: password.value === passwordConfirm.value ? '' : 'Les deux mots de passe ne correspondent pas.',
  }
  if (Object.values(errors.value).some(Boolean)) return
  submitting.value = true
  try {
    await authStore.updatePassword(password.value)
    notificationsStore.showNotification('Mot de passe mis à jour.', 3000, 'success')
    router.replace({ name: 'observatoire' })
  } catch (err) {
    formError.value = authErrorMessage(err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const urlError = authErrorFromUrlHash(window.location.hash)
  if (urlError) linkError.value = authErrorMessage(urlError)
})
</script>

<template>
  <AuthPanel title="Nouveau mot de passe">
    <p v-if="linkError" class="auth-alert auth-alert--error" role="alert">{{ linkError }}</p>
    <template v-else-if="link && !verified">
      <p class="auth-text">Continuez pour choisir un nouveau mot de passe.</p>
      <button type="button" class="btn btn-primary auth-form__submit" :disabled="verifying" @click="continueWithLink">
        {{ verifying ? 'Vérification…' : 'Continuer' }}
      </button>
    </template>
    <p v-else-if="!authStore.isAuthenticated" class="auth-alert auth-alert--error" role="alert">
      Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.
    </p>
    <form v-else class="auth-form" novalidate @submit.prevent="submit">
      <p v-if="formError" class="auth-alert auth-alert--error" role="alert">
        {{ formError }}
      </p>
      <AppTextField
        v-model="password"
        label="Nouveau mot de passe"
        type="password"
        autocomplete="new-password"
        :hint="`${PASSWORD_MIN_LENGTH} caractères minimum.`"
        :error="errors.password"
        required
        autofocus
      />
      <AppTextField
        v-model="passwordConfirm"
        label="Confirmer le mot de passe"
        type="password"
        autocomplete="new-password"
        :error="errors.passwordConfirm"
        required
      />
      <button type="submit" class="btn btn-primary auth-form__submit" :disabled="submitting">
        {{ submitting ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </form>
    <template #footer>
      <RouterLink v-if="linkError || !authStore.isAuthenticated" :to="{ name: 'mot-de-passe-oublie' }">
        Demander un nouveau lien
      </RouterLink>
      <RouterLink v-else :to="{ name: 'observatoire' }">Annuler</RouterLink>
    </template>
  </AuthPanel>
</template>
