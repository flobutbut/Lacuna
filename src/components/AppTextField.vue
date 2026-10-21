<script setup>
/**
 * AppTextField — champ de saisie du design system (libellé, aide, erreur).
 * v-model sur la valeur ; l'erreur remplace l'aide et est annoncée aux lecteurs d'écran.
 */
import { useId } from 'vue'

const model = defineModel({ type: String, default: '' })

defineProps({
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  autocomplete: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  /** Texte d'aide sous le champ */
  hint: { type: String, default: '' },
  /** Message d'erreur (prioritaire sur l'aide) */
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
})

const id = useId()
</script>

<template>
  <div class="app-text-field" :class="{ 'app-text-field--error': error }">
    <label :for="id" class="app-text-field__label">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      class="app-text-field__input"
      :type="type"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :autofocus="autofocus"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || hint ? `${id}-msg` : undefined"
    >
    <p
      v-if="error || hint"
      :id="`${id}-msg`"
      class="app-text-field__msg"
      :role="error ? 'alert' : undefined"
    >
      {{ error || hint }}
    </p>
  </div>
</template>

<style scoped>
.app-text-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.app-text-field__label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-normal);
  text-transform: uppercase;
  color: var(--color-muted);
}

.app-text-field__input {
  width: 100%;
  padding: var(--space-4) var(--space-5);
  font-family: var(--font-mono);
  font-size: var(--text-md);
  color: var(--color-white);
  background: var(--color-shade-30);
  border: var(--border-width) solid var(--border-default);
  border-radius: 0;
  outline: none;
  transition: border-color var(--transition-base), background var(--transition-base);
}

.app-text-field__input::placeholder {
  color: var(--color-muted);
}

.app-text-field__input:hover:not(:disabled) {
  border-color: var(--border-bright);
}

.app-text-field__input:focus-visible {
  border-color: var(--color-cyan);
  background: var(--color-cyan-subtle);
}

.app-text-field__input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.app-text-field__msg {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-muted);
}

.app-text-field--error .app-text-field__input {
  border-color: var(--color-red);
}

.app-text-field--error .app-text-field__msg {
  color: var(--color-red);
}
</style>
