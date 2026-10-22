<script setup>
defineProps({
  /** Variant: 'default' ou 'compact' (phases de transit) — base .card (card.css) */
  variant: { type: String, default: 'default' },
})
</script>

<template>
  <div class="modal-cell card" :class="`modal-cell--${variant}`">
    <slot />
  </div>
</template>
