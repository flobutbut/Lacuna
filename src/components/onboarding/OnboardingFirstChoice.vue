<script setup>
/**
 * Onboarding — écran 5, le premier choix (LACUNA_LORE.md §3). Texte posé sur le ciel, sans bouton ni flèche ;
 * il disparaît quand le joueur fixe son premier cap.
 */
</script>

<template>
  <div class="onboarding-first-choice" role="note">
    <p>12 anomalies figurent dans le catalogue embarqué.</p>
    <p>Choisissez celle que vous voulez comprendre.</p>
  </div>
</template>

<style scoped>
.onboarding-first-choice {
  /* En bas du ciel, au-dessus de l'azimut : libre des barres d'outils et des panneaux latéraux */
  position: absolute;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
  max-width: calc(100% - 2 * var(--page-gutter));
  z-index: 5;
  pointer-events: none;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--text-md);
  line-height: var(--leading-relaxed);
  color: var(--color-white);
  text-shadow: 0 0 12px rgba(0, 0, 0, 0.9);
  animation: onboarding-first-choice-in 2s ease both;
}

.onboarding-first-choice p {
  margin: 0;
}

.onboarding-first-choice p + p {
  margin-top: var(--space-4);
}

@keyframes onboarding-first-choice-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-first-choice {
    animation: none;
  }
}
</style>
