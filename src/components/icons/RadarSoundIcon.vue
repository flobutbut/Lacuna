<script setup>
/**
 * Haut-parleur — traits `currentColor` (Lacuna).
 * Son activé : cône + 3 barres (lisible en petit).
 * Son coupé : cône + diagonale barrée au premier plan.
 */
defineProps({
  /** true = son coupé */
  muted: { type: Boolean, default: true },
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
    class="radar-sound-icon"
    aria-hidden="true"
  >
    <!-- cône -->
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <!-- activé : barres type “niveau” (toujours visibles) -->
    <template v-if="!muted">
      <line
        x1="14"
        y1="10"
        x2="14"
        y2="14"
      />
      <line
        x1="17"
        y1="8"
        x2="17"
        y2="16"
      />
      <line
        x1="20"
        y1="6"
        x2="20"
        y2="18"
      />
    </template>
    <!-- coupé : grande barre (au-dessus du cône) -->
    <line
      v-else
      x1="3"
      y1="3"
      x2="21"
      y2="21"
      stroke-width="2"
    />
  </svg>
</template>
