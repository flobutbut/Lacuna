<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PASSWORD_MIN_LENGTH, authErrorMessage, validateEmail, validatePassword } from '@/lib/authErrors'
import AuthPanel from '@/components/auth/AuthPanel.vue'
import AppTextField from '@/components/AppTextField.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const errors = ref({ email: '', password: '', passwordConfirm: '' })
const formError = ref('')
const submitting = ref(false)
/** Adresse à laquelle l'email de confirmation a été envoyé */
const sentTo = ref('')

async function submit() {
  formError.value = ''
  errors.value = {
    email: validateEmail(email.value) ?? '',
    password: validatePassword(password.value) ?? '',
    passwordConfirm: password.value === passwordConfirm.value ? '' : 'Les deux mots de passe ne correspondent pas.',
  }
  if (Object.values(errors.value).some(Boolean)) return
  submitting.value = true
  try {
    const { needsConfirmation } = await authStore.signUp(email.value, password.value)
    // Confirmation d'email désactivée côté Supabase : le compte est déjà actif
    if (!needsConfirmation) return router.replace('/')
    sentTo.value = email.value.trim()
  } catch (err) {
    formError.value = authErrorMessage(err)
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
    <p v-if="sentTo" class="auth-alert auth-alert--success" role="status">
      Un email de confirmation a été envoyé à <strong>{{ sentTo }}</strong>.
      Cliquez sur le lien qu’il contient pour activer votre compte, puis connectez-vous.
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
        :error="errors.email"
        required
        autofocus
      />
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
      <button type="submit" class="btn-primary auth-form__submit" :disabled="submitting">
        {{ submitting ? 'Création…' : 'Créer le compte' }}
      </button>
    </form>
    <template #footer>
      <span>Déjà un compte ? <RouterLink :to="{ name: 'connexion' }">Se connecter</RouterLink></span>
    </template>
  </AuthPanel>
</template>
