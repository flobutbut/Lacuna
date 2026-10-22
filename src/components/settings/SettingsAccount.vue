<script setup>
/**
 * SettingsAccount — section « Compte » des paramètres : email, suppression du compte.
 * La suppression est irréversible : elle demande de saisir le mot de confirmation.
 */
import { ref, computed, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useShipStore } from '@/stores/ship'
import AppTextField from '@/components/AppTextField.vue'
import Divider from '@/components/Divider.vue'

const CONFIRM_WORD = 'SUPPRIMER'

const authStore = useAuthStore()
const shipStore = useShipStore()

const rootRef = ref(null)
const confirming = ref(false)
const confirmText = ref('')
const deleting = ref(false)
const error = ref('')

const canDelete = computed(() => confirmText.value.trim().toUpperCase() === CONFIRM_WORD && !deleting.value)

async function startConfirm() {
  confirmText.value = ''
  error.value = ''
  confirming.value = true
  await nextTick()
  rootRef.value?.querySelector('input')?.focus()
}

function cancel() {
  confirming.value = false
  error.value = ''
}

async function deleteAccount() {
  if (!canDelete.value) return
  deleting.value = true
  error.value = ''
  try {
    // En cas de succès, App.vue recharge la page de connexion
    await authStore.deleteAccount()
  } catch (err) {
    console.warn('[settings] Suppression du compte:', err?.message)
    error.value = 'Suppression impossible. Réessayez dans un instant.'
    deleting.value = false
  }
}
</script>

<template>
  <div ref="rootRef" class="settings-account">
    <h3 class="settings__title">Compte</h3>
    <div class="sw-row">
      <span class="sw-key">Email</span>
      <span class="sw-val">{{ authStore.user?.email ?? '—' }}</span>
    </div>
    <Divider variant="solid" tight />

    <div class="settings-danger">
      <h4 class="settings-danger__title">Supprimer le compte</h4>
      <p class="settings__text">
        Le compte, le vaisseau {{ shipStore.name }} et toute la partie sont effacés définitivement&nbsp;:
        voyages, carte, signaux, observations, rapports et interprétations. Cette action ne peut pas être annulée.
      </p>

      <button v-if="!confirming" type="button" class="btn btn-danger settings-danger__action" @click="startConfirm">
        Supprimer le compte
      </button>

      <form v-else class="settings-danger__confirm" novalidate @submit.prevent="deleteAccount">
        <AppTextField
          v-model="confirmText"
          :label="`Saisissez ${CONFIRM_WORD} pour confirmer`"
          autocomplete="off"
          :error="error"
          :disabled="deleting"
        />
        <div class="settings-danger__buttons">
          <button type="button" class="btn btn-ghost" :disabled="deleting" @click="cancel">Annuler</button>
          <button type="submit" class="btn btn-danger" :disabled="!canDelete">
            {{ deleting ? 'Suppression…' : 'Supprimer définitivement' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
