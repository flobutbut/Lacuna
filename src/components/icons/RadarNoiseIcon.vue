<script setup>
/**
 * Bruit de fond radar — traits `currentColor` (Lacuna).
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
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="radar-noise-icon"
    aria-hidden="true"
  >
    <polyline points="3 14 5 9 7 15 9 8 11 16 13 10 15 14 17 11 19 13 21 12" />
    <line
      v-if="off"
      x1="4"
      y1="4"
      x2="20"
      y2="20"
      stroke-width="2"
    />
  </svg>
</template>
