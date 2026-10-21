<script setup>
/**
 * Ouverte depuis le lien de réinitialisation : Supabase ouvre une session temporaire
 * à partir de l'URL, qui autorise la mise à jour du mot de passe.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import { PASSWORD_MIN_LENGTH, authErrorFromUrlHash, authErrorMessage, validatePassword } from '@/lib/authErrors'
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
    router.replace('/')
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
    <p v-if="linkError || !authStore.isAuthenticated" class="auth-alert auth-alert--error" role="alert">
      {{ linkError || 'Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.' }}
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
      <button type="submit" class="btn-primary auth-form__submit" :disabled="submitting">
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
