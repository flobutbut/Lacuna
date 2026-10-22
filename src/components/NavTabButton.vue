<script setup>
/**
 * NavTabButton — Onglet de la barre de navigation principale (modules : Observatoire, Carte, etc.)
 */
import AppIcon from '@/components/icons/AppIcon.vue'

defineProps({
  /** Nom d'icône (components/icons/iconSet.js) */
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
    <span class="nav-tab-btn__icon"><AppIcon v-if="icon" :name="icon" /></span>
    <span class="nav-tab-btn__label">{{ label }}</span>
    <span v-if="badge" class="nav-tab-btn__badge" />
  </RouterLink>
</template>
