<script setup>
/**
 * Valeur issue de content/legal.js ; « À compléter » en ambre tant qu'elle n'est pas renseignée.
 * mailto : affiche l'adresse comme lien email.
 */
defineProps({
  value: { type: [String, Number], default: null },
  mailto: { type: Boolean, default: false },
})
</script>

<template>
  <span v-if="value === null || value === ''" class="site-todo">À compléter</span>
  <a v-else-if="mailto" :href="`mailto:${value}`">{{ value }}</a>
  <template v-else>{{ value }}</template>
</template>
