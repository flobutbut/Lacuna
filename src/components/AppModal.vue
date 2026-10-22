<script setup>
import Divider from '@/components/Divider.vue'

defineProps({
  /** Titre affiché dans le header (optionnel si slot #header utilisé) */
  title: { type: String, default: '' },
  /** Position du box : 'center' | 'top-right' */
  position: { type: String, default: 'center' },
  /** Taille du box : 'default' | 'large' (paramètres, contenus à plusieurs sections) */
  size: { type: String, default: 'default' },
  /** Afficher l'overlay (backdrop) — si false, interaction possible avec le reste de l'interface */
  overlay: { type: Boolean, default: true },
})

defineEmits(['close'])
</script>

<template>
  <div
    class="app-modal"
    :class="{
      'app-modal--top-right': position === 'top-right',
      'app-modal--large': size === 'large',
      'app-modal--no-overlay': !overlay,
    }"
  >
    <div v-if="overlay" class="app-modal__backdrop" @click="$emit('close')" />
    <div class="app-modal__box">
      <header class="app-modal__header">
        <slot name="header">
          <h2 v-if="title" class="app-modal__title">{{ title }}</h2>
        </slot>
        <button type="button" class="app-modal__close" @click="$emit('close')">×</button>
      </header>
      <Divider variant="solid" class="app-modal__divider" />
      <div class="app-modal__content">
        <slot />
      </div>
      <template v-if="$slots.footer">
        <Divider variant="solid" class="app-modal__divider" />
        <footer class="app-modal__footer">
          <slot name="footer" />
        </footer>
      </template>
    </div>
  </div>
</template>
