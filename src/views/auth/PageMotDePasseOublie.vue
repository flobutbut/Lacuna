<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authErrorMessage, validateEmail } from '@/lib/authErrors'
import AuthPanel from '@/components/auth/AuthPanel.vue'
import AppTextField from '@/components/AppTextField.vue'
import CaptchaWidget from '@/components/auth/CaptchaWidget.vue'
import { captchaEnabled } from '@/lib/turnstile'

const authStore = useAuthStore()

const email = ref('')
const emailError = ref('')
const formError = ref('')
const submitting = ref(false)
const captchaToken = ref('')
const captchaWidget = ref(null)
const captchaRequired = captchaEnabled()
const sentTo = ref('')

async function submit() {
  formError.value = ''
  emailError.value = validateEmail(email.value) ?? ''
  if (emailError.value) return
  submitting.value = true
  try {
    await authStore.requestPasswordReset(email.value, captchaToken.value)
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
    title="Mot de passe oublié"
    :subtitle="sentTo ? '' : 'Indiquez votre email : vous recevrez un lien pour choisir un nouveau mot de passe.'"
  >
    <!-- Même message que l'adresse ait un compte ou non -->
    <p v-if="sentTo" class="auth-alert auth-alert--success" role="status">
      Si un compte existe pour <strong>{{ sentTo }}</strong>, un lien de réinitialisation vient d’y être envoyé.
    </p>
    <form v-else class="auth-form" novalidate @submit.prevent="submit">
      <p v-if="formError" class="auth-alert auth-alert--error" role="alert">
        {{ formError }}
      </p>
      <AppTextField
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        :error="emailError"
        required
        autofocus
      />
      <CaptchaWidget v-if="captchaRequired" ref="captchaWidget" v-model="captchaToken" />
      <button type="submit" class="btn-primary auth-form__submit" :disabled="submitting || (captchaRequired && !captchaToken)">
        {{ submitting ? 'Envoi…' : 'Envoyer le lien' }}
      </button>
    </form>
    <template #footer>
      <RouterLink :to="{ name: 'connexion' }">Retour à la connexion</RouterLink>
    </template>
  </AuthPanel>
</template>
