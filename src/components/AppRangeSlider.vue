<script setup>
/**
 * AppRangeSlider — curseur range (design system)
 */
defineProps({
  /** Valeur (v-model) */
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 1 },
  step: { type: Number, default: 0.05 },
  /** Libellé à gauche du curseur */
  label: { type: String, default: '' },
  /** aria-label du input range */
  ariaLabel: { type: String, default: undefined },
  /** Largeur du curseur (CSS) */
  sliderWidth: { type: String, default: '80px' },
})

const emit = defineEmits(['update:modelValue'])

function onInput(e) {
  emit('update:modelValue', parseFloat(e.target.value))
}
</script>

<template>
  <div class="ds-range">
    <span
      v-if="label"
      class="ds-range__label"
    >{{ label }}</span>
    <input
      type="range"
      class="ds-range__slider"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      :aria-label="ariaLabel"
      :style="{ width: sliderWidth }"
      @input="onInput"
    />
  </div>
</template>

<style scoped>
.ds-range {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.ds-range__label {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-muted);
  white-space: nowrap;
}
.ds-range__slider {
  accent-color: var(--color-cyan);
}
</style>
