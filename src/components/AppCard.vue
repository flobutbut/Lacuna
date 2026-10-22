<script setup>
import AppIcon from '@/components/icons/AppIcon.vue'
/**
 * Card réutilisable du design system.
 * Affiche : icône/illustration (slot), titre, sous-titre/description, actions (slot).
 * Optionnel : bouton supprimer, badge, clic sur la card, état sélectionné.
 * Tous les styles utilisent les tokens (couleurs, espacements, typo).
 */
const props = defineProps({
  /** Titre principal (utilisé si le slot #title n'est pas fourni) */
  title: { type: String, default: '' },
  /** Sous-titre / description (utilisé si le slot #subtitle n'est pas fourni) */
  subtitle: { type: String, default: '' },
  /** Statut affiché à droite du titre (utilisé si le slot #status n'est pas fourni) */
  status: { type: String, default: '' },
  /** Afficher le bouton supprimer (×) en haut à droite */
  dismissable: { type: Boolean, default: false },
  /** Badge optionnel affiché en haut à droite (avant le bouton supprimer) */
  badge: { type: [String, Number], default: '' },
  /** La card est cliquable et émet @click */
  clickable: { type: Boolean, default: false },
  /** État visuel sélectionné (bordure et fond accentués) */
  selected: { type: Boolean, default: false },
})

const emit = defineEmits(['click', 'dismiss'])

function onClick() {
  if (props.clickable) emit('click')
}

function onDismiss(e) {
  e.stopPropagation()
  emit('dismiss')
}
</script>

<template>
  <div
    class="app-card"
    :class="{
      'app-card--clickable': clickable,
      'app-card--selected': selected,
      'app-card--has-dismiss': dismissable || badge,
    }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="onClick"
    @keydown.enter.space.prevent="clickable && onClick()"
  >
    <button
      v-if="dismissable"
      type="button"
      class="app-card__dismiss"
      aria-label="Retirer de la liste"
      @click="onDismiss"
    >
      <AppIcon name="close" />
    </button>
    <span v-if="badge" class="app-card__badge" :title="String(badge)">{{ badge }}</span>
    <div class="app-card__body">
      <div v-if="$slots.icon" class="app-card__icon">
        <slot name="icon" />
      </div>
      <div class="app-card__main">
        <div v-if="$slots.title || title || $slots.status || status" class="app-card__title-row">
          <div v-if="$slots.title || title" class="app-card__title">
            <slot name="title">{{ title }}</slot>
          </div>
          <div v-if="$slots.status || status" class="app-card__status">
            <slot name="status">{{ status }}</slot>
          </div>
        </div>
        <div v-if="$slots.subtitle || subtitle" class="app-card__subtitle">
          <slot name="subtitle">{{ subtitle }}</slot>
        </div>
      </div>
    </div>
    <div v-if="$slots.actions" class="app-card__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.app-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-3) var(--space-3);
  background: var(--color-bg-alt);
  border: var(--border-width) solid var(--border-default);
  border-radius: var(--border-radius-sm);
}

.app-card.app-card--has-dismiss {
  padding-right: calc(var(--space-3) + 28px);
}

.app-card--clickable {
  cursor: pointer;
  transition: border-color var(--transition-base), background var(--transition-base);
}

.app-card--clickable:hover {
  border-color: var(--border-bright);
  background: var(--color-cyan-subtle);
}

.app-card--selected {
  border-color: var(--color-cyan);
  background: var(--color-cyan-subtle);
}

.app-card__dismiss {
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

.app-card__dismiss:hover {
  color: var(--color-white);
  background: color-mix(in srgb, var(--color-red) 20%, transparent);
}

.app-card__badge {
  position: absolute;
  top: var(--space-2);
  right: 28px;
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  color: var(--color-muted);
}

.app-card__body {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  min-width: 0;
}

.app-card__icon {
  flex-shrink: 0;
  width: var(--space-10);
  height: var(--space-10);
  padding-left: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: content-box;
}

.app-card__icon :deep(svg),
.app-card__icon :deep(img),
.app-card__icon :deep(.star-svg-inline),
.app-card__icon :deep(.planet-svg-inline) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.app-card__main {
  flex: 1;
  min-width: 0;
}

.app-card__title-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.app-card__title {
  flex: 1;
  min-width: 0;
  font-size: var(--text-base);
  font-family: var(--font-mono);
  font-weight: var(--weight-regular);
  letter-spacing: var(--tracking-tight);
  color: var(--color-cyan-muted);
  line-height: var(--leading-normal);
}

.app-card__status {
  flex-shrink: 0;
  margin-left: auto;
  font-size: var(--text-base);
  font-family: var(--font-mono);
  color: var(--color-muted);
  line-height: var(--leading-normal);
}

.app-card__subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  margin-top: var(--space-1);
  font-size: var(--text-base);
  font-family: var(--font-mono);
  color: var(--color-muted);
  line-height: var(--leading-normal);
}

.app-card__actions {
  display: flex;
  gap: var(--space-2);
  width: 100%;
  padding-top: var(--space-2);
}

.app-card__actions :deep(.btn) {
  flex: 1;
  min-width: 0;
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-base);
}
</style>
