<script setup>
/**
 * SiteDoc — page de texte du site public (mentions légales, confidentialité, conditions, crédits).
 */
import SiteLayout from '@/components/site/SiteLayout.vue'

defineProps({
  kicker: { type: String, required: true },
  title: { type: String, required: true },
  /** Date de mise à jour affichée sous le titre (facultative) */
  updatedAt: { type: String, default: '' },
})
</script>

<template>
  <SiteLayout>
    <article class="site-doc">
      <p class="site-doc__kicker">{{ kicker }}</p>
      <h1 class="site-doc__title">{{ title }}</h1>
      <p v-if="updatedAt" class="site-doc__date">Dernière mise à jour : {{ updatedAt }}</p>
      <slot />
    </article>
  </SiteLayout>
</template>
