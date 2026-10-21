<script setup>
/**
 * AppSwitch — interrupteur marche / arrêt du design system.
 * v-model booléen ; libellé visible facultatif, sinon `ariaLabel` donne le nom accessible.
 */
const model = defineModel({ type: Boolean, default: false })

defineProps({
  /** Libellé affiché à gauche de l'interrupteur */
  label: { type: String, default: '' },
  /** Nom accessible quand il n'y a pas de libellé visible */
  ariaLabel: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <button
    type="button"
    role="switch"
    class="app-switch"
    :class="{ 'app-switch--on': model }"
    :aria-checked="model ? 'true' : 'false'"
    :aria-label="label ? undefined : ariaLabel"
    :disabled="disabled"
    @click="model = !model"
  >
    <span v-if="label" class="app-switch__label">{{ label }}</span>
    <span class="app-switch__track" aria-hidden="true">
      <span class="app-switch__thumb" />
    </span>
  </button>
</template>

<style scoped>
.app-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-normal);
  text-transform: uppercase;
  cursor: pointer;
  pointer-events: auto;
  transition: color var(--transition-base);
}

.app-switch:hover {
  color: var(--color-white);
}

.app-switch:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.app-switch__track {
  position: relative;
  flex-shrink: 0;
  width: 28px;
  height: 14px;
  border: var(--border-width) solid var(--border-bright);
  border-radius: 7px;
  background: var(--color-panel);
  transition: background var(--transition-base), border-color var(--transition-base);
}

.app-switch__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 8px;
  height: 8px;
  border-radius: var(--border-radius-full);
  background: var(--color-muted);
  transition: transform var(--transition-base), background var(--transition-base);
}

.app-switch--on {
  color: var(--color-cyan);
}

.app-switch--on .app-switch__track {
  border-color: var(--color-cyan-dim);
  background: var(--color-cyan-active);
}

.app-switch--on .app-switch__thumb {
  transform: translateX(14px);
  background: var(--color-cyan);
}

.app-switch:focus-visible {
  outline: none;
}

.app-switch:focus-visible .app-switch__track {
  box-shadow: 0 0 0 2px var(--color-cyan-glow);
  border-color: var(--color-cyan);
}
</style>
