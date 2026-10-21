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
/* Aligné sur .radar-filters__slider (ObservatoireRadarFilters) */
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
  -webkit-appearance: none;
  appearance: none;
  min-width: 72px;
  height: 4px;
  margin: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  vertical-align: middle;
}
.ds-range__slider:focus {
  outline: none;
}

/* WebKit */
.ds-range__slider::-webkit-slider-runnable-track {
  height: 4px;
  background: var(--border-default);
  border-radius: 2px;
}
.ds-range__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  margin-top: -3px;
  border-radius: 50%;
  background: var(--color-muted);
  border: 1px solid var(--border-bright);
  box-sizing: border-box;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}
.ds-range:hover .ds-range__slider::-webkit-slider-thumb {
  background: var(--color-white);
  border-color: var(--border-bright);
}
.ds-range:focus-within .ds-range__slider::-webkit-slider-thumb {
  background: var(--color-cyan);
  border-color: var(--color-cyan-dim);
}
.ds-range__slider:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 2px var(--color-cyan-glow);
}

/* Firefox */
.ds-range__slider::-moz-range-track {
  height: 4px;
  background: var(--border-default);
  border-radius: 2px;
}
.ds-range__slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-muted);
  border: 1px solid var(--border-bright);
  box-sizing: border-box;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}
.ds-range:hover .ds-range__slider::-moz-range-thumb {
  background: var(--color-white);
  border-color: var(--border-bright);
}
.ds-range:focus-within .ds-range__slider::-moz-range-thumb {
  background: var(--color-cyan);
  border-color: var(--color-cyan-dim);
}
.ds-range__slider:focus-visible::-moz-range-thumb {
  box-shadow: 0 0 0 2px var(--color-cyan-glow);
}
</style>
