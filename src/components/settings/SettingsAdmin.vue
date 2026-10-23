<script setup>
/**
 * SettingsAdmin — section « Administration » des paramètres (comptes admin seulement) :
 * accélération des voyages de test, réinitialisation de la partie.
 * La réinitialisation est irréversible : elle demande de saisir le mot de confirmation.
 */
import { ref, computed, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useShipStore } from '@/stores/ship'
import AppSwitch from '@/components/AppSwitch.vue'
import AppTextField from '@/components/AppTextField.vue'
import Divider from '@/components/Divider.vue'

const CONFIRM_WORD = 'RÉINITIALISER'

const authStore = useAuthStore()
const shipStore = useShipStore()

const rootRef = ref(null)
const savingTransit = ref(false)
const transitError = ref('')
const confirming = ref(false)
const confirmText = ref('')
const resetting = ref(false)
const resetError = ref('')

/** Accélération active par défaut tant que le profil ne dit pas le contraire */
const fastTransit = computed({
  get: () => authStore.profile?.fast_transit !== false,
  set: (value) => toggleFastTransit(value),
})

const canReset = computed(() => confirmText.value.trim().toUpperCase() === CONFIRM_WORD && !resetting.value)

async function toggleFastTransit(value) {
  savingTransit.value = true
  transitError.value = ''
  try {
    await authStore.setFastTransit(value)
  } catch (err) {
    console.warn('[settings] Accélération des voyages:', err?.message)
    transitError.value = 'Modification impossible. Réessayez dans un instant.'
  } finally {
    savingTransit.value = false
  }
}

async function startConfirm() {
  confirmText.value = ''
  resetError.value = ''
  confirming.value = true
  await nextTick()
  rootRef.value?.querySelector('.settings-danger input')?.focus()
}

function cancel() {
  confirming.value = false
  resetError.value = ''
}

async function resetGame() {
  if (!canReset.value) return
  resetting.value = true
  resetError.value = ''
  try {
    // En cas de succès, la page de création de partie se recharge
    await authStore.resetGame()
  } catch (err) {
    console.warn('[settings] Réinitialisation de la partie:', err?.message)
    resetError.value = 'Réinitialisation impossible. Réessayez dans un instant.'
    resetting.value = false
  }
}
</script>

<template>
  <div ref="rootRef" class="settings-admin">
    <h3 class="settings__title">Administration</h3>

    <div class="sw-row">
      <span class="sw-key">Accélération des voyages</span>
      <AppSwitch
        v-model="fastTransit"
        :disabled="savingTransit"
        aria-label="Accélération des voyages"
      />
    </div>
    <p class="settings__text">
      Mode test, pour ce compte seulement : un voyage dure quelques secondes au lieu de sa durée de jeu
      (Proxima Centauri ≈ 1 h). Les autres joueurs voyagent toujours à la durée normale.
      S'applique au prochain départ.
    </p>
    <p v-if="transitError" class="settings__text settings__text--error">{{ transitError }}</p>
    <Divider variant="solid" tight />

    <div class="settings-danger">
      <h4 class="settings-danger__title">Réinitialiser la partie</h4>
      <p class="settings__text">
        Le vaisseau {{ shipStore.name }} et toute la progression sont effacés&nbsp;: voyages, carte, signaux,
        observations, rapports, traces découvertes et interprétations. Le compte et le pseudo sont conservés ;
        la partie repart de Sol, à l'écran de création. Cette action ne peut pas être annulée.
      </p>

      <button v-if="!confirming" type="button" class="btn btn-danger settings-danger__action" @click="startConfirm">
        Réinitialiser la partie
      </button>

      <form v-else class="settings-danger__confirm" novalidate @submit.prevent="resetGame">
        <AppTextField
          v-model="confirmText"
          :label="`Saisissez ${CONFIRM_WORD} pour confirmer`"
          autocomplete="off"
          :error="resetError"
          :disabled="resetting"
        />
        <div class="settings-danger__buttons">
          <button type="button" class="btn btn-ghost" :disabled="resetting" @click="cancel">Annuler</button>
          <button type="submit" class="btn btn-danger" :disabled="!canReset">
            {{ resetting ? 'Réinitialisation…' : 'Réinitialiser définitivement' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
