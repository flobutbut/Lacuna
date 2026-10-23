<script setup>
import { computed } from 'vue'
import { DEVIATION_FAMILIES } from '@/lib/deviations'
import { NIVEAU_LABELS } from '@/constants/lab'
import { formatDistanceLy } from '@/lib/starClassification'

/**
 * LabDoubtPanel — « Lever le doute » (LACUNA_VERDICT.md §6.1).
 * Les écarts restés à l'état d'ombre disent quel niveau d'observation manque ; le panneau dit
 * comment l'atteindre : relancer un instrument, approfondir sur place, ou préparer le voyage.
 * Le labo ne lance jamais le transit : « Préparer le voyage » ouvre la Carte sur le système.
 */
const props = defineProps({
  /** Doutes ouverts (getOpenDoubts) */
  doubts: { type: Array, required: true },
  /** { systemId, name, inSystem, distanceLy, generations } ou null si l'observation n'a pas de système */
  destination: { type: Object, default: null },
  /** L'observation peut être approfondie sur place (canDeepen) */
  canDeepen: { type: Boolean, default: false },
  inTransit: { type: Boolean, default: false },
})

const emit = defineEmits(['prepare', 'deepen'])

const reachable = computed(() => props.doubts.filter((d) => d.reachable))
const unreachable = computed(() => props.doubts.filter((d) => !d.reachable))

function familyLabel(family) {
  return (DEVIATION_FAMILIES[family]?.label ?? family).toLowerCase()
}

function generationsText(n) {
  if (n == null) return ''
  if (n < 1) return 'moins d’une génération'
  return `environ ${n} génération${n > 1 ? 's' : ''}`
}
</script>

<template>
  <div class="lab-doubt">
    <div class="lab-doubt__title">Lever le doute</div>

    <ul class="lab-doubt__list">
      <li v-for="d in doubts" :key="d.id">
        Écart ({{ familyLabel(d.family) }}) au-delà de la résolution —
        <span class="lab-doubt__level">niveau {{ NIVEAU_LABELS[d.requiresNiveau] }}</span>
        {{ d.reachable ? 'atteint.' : 'requis pour le caractériser.' }}
      </li>
    </ul>

    <p v-if="reachable.length" class="lab-doubt__hint">
      Relancez l’instrument marqué « Niveau atteint — relancer » pour le mesurer.
    </p>

    <template v-if="unreachable.length">
      <div v-if="destination?.inSystem" class="lab-doubt__action">
        <p class="lab-doubt__hint">Le vaisseau est dans ce système : approfondissez l’observation pour gagner un niveau.</p>
        <button v-if="canDeepen" type="button" class="btn btn-primary" @click="emit('deepen')">Approfondir</button>
      </div>
      <div v-else-if="destination" class="lab-doubt__action">
        <p class="lab-doubt__route">
          <span class="sw-val">{{ destination.name }}</span>
          <template v-if="destination.distanceLy">
            <span class="sw-key">·</span> <span class="sw-val">{{ formatDistanceLy(destination.distanceLy) }}</span>
            <span class="sw-key">·</span> <span class="sw-val">{{ generationsText(destination.generations) }}</span>
          </template>
        </p>
        <button type="button" class="btn btn-primary" :disabled="inTransit" @click="emit('prepare')">
          {{ inTransit ? 'Transit en cours' : 'Préparer le voyage' }}
        </button>
      </div>
      <p v-else class="lab-doubt__hint">Aucun système rattaché à cette observation : impossible de s’en approcher.</p>
    </template>
  </div>
</template>
