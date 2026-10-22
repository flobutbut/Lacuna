<script setup>
import AppCard from '@/components/AppCard.vue'
import SignalTypeIcon from '@/components/icons/SignalTypeIcon.vue'
import ObservationTypeIcon from '@/components/icons/ObservationTypeIcon.vue'
import ProgressBar from '@/components/ProgressBar.vue'

/**
 * Carte d'observation (file du Laboratoire) — AppCard avec icône de signal ou de type d'objet,
 * lignes de méta, texte d'état et barre de progression.
 */
const props = defineProps({
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
</script>

<template>
  <AppCard
    class="observation-card"
    :class="{ 'is-highlight': props.state === 'highlight', 'is-muted': props.state === 'expired' }"
    :title="title"
    :title-variant="titleVariant"
    :badge="badge"
    :dismissable="dismissable"
    :dismiss-label="dismissLabel"
    clickable
    :selected="state === 'selected'"
    @click="emit('click')"
    @dismiss="emit('dismiss')"
  >
    <template #icon>
      <SignalTypeIcon v-if="iconType === 'signal'" :structure="iconValue" :size="14" />
      <ObservationTypeIcon v-else :type="iconValue" :size="14" />
    </template>
    <template #meta>
      <div v-for="(row, i) in rows" :key="i" class="card__meta">{{ row }}</div>
    </template>
    <template v-if="stateText || progress" #default>
      <div v-if="stateText" class="card__note" :class="{ 'card__note--done': state === 'done' }">
        {{ stateText }}
      </div>
      <ProgressBar
        v-if="progress"
        :value="progress.pct"
        :color="progress.variant === 'cyan' ? 'cyan' : 'amber'"
        pct
      />
    </template>
  </AppCard>
</template>
