<script setup>
import { computed } from 'vue'
import iconSysteme from '@/assets/icons/observation-types/icon-systeme.svg?raw'
import iconExoplanete from '@/assets/icons/observation-types/icon-exoplanete.svg?raw'
import iconEchantillon from '@/assets/icons/observation-types/icon-echantillon.svg?raw'

/**
 * Icône de type d'observation (Laboratoire) :
 * - Étoile (ETOILE) → système (point dans un cercle)
 * - Exoplanètes, astres (PLANETE, MINEUR, ATMOSPHERE) → exoplanète (point sur le périmètre)
 * - Échantillon (OBJET) → cube
 */
const ICONS = {
  systeme: iconSysteme,
  exoplanete: iconExoplanete,
  echantillon: iconEchantillon,
}

const props = defineProps({
  type: { type: String, required: true },
  size: { type: Number, default: 14 },
})

const iconVariant = computed(() => {
  switch (props.type) {
    case 'ETOILE':
      return 'systeme'
    case 'OBJET':
      return 'echantillon'
    case 'PLANETE':
    case 'MINEUR':
    case 'ATMOSPHERE':
    default:
      return 'exoplanete'
  }
})

const iconSvg = computed(() => ICONS[iconVariant.value] ?? ICONS.exoplanete)

const labels = {
  systeme: 'Étoile',
  exoplanete: 'Astre',
  echantillon: 'Échantillon',
}
</script>

<template>
  <span
    class="observation-type-icon"
    :class="`observation-type-icon--${iconVariant}`"
    :style="{ width: size + 'px', height: size + 'px' }"
    role="img"
    :aria-label="labels[iconVariant] ?? 'Observation'"
    v-html="iconSvg"
  />
</template>

<style scoped>
.observation-type-icon {
  display: inline-flex;
  flex-shrink: 0;
}

.observation-type-icon :deep(svg) {
  width: 100%;
  height: 100%;
  color: var(--color-white);
}
</style>
