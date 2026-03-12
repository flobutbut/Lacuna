<script setup>
import { computed } from 'vue'

/**
 * Icône de type d'observation (Laboratoire) :
 * - Système (planètes, mineurs, atmosphères) → point dans un cercle
 * - Objets stellaires (étoiles) → point sur le périmètre d'un cercle
 * - Échantillon (OBJET) → cube (placeholder, non implémenté)
 */
const props = defineProps({
  type: { type: String, required: true },
  size: { type: Number, default: 14 },
})

const iconVariant = computed(() => {
  switch (props.type) {
    case 'ETOILE':
      return 'stellaire'
    case 'OBJET':
      return 'echantillon'
    case 'PLANETE':
    case 'MINEUR':
    case 'ATMOSPHERE':
    default:
      return 'systeme'
  }
})

const labels = {
  systeme: 'Système',
  stellaire: 'Objet stellaire',
  echantillon: 'Échantillon',
}
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 16 16"
    fill="currentColor"
    class="observation-type-icon"
    :class="`observation-type-icon--${iconVariant}`"
    role="img"
    :aria-label="labels[iconVariant] ?? 'Observation'"
  >
    <!-- Système : point dans un cercle -->
    <g v-if="iconVariant === 'systeme'">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2" />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </g>
    <!-- Objet stellaire : point sur le périmètre -->
    <g v-else-if="iconVariant === 'stellaire'">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2" />
      <circle cx="8" cy="2" r="2" fill="currentColor" />
    </g>
    <!-- Échantillon : cube (placeholder, non implémenté) -->
    <g v-else>
      <path
        d="M5 11 L5 5 L8 3 L11 5 L11 11 L8 13 Z M5 5 L8 7 L11 5 M8 7 L8 13"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linejoin="round"
      />
    </g>
  </svg>
</template>

<style scoped>
.observation-type-icon {
  flex-shrink: 0;
}

.observation-type-icon--systeme,
.observation-type-icon--stellaire,
.observation-type-icon--echantillon {
  color: var(--color-white);
}
</style>
