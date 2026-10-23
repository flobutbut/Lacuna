<script setup>
/**
 * Onboarding — écrans 1 à 4 (LACUNA_LORE.md §3, texte exact ; LACUNA_UI.md §9).
 * Fond noir, texte centré, aucune instruction ni barre de progression. Les paragraphes apparaissent un à un ;
 * un clic ou une touche révèle d'abord le reste de l'écran, puis passe au suivant : le joueur avance à son rythme. « Passer » seulement pour une nouvelle partie (pas la première du compte).
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

defineProps({
  /** Nouvelle partie après une réinitialisation : la séquence peut être passée */
  skippable: { type: Boolean, default: false },
})
const emit = defineEmits(['done'])

const SCREENS = [
  {
    blocks: [
      `Le 12 septembre 2031, le Consortium pour l'Exploration
Galactique Profonde a rendu public un catalogue de
847 anomalies détectées dans un rayon de 500 années-lumière.`,
      `Parmi elles, 12 résistent à toute modélisation
naturelle connue après 8 années d'analyse collective.`,
      `Ce catalogue est le résultat de 14 ans de travail
commun entre 34 nations et 6 agences spatiales.`,
      `C'est la première fois dans l'histoire que l'humanité
s'accorde sur ce qu'elle ne comprend pas.`,
    ],
  },
  {
    blocks: [
      `15 août 1977 — Big Ear Observatory, Ohio
Signal radio, 72 secondes, 1420 MHz.
Non reproduit. Non expliqué.`,
      `19 octobre 2017 — Pan-STARRS, Hawaï
Objet interstellaire, trajectoire hyperbolique,
accélération non-gravitationnelle.
Origine : inconnue.`,
      `29 janvier 2025 — NASA / OSIRIS-REx
Échantillons de l'astéroïde Bennu.
Les cinq nucléobases de l'ADN et de l'ARN.
Antérieures à la formation de la Terre.`,
    ],
    data: true,
  },
  {
    blocks: [
      `En 2035, après 4 ans de débat,
un consensus fragile s'est formé.`,
      `Pas une certitude.
Un pari.`,
      `67 nations ont financé la construction de vaisseaux
générationnels capables d'atteindre les anomalies
les plus proches.`,
      `Les volontaires savaient qu'ils ne reverraient pas
la Terre. Que leurs enfants non plus.
Que la première destination serait atteinte
longtemps après leur mort.`,
      `112 000 personnes se sont portées candidates.`,
      `15 000 ont été sélectionnées.`,
    ],
  },
  {
    blocks: [
      `Vous avez regardé la Terre disparaître
pendant 4 heures.`,
      `Elle est encore là — vous le savez.
Mais la lumière qui vous parvient d'elle
a déjà quelques minutes de retard.`,
      `Demain ce sera des heures.
Dans un an, des années.`,
      `Vous ne saurez plus jamais
ce qui s'y passe en ce moment.`,
    ],
  },
]

/** Intervalle entre deux paragraphes (ms) ; plus long pour les données brutes de l'écran 2 */
const BLOCK_DELAY_MS = 1800
const DATA_BLOCK_DELAY_MS = 2600
/** Délai minimal entre l'apparition du dernier paragraphe et le passage à l'écran suivant (ms) */
const READ_GUARD_MS = 800
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

const index = ref(0)
const screen = computed(() => SCREENS[index.value])
const shown = ref(0)
let revealTimer = null
let completeAt = 0

function revealAll() {
  clearTimeout(revealTimer)
  shown.value = screen.value.blocks.length
  completeAt = Date.now()
}

function revealNext() {
  shown.value++
  if (shown.value >= screen.value.blocks.length) {
    completeAt = Date.now()
    return
  }
  revealTimer = setTimeout(revealNext, screen.value.data ? DATA_BLOCK_DELAY_MS : BLOCK_DELAY_MS)
}

watch(
  index,
  () => {
    clearTimeout(revealTimer)
    shown.value = 0
    if (reducedMotion) revealAll()
    // Laisse le fondu entre deux écrans se faire avant le premier paragraphe
    else revealTimer = setTimeout(revealNext, 900)
  },
  { immediate: true }
)

function next() {
  if (shown.value < screen.value.blocks.length) return revealAll()
  if (Date.now() - completeAt < READ_GUARD_MS) return
  if (index.value < SCREENS.length - 1) index.value++
  else emit('done')
}

function onKey(e) {
  if (e.target?.closest?.('.onboarding-story__skip')) return
  if (['Enter', ' ', 'ArrowRight', 'PageDown'].includes(e.key)) {
    e.preventDefault()
    next()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  clearTimeout(revealTimer)
})

</script>

<template>
  <div class="onboarding-story" @click="next">
    <Transition name="onboarding-fade" mode="out-in">
      <div :key="index" class="onboarding-story__screen" :class="{ 'onboarding-story__screen--data': screen.data }">
        <p
          v-for="(block, i) in screen.blocks"
          :key="i"
          class="onboarding-story__block"
          :class="{ 'onboarding-story__block--shown': i < shown }"
          v-text="block"
        />
      </div>
    </Transition>
    <button
      v-if="skippable"
      type="button"
      class="onboarding-story__skip"
      @click.stop="emit('done')"
    >
      Passer
    </button>
  </div>
</template>

<style scoped>
.onboarding-story {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal, 1000);
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-10) var(--space-6);
  cursor: pointer;
  overflow: auto;
}

.onboarding-story__screen {
  max-width: 38rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.onboarding-story__screen--data {
  gap: var(--space-10);
}

.onboarding-story__block {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-md);
  line-height: var(--leading-relaxed);
  color: var(--color-white);
  white-space: pre-line;
  text-align: center;
  opacity: 0;
  transition: opacity 1.4s ease;
}

.onboarding-story__block--shown {
  opacity: 1;
}

.onboarding-story__skip {
  position: fixed;
  right: var(--space-6);
  bottom: var(--space-6);
  background: transparent;
  border: none;
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-normal);
  text-transform: uppercase;
  cursor: pointer;
  opacity: 0.6;
}

.onboarding-story__skip:hover,
.onboarding-story__skip:focus-visible {
  opacity: 1;
  color: var(--color-white);
}

.onboarding-fade-enter-active,
.onboarding-fade-leave-active {
  transition: opacity 1.2s ease;
}

.onboarding-fade-enter-from,
.onboarding-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .onboarding-fade-enter-active,
  .onboarding-fade-leave-active,
  .onboarding-story__block {
    transition: none;
  }
}

@media (max-width: 600px) {
  .onboarding-story__block {
    font-size: var(--text-base);
    white-space: normal;
  }
}
</style>
