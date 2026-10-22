<script setup>
import { computed } from 'vue'
import { ICONS } from './iconSet'

/**
 * AppIcon — icône SVG du jeu LACUNA (iconSet.js)
 * Taille par défaut 1em : l'icône suit la font-size de son conteneur.
 */
const props = defineProps({
  /** Nom dans iconSet.js */
  name: { type: String, required: true },
  /** Nombre (px) ou longueur CSS */
  size: { type: [Number, String], default: '1em' },
  /** Libellé accessible ; sans libellé, l'icône est décorative */
  label: { type: String, default: '' },
})

// Contenu statique de iconSet.js uniquement (jamais de donnée utilisateur)
const markup = computed(() => ICONS[props.name] ?? ICONS['dot-outline'])
const dimension = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
</script>

<template>
  <svg
    class="app-icon"
    :width="dimension"
    :height="dimension"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.25"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    :innerHTML="markup"
  />
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}

/* Trait de 1.25 px à l'écran quelle que soit la taille : sans ça, une icône
   de 36 px aurait un trait 2,5 fois plus épais qu'une icône de 14 px */
.app-icon :deep(*) {
  vector-effect: non-scaling-stroke;
}
</style>
