<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

/**
 * Icône de type d'observation (Laboratoire) :
 * - Étoile (ETOILE) → système (point dans un cercle)
 * - Exoplanètes, astres (PLANETE, MINEUR, ATMOSPHERE) → exoplanète (point sur le périmètre)
 * - Échantillon (OBJET) → cube
 */
const ICONS = {
  systeme: 'obs-system',
  exoplanete: 'obs-planet',
  echantillon: 'specimen',
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

const iconName = computed(() => ICONS[iconVariant.value] ?? ICONS.exoplanete)

const labels = {
  systeme: 'Étoile',
  exoplanete: 'Astre',
  echantillon: 'Échantillon',
}
</script>

<template>
  <AppIcon
    :name="iconName"
    :size="size"
    :label="labels[iconVariant] ?? 'Observation'"
    class="observation-type-icon"
    :class="`observation-type-icon--${iconVariant}`"
  />
</template>

<style scoped>
.observation-type-icon {
  color: var(--color-white);
}
</style>
