<script setup>
import { computed } from 'vue'

import AppIcon from './AppIcon.vue'

const ICONS = {
  sursaut: 'signal-burst',
  pulse: 'signal-pulse',
  'non-uniforme': 'signal-irregular',
  carre: 'signal-square',
}

/**
 * Icône de structure de signal (jeu commun iconSet.js) :
 * - Sursaut → vague à une bosse
 * - Pulsé → sinusoïde
 * - Non uniforme → forme irrégulière
 * - Carré → onde carrée
 *
 * @param {string} structure - Valeur brute (ex: "non uniforme", "pulsé", "sursaut", "carré")
 * @param {boolean} [permanent] - Legacy : si fourni, prioritaire sur structure
 */
const props = defineProps({
  structure: { type: String, default: 'non uniforme' },
  permanent: { type: Boolean, default: undefined },
  size: { type: Number, default: 14 },
})

const effectiveStructure = computed(() => {
  if (props.permanent === true) return 'pulse'
  if (props.permanent === false) return 'non-uniforme'
  const s = (props.structure ?? '').toLowerCase()
  if (/sursaut|burst/.test(s)) return 'sursaut'
  if (/carré|carre/.test(s)) return 'carre'
  if (/pulsé|périodique|continu/.test(s)) return 'pulse'
  return 'non-uniforme'
})

const iconName = computed(() => ICONS[effectiveStructure.value] ?? ICONS['non-uniforme'])

const labels = {
  sursaut: 'Sursaut',
  pulse: 'Pulsé',
  'non-uniforme': 'Non uniforme',
  carre: 'Carré',
}
</script>

<template>
  <AppIcon
    :name="iconName"
    :size="size"
    :label="labels[effectiveStructure] ?? 'Signal'"
    class="signal-type-icon"
    :class="`signal-type-icon--${effectiveStructure}`"
  />
</template>

<style scoped>
.signal-type-icon {
  color: var(--color-white);
}
</style>
