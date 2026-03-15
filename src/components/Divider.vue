<script setup>
/**
 * Divider — Ligne de séparation horizontale
 * Variants : dashed | solid (continu)
 */
defineProps({
  variant: { type: String, default: 'solid' }, // 'dashed' | 'solid'
  tight: { type: Boolean, default: false }, // espacement réduit
})
</script>

<template>
  <hr
    class="divider"
    :class="[`divider--${variant}`, { 'divider--tight': tight }]"
    role="separator"
  >
</template>
