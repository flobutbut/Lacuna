<script setup>
/**
 * NavMenuItem — Item de menu ou slot réutilisable
 * Variants: menu (Systèmes, Population), slot (Artefacts)
 */
defineProps({
  /** Variant: 'menu' | 'slot' */
  variant: { type: String, default: 'menu' },
  /** Icône (caractère Unicode) */
  icon: { type: String, default: '' },
  /** Libellé */
  label: { type: String, default: '' },
  /** État sélectionné */
  selected: { type: Boolean, default: false },
  /** Afficher le badge (point de notification) */
  badge: { type: Boolean, default: false },
  /** Couleur de l'icône : cyan, green, amber, signal, bumper, comms, nav */
  iconColor: { type: String, default: '' },
  /** Rôle pour l'accessibilité */
  role: { type: String, default: undefined },
})

defineEmits(['click'])
</script>

<template>
  <button
    type="button"
    :role="role ?? 'button'"
    class="nav-menu-item"
    :class="[
      `nav-menu-item--${variant}`,
      selected && 'nav-menu-item--selected',
      iconColor && `nav-menu-item--icon-${iconColor}`,
    ]"
    @click="$emit('click')"
  >
    <span class="nav-menu-item__icon">{{ icon }}</span>
    <span class="nav-menu-item__label">{{ label }}</span>
    <span v-if="badge" class="nav-menu-item__badge" />
  </button>
</template>
