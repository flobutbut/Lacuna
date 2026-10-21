<script setup>
/**
 * EditableValueRow — ligne clé / valeur (style widget) modifiable sur place.
 * « Modifier » ouvre un AppTextField ; « Enregistrer » valide puis appelle save().
 * Échap annule ; l'erreur de validation ou d'enregistrement s'affiche sous le champ.
 */
import { ref, nextTick } from 'vue'
import AppTextField from '@/components/AppTextField.vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: String, default: '' },
  hint: { type: String, default: '' },
  /** (valeur) => message d'erreur ou null */
  validate: { type: Function, default: () => null },
  /** async (valeur) => void ; lève une erreur en cas d'échec */
  save: { type: Function, required: true },
  /** Message affiché si save() échoue */
  saveErrorMessage: { type: String, default: 'Enregistrement impossible. Réessayez.' },
})

const editing = ref(false)
const draft = ref('')
const error = ref('')
const saving = ref(false)
const rootRef = ref(null)

async function startEdit() {
  draft.value = props.value
  error.value = ''
  editing.value = true
  await nextTick()
  rootRef.value?.querySelector('input')?.focus()
}

function cancel() {
  editing.value = false
  error.value = ''
}

async function submit() {
  error.value = props.validate(draft.value) ?? ''
  if (error.value) return
  if (draft.value.trim() === props.value) return cancel()
  saving.value = true
  try {
    await props.save(draft.value)
    editing.value = false
  } catch (err) {
    console.warn('[EditableValueRow] Erreur enregistrement:', err?.message)
    error.value = props.saveErrorMessage
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div ref="rootRef" class="editable-row">
    <div v-if="!editing" class="sw-row editable-row__view">
      <span class="sw-key">{{ label }}</span>
      <span class="editable-row__value">
        <span class="sw-val">{{ value || '—' }}</span>
        <button type="button" class="btn-ghost editable-row__edit" :aria-label="`Modifier : ${label}`" @click="startEdit">
          Modifier
        </button>
      </span>
    </div>
    <form v-else class="editable-row__form" novalidate @submit.prevent="submit" @keydown.esc.prevent="cancel">
      <AppTextField v-model="draft" :label="label" :hint="hint" :error="error" :disabled="saving" />
      <div class="editable-row__actions">
        <button type="button" class="btn-ghost" :disabled="saving" @click="cancel">Annuler</button>
        <button type="submit" class="btn-primary" :disabled="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.editable-row__value {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
}

.editable-row__edit {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}

.editable-row__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4) 0;
}

.editable-row__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-4);
}
</style>
