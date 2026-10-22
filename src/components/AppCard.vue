<script setup>
import AppIcon from '@/components/icons/AppIcon.vue'
/**
 * Card réutilisable du design system (styles : assets/components/card.css).
 * En-tête : icône (slot), titre, méta, et à droite statut · badge · fermer sur une seule rangée.
 * Slots : #icon, #title, #subtitle (méta en ligne, éléments séparés par « · »),
 * #meta (lignes de méta supplémentaires), défaut (contenu sous l'en-tête), #actions (pied de carte).
 */
const props = defineProps({
  /** Titre principal (utilisé si le slot #title n'est pas fourni) */
  title: { type: String, default: '' },
  /** Couleur du titre : 'default' | 'signal' */
  titleVariant: { type: String, default: 'default' },
  /** Méta / description (utilisée si le slot #subtitle n'est pas fourni) */
  subtitle: { type: String, default: '' },
  /** Statut affiché à droite du titre (utilisé si le slot #status n'est pas fourni) */
  status: { type: String, default: '' },
  /** Badge optionnel, à droite après le statut */
  badge: { type: [String, Number], default: '' },
  /** Couleur du badge : 'default' | 'warn' */
  badgeVariant: { type: String, default: 'default' },
  /** Afficher le bouton fermer (×) en haut à droite */
  dismissable: { type: Boolean, default: false },
  /** Libellé accessible du bouton fermer */
  dismissLabel: { type: String, default: 'Retirer de la liste' },
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
    class="app-card card"
    :class="{ 'card--interactive': clickable, 'is-selected': selected }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    @click="onClick"
    @keydown.enter.space.self.prevent="clickable && onClick()"
  >
    <div class="card__header">
      <div v-if="$slots.icon" class="card__icon">
        <slot name="icon" />
      </div>
      <div class="card__main">
        <div
          v-if="$slots.title || title"
          class="card__title"
          :class="{ 'card__title--signal': titleVariant === 'signal' }"
        >
          <slot name="title">{{ title }}</slot>
        </div>
        <div v-if="$slots.subtitle || subtitle" class="card__meta card__meta--inline">
          <slot name="subtitle">{{ subtitle }}</slot>
        </div>
        <slot name="meta" />
      </div>
      <div v-if="$slots.status || status || badge || dismissable" class="card__aside">
        <span v-if="$slots.status || status" class="card__status">
          <slot name="status">{{ status }}</slot>
        </span>
        <span
          v-if="badge"
          class="card__badge"
          :class="{ 'card__badge--warn': badgeVariant === 'warn' }"
        >{{ badge }}</span>
        <button
          v-if="dismissable"
          type="button"
          class="card__dismiss"
          :aria-label="dismissLabel"
          :title="dismissLabel"
          @click="onDismiss"
        >
          <AppIcon name="close" />
        </button>
      </div>
    </div>
    <div v-if="$slots.default" class="card__body">
      <slot />
    </div>
    <div v-if="$slots.actions" class="card__actions">
      <slot name="actions" />
    </div>
  </div>
</template>
