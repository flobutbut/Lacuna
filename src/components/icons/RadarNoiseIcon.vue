<script setup>
import AppIcon from './AppIcon.vue'

/**
 * Bruit de fond radar — jeu commun (iconSet.js).
 * Activé : onde irrégulière type « grésillement ».
 * Désactivé : même trace + barre diagonale.
 */
defineProps({
  /** true = bruit coupé (icône barrée) */
  off: { type: Boolean, default: false },
  size: { type: Number, default: 16 },
})
</script>

<template>
  <AppIcon :name="off ? 'radar-noise-off' : 'radar-noise'" :size="size" class="radar-noise-icon" />
</template>
