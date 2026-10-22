<script setup>
/**
 * Widget Cloudflare Turnstile des formulaires d'authentification.
 * v-model : jeton à passer à Supabase ('' tant que la vérification n'a pas abouti).
 * Un jeton ne sert qu'une fois : la page appelle reset() après chaque envoi.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { TURNSTILE_SITE_KEY, loadTurnstile } from '@/lib/turnstile'

const token = defineModel({ type: String, default: '' })

const container = ref(null)
const failed = ref(false)
let turnstile = null
let widgetId = null

onMounted(async () => {
  try {
    turnstile = await loadTurnstile()
  } catch {
    failed.value = true
    return
  }
  if (!container.value) return
  widgetId = turnstile.render(container.value, {
    sitekey: TURNSTILE_SITE_KEY,
    theme: 'dark',
    language: 'fr',
    size: 'flexible',
    callback: (value) => {
      failed.value = false
      token.value = value
    },
    'expired-callback': () => {
      token.value = ''
    },
    'error-callback': () => {
      token.value = ''
      failed.value = true
    },
  })
})

onBeforeUnmount(() => {
  if (turnstile && widgetId !== null) turnstile.remove(widgetId)
})

function reset() {
  token.value = ''
  if (turnstile && widgetId !== null) turnstile.reset(widgetId)
}

defineExpose({ reset })
</script>

<template>
  <div class="auth-captcha">
    <div ref="container" />
    <p v-if="failed" class="auth-captcha__error" role="alert">
      Vérification anti-robot indisponible. Rechargez la page ou désactivez un éventuel bloqueur.
    </p>
  </div>
</template>
