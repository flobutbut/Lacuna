<script setup>
/**
 * Création de partie : pseudo (privé) et nom du vaisseau, puis start_new_game.
 * Affichée par la garde de routeur tant que le joueur connecté n'a pas de vaisseau.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import {
  PSEUDO_MAX,
  PSEUDO_MIN,
  SHIP_NAME_MAX,
  SHIP_NAME_MIN,
  gameErrorMessage,
  isGameAlreadyStarted,
  validatePseudo,
  validateShipName,
} from '@/lib/playerProfile'
import AuthPanel from '@/components/auth/AuthPanel.vue'
import AppTextField from '@/components/AppTextField.vue'

const router = useRouter()
const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()

// Pseudo déjà choisi (profil existant) : pré-rempli, modifiable
const pseudo = ref(authStore.profile?.pseudo ?? '')
const shipName = ref('')
const errors = ref({ pseudo: '', shipName: '' })
const formError = ref('')
const submitting = ref(false)

async function submit() {
  formError.value = ''
  errors.value = {
    pseudo: validatePseudo(pseudo.value) ?? '',
    shipName: validateShipName(shipName.value) ?? '',
  }
  if (errors.value.pseudo || errors.value.shipName) return
  submitting.value = true
  try {
    await authStore.startNewGame(pseudo.value, shipName.value)
    notificationsStore.showNotification(`Bienvenue à bord du ${shipName.value.trim()}.`, 4000, 'success')
    router.replace('/')
  } catch (err) {
    if (isGameAlreadyStarted(err)) {
      authStore.hasShip = true
      return router.replace('/')
    }
    formError.value = gameErrorMessage(err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthPanel
    title="Bienvenue à bord"
    subtitle="Votre vaisseau générationnel attend son commandant. Ces deux noms restent privés : les autres joueurs ne les verront jamais."
  >
    <form class="auth-form" novalidate @submit.prevent="submit">
      <p v-if="formError" class="auth-alert auth-alert--error" role="alert">
        {{ formError }}
      </p>
      <AppTextField
        v-model="pseudo"
        label="Pseudo"
        autocomplete="nickname"
        :hint="`Votre nom de commandant · ${PSEUDO_MIN} à ${PSEUDO_MAX} caractères.`"
        :error="errors.pseudo"
        required
        :autofocus="!pseudo"
      />
      <AppTextField
        v-model="shipName"
        label="Nom du vaisseau"
        autocomplete="off"
        :hint="`Vaisseau de classe ARCA · ${SHIP_NAME_MIN} à ${SHIP_NAME_MAX} caractères.`"
        :error="errors.shipName"
        required
        :autofocus="!!pseudo"
      />
      <button type="submit" class="btn-primary auth-form__submit" :disabled="submitting">
        {{ submitting ? 'Préparation du départ…' : 'Embarquer' }}
      </button>
    </form>
    <template #footer>
      <span>
        Pas maintenant ?
        <a href="/connexion" @click.prevent="authStore.signOut()">Se déconnecter</a>
      </span>
    </template>
  </AuthPanel>
</template>
