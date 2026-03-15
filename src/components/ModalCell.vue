<script setup>
defineProps({
  /** Variant: 'default' (observatoire) ou 'compact' (transit phases) */
  variant: { type: String, default: 'default' },
})
</script>

<template>
  <div class="modal-cell" :class="`modal-cell--${variant}`">
    <slot />
  </div>
</template>
