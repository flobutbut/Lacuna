<script setup>
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { barWidth } from '@/lib/formatUtils'

const supabaseStore = useSupabaseStore()
const activeTab = ref('current')

// Données de repli si pas de vaisseau / Supabase
const currentGen = ref({
  number: 1,
  effectif: 10247,
  effectifTrend: 'stable', // 'up' | 'down' | 'stable'
  will: 0.82,
  cohesion: 0.67,
  food: 0.91,
  care: 0.95,
  courant: 'COMPRENDRE',
  heritage: "La génération fondatrice. Ils ont regardé la Terre disparaître dans l'observatoire. Personne n'a dit grand chose.",
})

const generations = ref([
  {
    number: 1,
    startYear: 2187,
    endYear: 2241,
    systems: ['Sol'],
    events: ['Départ. 10 247 âmes embarquées.', 'Signal WOW-1977-A analysé.', 'Première trace interprétée.'],
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

function formatEffectifTrend(trend) {
  if (trend === 'up') return '↗'
  if (trend === 'down') return '↘'
  return '→'
}

async function fetchPopulation() {
  if (!supabaseStore.isConfigured()) return
  try {
    const { data: ships } = await supabase.from('ships').select('id').limit(1)
    if (!ships?.length) return
    const { data: pop } = await supabase
      .from('populations')
      .select('total, generation, will, social_cohesion, food_supply, medical_care')
      .eq('ship_id', ships[0].id)
      .single()
    if (pop) {
      currentGen.value = {
        number: pop.generation,
        effectif: pop.total,
        effectifTrend: 'stable',
        will: Number(pop.will),
        cohesion: Number(pop.social_cohesion),
        food: Number(pop.food_supply),
        care: Number(pop.medical_care),
        courant: 'COMPRENDRE',
        heritage: currentGen.value.heritage,
      }
    }
  } catch (err) {
    console.warn('[Population] Erreur fetch:', err)
  }
}

fetchPopulation()
</script>

<template>
  <div class="page-full page-full--spread">
    <div class="pop-layout">
      <!-- Colonne gauche : menu -->
      <div class="pop-menu-col">
        <h1 class="page-title">Population</h1>
        <div class="panel-section-title" style="margin-bottom: var(--space-6)">
          Mémoire de la civilisation embarquée
        </div>
        <div
          class="pop-menu-item"
          :class="{ selected: activeTab === 'generations' }"
          @click="activeTab = 'generations'"
        >
          <span class="pop-menu-item__icon">⊕</span>
          Générations
        </div>
        <div
          class="pop-menu-item"
          :class="{ selected: activeTab === 'current' }"
          @click="activeTab = 'current'"
        >
          <span class="pop-menu-item__icon">◉</span>
          Génération actuelle
        </div>
        <div
          class="pop-menu-item"
          :class="{ selected: activeTab === 'reasons' }"
          @click="activeTab = 'reasons'"
        >
          <span class="pop-menu-item__icon">◈</span>
          Registre des Raisons
        </div>
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
            <span class="pop-indicator__val">{{ currentGen.effectif.toLocaleString('fr-FR') }} {{ formatEffectifTrend(currentGen.effectifTrend) }}</span>
          </div>
        </div>

        <div class="pop-indicator pop-indicator__bar">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Volonté</span>
            <span class="pop-indicator__val">{{ currentGen.will.toFixed(2) }}</span>
          </div>
          <div class="bar-wrap">
            <div class="bar-fill bar-cyan" :style="{ width: barWidth(currentGen.will) }" />
          </div>
        </div>

        <div class="pop-indicator pop-indicator__bar">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Cohésion</span>
            <span class="pop-indicator__val">{{ currentGen.cohesion.toFixed(2) }}</span>
          </div>
          <div class="bar-wrap">
            <div class="bar-fill bar-cyan" :style="{ width: barWidth(currentGen.cohesion) }" />
          </div>
        </div>

        <div class="pop-indicator pop-indicator__bar">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Alimentation</span>
            <span class="pop-indicator__val">{{ currentGen.food.toFixed(2) }}</span>
          </div>
          <div class="bar-wrap">
            <div class="bar-fill bar-cyan" :style="{ width: barWidth(currentGen.food) }" />
          </div>
        </div>

        <div class="pop-indicator pop-indicator__bar">
          <div class="pop-indicator__row">
            <span class="pop-indicator__label">Soins</span>
            <span class="pop-indicator__val">{{ currentGen.care.toFixed(2) }}</span>
          </div>
          <div class="bar-wrap">
            <div class="bar-fill bar-cyan" :style="{ width: barWidth(currentGen.care) }" />
          </div>
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
