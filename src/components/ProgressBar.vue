<script setup>
import { computed } from 'vue'
import { barWidth, barClass } from '@/lib/formatUtils'

/**
 * ProgressBar — Barre de progression (margin-bottom: --space-1)
 */
const props = defineProps({
  /** Valeur 0–1 (ou 0–100 si pct) */
  value: { type: Number, default: 0 },
  /** true si value est en 0–100 */
  pct: { type: Boolean, default: false },
  /** Couleur : 'cyan' | 'amber' | 'green' | 'red' — si absent, barClass(value) */
  color: { type: String, default: '' },
  /** Supprime margin-top et margin-bottom (ex. Drake) */
  noMargin: { type: Boolean, default: false },
})

const normalizedValue = computed(() => (props.pct ? props.value / 100 : props.value))

const fillClass = computed(() => {
  if (props.color) return `bar-${props.color}`
  return barClass(normalizedValue.value)
})

const widthStyle = computed(() => (props.pct ? props.value + '%' : barWidth(normalizedValue.value)))
</script>

<template>
  <div class="progress-bar" :class="{ 'progress-bar--no-margin': noMargin }">
    <div class="progress-bar__fill" :class="fillClass" :style="{ width: widthStyle }" />
  </div>
</template>
