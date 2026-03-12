<script setup>
import { computed } from 'vue'

import iconSursaut from '@/assets/signal-types/signal-sursaut.svg?raw'
import iconPulse from '@/assets/signal-types/signal-pulse.svg?raw'
import iconNonUniforme from '@/assets/signal-types/signal-non-uniforme.svg?raw'
import iconCarre from '@/assets/signal-types/signal-carre.svg?raw'

const ICONS = {
  sursaut: iconSursaut,
  pulse: iconPulse,
  'non-uniforme': iconNonUniforme,
  carre: iconCarre,
}

/**
 * Icône de structure de signal (SVG depuis assets) :
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

const iconSvg = computed(() => ICONS[effectiveStructure.value] ?? ICONS['non-uniforme'])

const labels = {
  sursaut: 'Sursaut',
  pulse: 'Pulsé',
  'non-uniforme': 'Non uniforme',
  carre: 'Carré',
}
</script>

<template>
  <span
    class="signal-type-icon"
    :class="`signal-type-icon--${effectiveStructure}`"
    :style="{ width: size + 'px', height: size + 'px' }"
    role="img"
    :aria-label="labels[effectiveStructure] ?? 'Signal'"
    v-html="iconSvg"
  />
</template>

<style scoped>
.signal-type-icon {
  display: inline-block;
  flex-shrink: 0;
  color: var(--color-white);
  overflow: visible;
}

.signal-type-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
</style>
