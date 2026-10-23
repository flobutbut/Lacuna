<script setup>
import '@/assets/components/population.css'
import { ref, computed, onMounted } from 'vue'
import { useShipStore } from '@/stores/ship'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { POPULATION_MENU_ITEMS } from '@/constants/menus'
import NavMenuItem from '@/components/NavMenuItem.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { formatEffectifTrend, formatNumber } from '@/lib/formatUtils'
import { INITIAL_POPULATION } from '@/constants/population'

const shipStore = useShipStore()
const activeTab = ref('current')

// Données de repli si pas de vaisseau / Supabase
const FALLBACK_GEN = {
  number: 1,
  effectif: INITIAL_POPULATION,
  effectifTrend: 'stable', // 'up' | 'down' | 'stable'
  will: 0.82,
  cohesion: 0.67,
  food: 0.91,
  care: 0.95,
  courant: 'COMPRENDRE',
  heritage: "La génération fondatrice. Ils ont regardé la Terre disparaître dans l'observatoire. Personne n'a dit grand chose.",
}

/** Génération actuelle : population du vaisseau (store ship), sinon repli */
const currentGen = computed(() => {
  const pop = shipStore.population
  if (!pop) return FALLBACK_GEN
  return {
    ...FALLBACK_GEN,
    number: pop.generation,
    effectif: pop.total,
    will: Number(pop.will),
    cohesion: Number(pop.social_cohesion),
    food: Number(pop.food_supply),
    care: Number(pop.medical_care),
  }
})

const generations = ref([
  {
    number: 1,
    startYear: 2187,
    endYear: 2212,
    systems: ['Sol'],
    events: [`Départ. ${formatNumber(INITIAL_POPULATION)} âmes embarquées.`, 'Signal WOW-1977-A analysé.', 'Première trace interprétée.'],
  },
])

const reasons = ref([
  {
    id: 1,
    generation: 1,
    context: 'Jour 0',
    text: "Parce que la réponse à cette question justifie\nqu'on ne reviendra jamais.",
    count: null,
  },
  {
    id: 2,
    generation: 1,
    context: 'WOW-1977-A',
    text: "Parce qu'il y a quelque chose ici qui attendait\nqu'on arrive.",
    count: null,
  },
  {
    id: 3,
    generation: 1,
    context: 'Oumuamua',
    text: "Parce que la vie que nous avons trouvée ne sait pas encore\nque quelqu'un est venu la voir.",
    count: null,
  },
])

onMounted(async () => {
  await ensureStoresLoaded(shipStore)
})
</script>

<template>
  <div class="page-full page-full--spread">
    <div class="pop-layout">
      <!-- Colonne gauche : menu -->
      <div class="pop-menu-col">
        <h1 class="page-title">Population</h1>
        <div class="panel-section-title mb-6">
          Mémoire de la civilisation embarquée
        </div>
        <NavMenuItem
          v-for="item in POPULATION_MENU_ITEMS"
          :key="item.id"
          variant="menu"
          :icon="item.icon"
          :label="item.label"
          :selected="activeTab === item.id"
          @click="activeTab = item.id"
        />
      </div>

      <!-- Colonne droite : contenu -->
      <div class="pop-content-col">
      <!-- Onglet Génération actuelle -->
      <div v-show="activeTab === 'current'" class="pop-current">
        <div class="pop-current__header">
          GÉNÉRATION {{ currentGen.number }} — en cours
        </div>

        <div class="pop-indicator">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Effectif</span>
            <span class="pop-indicator__val">{{ formatNumber(currentGen.effectif) }} {{ formatEffectifTrend(currentGen.effectifTrend) }}</span>
          </div>
        </div>

        <div class="pop-indicator pop-indicator__bar">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Volonté</span>
            <span class="pop-indicator__val">{{ currentGen.will.toFixed(2) }}</span>
          </div>
          <ProgressBar :value="currentGen.will" color="cyan" />
        </div>

        <div class="pop-indicator pop-indicator__bar">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Cohésion</span>
            <span class="pop-indicator__val">{{ currentGen.cohesion.toFixed(2) }}</span>
          </div>
          <ProgressBar :value="currentGen.cohesion" color="cyan" />
        </div>

        <div class="pop-indicator pop-indicator__bar">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Alimentation</span>
            <span class="pop-indicator__val">{{ currentGen.food.toFixed(2) }}</span>
          </div>
          <ProgressBar :value="currentGen.food" color="cyan" />
        </div>

        <div class="pop-indicator pop-indicator__bar">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Soins</span>
            <span class="pop-indicator__val">{{ currentGen.care.toFixed(2) }}</span>
          </div>
          <ProgressBar :value="currentGen.care" color="cyan" />
        </div>

        <div class="pop-indicator">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Courant dominant</span>
            <span class="pop-indicator__val">{{ currentGen.courant }}</span>
          </div>
        </div>

        <div v-if="currentGen.heritage" class="pop-current__heritage">
          {{ currentGen.heritage }}
        </div>
      </div>

      <!-- Onglet Générations -->
      <div v-show="activeTab === 'generations'" class="pop-generations">
        <div
          v-for="gen in generations"
          :key="gen.number"
          class="pop-generation"
        >
          <div class="pop-generation__meta">GÉNÉRATION {{ gen.number }}</div>
          <div class="pop-generation__range">{{ gen.startYear }} — {{ gen.endYear }}</div>
          <div class="pop-generation__events">
            <ul v-if="gen.events?.length">
              <li v-for="(ev, i) in gen.events" :key="i">{{ ev }}</li>
            </ul>
            <template v-else>Systèmes visités : {{ gen.systems?.join(', ') || '—' }}</template>
          </div>
        </div>
      </div>

      <!-- Onglet Registre des Raisons -->
      <div v-show="activeTab === 'reasons'" class="pop-reasons">
        <div
          v-for="r in reasons"
          :key="r.id"
          class="pop-reason"
        >
          <div class="pop-reason__meta">
            ENTRÉE {{ String(r.id).padStart(3, '0') }} — Génération {{ r.generation }} — {{ r.context }}
          </div>
          <div class="pop-reason__text">{{ r.text }}</div>
          <div v-if="r.count" class="pop-reason__count">
            — déposée par {{ r.count }} personnes simultanément
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>
