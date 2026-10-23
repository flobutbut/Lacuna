<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PASSWORD_MIN_LENGTH, authErrorMessage, validateEmail, validatePassword } from '@/lib/authErrors'
import AuthPanel from '@/components/auth/AuthPanel.vue'
import AppTextField from '@/components/AppTextField.vue'
import CaptchaWidget from '@/components/auth/CaptchaWidget.vue'
import ResendConfirmation from '@/components/auth/ResendConfirmation.vue'
import { captchaEnabled } from '@/lib/turnstile'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const errors = ref({ email: '', password: '', passwordConfirm: '' })
const formError = ref('')
const submitting = ref(false)
const captchaToken = ref('')
const captchaWidget = ref(null)
const captchaRequired = captchaEnabled()
/** Adresse à laquelle l'email de confirmation a été envoyé */
const sentTo = ref('')
/** Adresse qui a déjà un compte confirmé : Supabase n'envoie rien, on oriente vers la connexion */
const existingEmail = ref('')

async function submit() {
  formError.value = ''
  existingEmail.value = ''
  errors.value = {
    email: validateEmail(email.value) ?? '',
    password: validatePassword(password.value) ?? '',
    passwordConfirm: password.value === passwordConfirm.value ? '' : 'Les deux mots de passe ne correspondent pas.',
  }
  if (Object.values(errors.value).some(Boolean)) return
  submitting.value = true
  try {
    const { needsConfirmation, existingAccount } = await authStore.signUp(email.value, password.value, captchaToken.value)
    if (existingAccount) {
      existingEmail.value = email.value.trim()
      captchaWidget.value?.reset()
      return
    }
    // Confirmation d'email désactivée côté Supabase : le compte est déjà actif
    if (!needsConfirmation) return router.replace({ name: 'observatoire' })
    sentTo.value = email.value.trim()
  } catch (err) {
    formError.value = authErrorMessage(err)
    captchaWidget.value?.reset()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthPanel
    :title="sentTo ? 'Vérifiez vos emails' : 'Créer un compte'"
    :subtitle="sentTo ? '' : 'Un compte par commandant. Votre pseudo et votre vaisseau restent privés.'"
  >
    <template v-if="sentTo">
      <p class="auth-alert auth-alert--success" role="status">
        Un email de confirmation a été envoyé à <strong>{{ sentTo }}</strong
        >. Cliquez sur le lien qu’il contient pour activer votre compte.
      </p>
      <p class="auth-text">
        Rien reçu après quelques minutes ? Regardez dans les indésirables et l’onglet Promotions, vérifiez l’adresse, puis renvoyez l’email.
      </p>
      <ResendConfirmation :email="sentTo" />
    </template>
    <form v-else class="auth-form" novalidate @submit.prevent="submit">
      <p v-if="formError" class="auth-alert auth-alert--error" role="alert">
        {{ formError }}
      </p>
      <p v-if="existingEmail" class="auth-alert auth-alert--error" role="alert">
        Un compte existe déjà pour <strong>{{ existingEmail }}</strong
        >. <RouterLink :to="{ name: 'connexion' }">Connectez-vous</RouterLink>, ou
        <RouterLink :to="{ name: 'mot-de-passe-oublie' }">choisissez un nouveau mot de passe</RouterLink>
        si vous l’avez oublié.
      </p>
      <AppTextField v-model="email" label="Email" type="email" autocomplete="email" :error="errors.email" required autofocus />
      <AppTextField
        v-model="password"
        label="Mot de passe"
        type="password"
        autocomplete="new-password"
        :hint="`${PASSWORD_MIN_LENGTH} caractères minimum.`"
        :error="errors.password"
        required
      />
      <AppTextField
        v-model="passwordConfirm"
        label="Confirmer le mot de passe"
        type="password"
        autocomplete="new-password"
        :error="errors.passwordConfirm"
        required
      />
      <p class="auth-form__legal">
        En créant un compte, vous acceptez les
        <RouterLink :to="{ name: 'conditions' }" target="_blank">conditions d’utilisation</RouterLink>
        et la <RouterLink :to="{ name: 'confidentialite' }" target="_blank">politique de confidentialité</RouterLink>.
      </p>
      <CaptchaWidget v-if="captchaRequired" ref="captchaWidget" v-model="captchaToken" />
      <button type="submit" class="btn btn-primary auth-form__submit" :disabled="submitting || (captchaRequired && !captchaToken)">
        {{ submitting ? 'Création…' : 'Créer le compte' }}
      </button>
    </form>
    <template #footer>
      <span>Déjà un compte ? <RouterLink :to="{ name: 'connexion' }">Se connecter</RouterLink></span>
    </template>
  </AuthPanel>
</template>
