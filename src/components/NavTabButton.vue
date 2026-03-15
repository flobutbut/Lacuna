<script setup>
/**
 * NavTabButton — Onglet de la barre de navigation principale (modules : Observatoire, Carte, etc.)
 */
defineProps({
  icon: { type: String, default: '' },
  label: { type: String, default: '' },
  to: { type: [String, Object], default: '' },
  active: { type: Boolean, default: false },
  badge: { type: Boolean, default: false },
})
</script>

<template>
  <RouterLink
    :to="to"
    class="nav-tab-btn"
    :class="{ active }"
  >
    <span class="nav-tab-btn__icon">{{ icon }}</span>
    <span class="nav-tab-btn__label">{{ label }}</span>
    <span v-if="badge" class="nav-tab-btn__badge" />
  </RouterLink>
</template>
