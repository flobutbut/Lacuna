<script setup>
/**
 * ResendConfirmation — renvoi de l'email de confirmation d'inscription.
 * Utilisé après l'inscription, à la connexion (email non confirmé) et sur un lien expiré.
 * Sans prop email, le joueur saisit son adresse. Bouton bloqué 60 s après un envoi (limite Supabase).
 */
import { ref, computed, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authErrorMessage, validateEmail } from '@/lib/authErrors'
import { RESEND_COOLDOWN_S } from '@/lib/authLinks'
import { captchaEnabled } from '@/lib/turnstile'
import AppTextField from '@/components/AppTextField.vue'
import CaptchaWidget from '@/components/auth/CaptchaWidget.vue'

const props = defineProps({
  /** Adresse connue (après inscription, saisie à la connexion) ; vide : champ affiché */
  email: { type: String, default: '' },
})

const authStore = useAuthStore()

const typedEmail = ref('')
const emailError = ref('')
const error = ref('')
const sent = ref(false)
const sending = ref(false)
const remaining = ref(0)
const captchaToken = ref('')
const captchaWidget = ref(null)
const captchaRequired = captchaEnabled()
let timer = null

const address = computed(() => (props.email || typedEmail.value).trim())
const canSend = computed(() => !sending.value && remaining.value === 0 && (!captchaRequired || !!captchaToken.value))

function startCooldown() {
  remaining.value = RESEND_COOLDOWN_S
  clearInterval(timer)
  timer = setInterval(() => {
    remaining.value -= 1
    if (remaining.value <= 0) clearInterval(timer)
  }, 1000)
}

async function resend() {
  error.value = ''
  emailError.value = props.email ? '' : (validateEmail(typedEmail.value) ?? '')
  if (emailError.value || !canSend.value) return
  sending.value = true
  try {
    await authStore.resendConfirmation(address.value, captchaToken.value)
    sent.value = true
    startCooldown()
  } catch (err) {
    error.value = authErrorMessage(err)
  } finally {
    sending.value = false
    captchaWidget.value?.reset()
  }
}

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="auth-resend">
    <AppTextField v-if="!email" v-model="typedEmail" label="Email du compte" type="email" autocomplete="email" :error="emailError" />
    <CaptchaWidget v-if="captchaRequired" ref="captchaWidget" v-model="captchaToken" />
    <button type="button" class="btn btn-secondary auth-resend__btn" :disabled="!canSend" @click="resend">
      {{ sending ? 'Envoi…' : remaining ? `Renvoyer l’email (${remaining} s)` : 'Renvoyer l’email de confirmation' }}
    </button>
    <p v-if="error" class="auth-resend__msg auth-resend__msg--error" role="alert">{{ error }}</p>
    <p v-else-if="sent" class="auth-resend__msg" role="status">
      Email renvoyé à <strong>{{ address }}</strong
      >. Il peut mettre quelques minutes à arriver.
    </p>
  </div>
</template>
