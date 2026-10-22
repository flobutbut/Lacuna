<script setup>
import SignalTypeIcon from '@/components/icons/SignalTypeIcon.vue'
import ObservationTypeIcon from '@/components/icons/ObservationTypeIcon.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

defineProps({
  /** Type d'icône : 'signal' (structure) ou 'observation' (type ETOILE/PLANETE/etc.) */
  iconType: { type: String, default: 'signal' },
  /** Valeur pour l'icône : structure (sursaut, pulse…) ou type (ETOILE, PLANETE…) */
  iconValue: { type: String, default: '' },
  /** Titre principal */
  title: { type: String, default: '' },
  /** Variante titre : 'signal' pour --color-signal */
  titleVariant: { type: String, default: 'default' },
  /** Lignes métadonnées (texte secondaire) */
  rows: { type: Array, default: () => [] },
  /** Badge optionnel (ex. support Grav/EM) */
  badge: { type: String, default: '' },
  /** Barre de progression : { pct: number, variant?: 'amber'|'cyan' } */
  progress: { type: Object, default: null },
  /** État visuel : idle | selected | running | done | expired | highlight */
  state: { type: String, default: 'idle' },
  /** Texte d'état (ex. "En attente", "2 analyses réalisées") */
  stateText: { type: String, default: '' },
  /** Afficher le bouton dismiss */
  dismissable: { type: Boolean, default: true },
  /** Label aria pour le bouton dismiss */
  dismissLabel: { type: String, default: 'Supprimer' },
})

const emit = defineEmits(['click', 'dismiss'])

function onClick() {
  emit('click')
}

function onDismiss(e) {
  e.stopPropagation()
  emit('dismiss')
}
</script>

<template>
  <div
    class="observation-card"
    :class="[
      `observation-card--state-${state}`,
      titleVariant === 'signal' && 'observation-card--title-signal',
    ]"
    role="button"
    tabindex="0"
    @click="onClick"
    @keydown.enter.space.prevent="onClick"
  >
    <button
      v-if="dismissable"
      type="button"
      class="observation-card__dismiss"
      :aria-label="dismissLabel"
      @click="onDismiss"
    >
      <AppIcon name="close" />
    </button>
    <span class="observation-card__icon">
      <SignalTypeIcon v-if="iconType === 'signal'" :structure="iconValue" :size="12" />
      <ObservationTypeIcon v-else :type="iconValue" :size="12" />
    </span>
    <span v-if="badge" class="observation-card__badge" :title="badge">{{ badge }}</span>
    <div class="observation-card__main">
      <div class="observation-card__title">{{ title }}</div>
      <div v-for="(row, i) in rows" :key="i" class="observation-card__row">{{ row }}</div>
      <div v-if="stateText" class="observation-card__state" :class="`observation-card__state--${state}`">
        {{ stateText }}
      </div>
      <ProgressBar v-if="progress" :value="progress.pct" :color="progress.variant === 'cyan' ? 'cyan' : 'amber'" pct class="observation-card__bar" />
    </div>
  </div>
</template>

<style scoped>
.observation-card {
  position: relative;
  padding: var(--space-3) var(--space-4);
  padding-left: 28px;
  padding-right: 28px;
  margin-bottom: var(--space-2);
  border: var(--border-width) solid var(--border-default);
  background: var(--color-shade-30);
  cursor: pointer;
  transition: border-color var(--transition-base), background var(--transition-base);
}

.observation-card:hover {
  border-color: var(--border-bright);
  background: var(--color-cyan-subtle);
}

.observation-card--state-selected {
  border-color: var(--color-cyan);
  background: var(--color-cyan-subtle);
}

.observation-card--state-expired {
  opacity: 0.6;
}

.observation-card--state-highlight {
  border-color: var(--color-amber);
  box-shadow: 0 0 0 1px var(--color-amber-dim);
}

.observation-card__dismiss {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: none;
  color: var(--color-muted);
  font-size: var(--text-md);
  cursor: pointer;
  line-height: var(--leading-none);
  border-radius: var(--border-radius-sm);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.observation-card__dismiss:hover {
  color: var(--color-white);
  background: color-mix(in srgb, var(--color-red) 20%, transparent);
}

.observation-card__icon {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  opacity: 0.9;
}

.observation-card__badge {
  position: absolute;
  top: var(--space-2);
  right: 28px;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-normal);
}

.observation-card__main {
  padding-right: 4px;
}

.observation-card__title {
  font-size: var(--text-md);
  color: var(--color-white);
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-tight);
}

.observation-card--title-signal .observation-card__title {
  color: var(--color-signal);
}

.observation-card__row {
  font-size: var(--text-md);
  color: var(--color-muted);
  margin-top: var(--space-1);
}

.observation-card__state {
  font-size: var(--text-md);
  color: var(--color-amber);
  margin-top: var(--space-1);
}

.observation-card__state--done {
  color: var(--color-green);
}

.observation-card__state--running {
  color: var(--color-amber);
  font-style: italic;
}

:deep(.observation-card__bar) {
  margin-top: var(--space-2);
}
</style>
