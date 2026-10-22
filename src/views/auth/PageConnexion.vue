<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authErrorFromUrlHash, authErrorMessage, validateEmail } from '@/lib/authErrors'
import { safeRedirect } from '@/router/authGuard'
import AuthPanel from '@/components/auth/AuthPanel.vue'
import AppTextField from '@/components/AppTextField.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errors = ref({ email: '', password: '' })
const formError = ref('')
const accountDeleted = route.query.compte === 'supprime'
const submitting = ref(false)

async function submit() {
  formError.value = ''
  errors.value = {
    email: validateEmail(email.value) ?? '',
    password: password.value ? '' : 'Indiquez votre mot de passe.',
  }
  if (errors.value.email || errors.value.password) return
  submitting.value = true
  try {
    await authStore.signIn(email.value, password.value)
    router.replace(safeRedirect(route.query.redirect) ?? '/')
  } catch (err) {
    formError.value = authErrorMessage(err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // Lien de confirmation expiré ou déjà utilisé
  const urlError = authErrorFromUrlHash(window.location.hash)
  if (urlError) formError.value = authErrorMessage(urlError)
})
</script>

<template>
  <AuthPanel title="Connexion" subtitle="Reprenez le commandement de votre vaisseau.">
    <form class="auth-form" novalidate @submit.prevent="submit">
      <p v-if="accountDeleted && !formError" class="auth-alert auth-alert--success" role="status">
        Votre compte et votre partie ont été supprimés.
      </p>
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
        autocomplete="current-password"
        :error="errors.password"
        required
      />
      <RouterLink class="auth-form__aside" :to="{ name: 'mot-de-passe-oublie' }">
        Mot de passe oublié ?
      </RouterLink>
      <button type="submit" class="btn-primary auth-form__submit" :disabled="submitting">
        {{ submitting ? 'Connexion…' : 'Se connecter' }}
      </button>
    </form>
    <template #footer>
      <span>Pas encore de compte ? <RouterLink :to="{ name: 'inscription' }">Créer un compte</RouterLink></span>
    </template>
  </AuthPanel>
</template>
