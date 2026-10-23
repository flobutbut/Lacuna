<script setup>
import '@/assets/components/drake.css'
import { onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useDrakeStore } from '@/stores/drake'
import { useObservationsStore } from '@/stores/observations'
import { useVerdictsStore } from '@/stores/verdicts'
import { formatRelativeTime } from '@/lib/formatUtils'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { DRAKE_REFERENCE, computeShipDrake, computeN, formatTerm, formatN, describeGap } from '@/lib/drake'
import { formatVerdict } from '@/lib/verdicts'

/**
 * Page Drake — N de bord (ce que ce vaisseau croit, d'après ses verdicts) à côté du N collectif
 * (LACUNA_VERDICT.md §7.1, §7.5). Le jeu ne dit pas lequel a raison.
 */
const drakeStore = useDrakeStore()
const obsStore = useObservationsStore()
const verdictsStore = useVerdictsStore()

const TERMS = [
  { key: 'r_star', symbol: 'R*', label: 'Taux de formation stellaire' },
  { key: 'fp', symbol: 'fp', label: 'Fraction des étoiles avec planètes' },
  { key: 'ne', symbol: 'ne', label: 'Planètes en zone habitable' },
  { key: 'fl', symbol: 'fl', label: 'Apparition de la vie', families: 'écarts chimiques' },
  { key: 'fi', symbol: 'fi', label: 'Vie intelligente', families: 'écarts orbitaux, morphologiques, gravitationnels' },
  { key: 'fc', symbol: 'fc', label: 'Technologie détectable', families: 'écarts électromagnétiques, thermiques, temporels' },
  { key: 'l_val', symbol: 'L', label: 'Durée de communication', families: 'absences' },
]

const ship = computed(() => computeShipDrake(verdictsStore.currentVerdicts))

/** Termes collectifs (drake_equation) ; références hors ligne */
const collective = computed(() => {
  const row = drakeStore.row
  if (!row) return { ...DRAKE_REFERENCE }
  return Object.fromEntries(Object.keys(DRAKE_REFERENCE).map((k) => [k, Number(row[k])]))
})
const collectiveN = computed(() => (drakeStore.row ? Number(drakeStore.row.n) : computeN(collective.value)))

const gap = computed(() => describeGap(ship.value.n, collectiveN.value))

const observationsById = computed(() => Object.fromEntries(obsStore.list.map((o) => [o.id, o])))

function observationName(id) {
  return (observationsById.value[id]?.name ?? 'Observation retirée').split('·')[0].trim()
}

function formatContribution(value) {
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}`
}

function direction(key) {
  const diff = ship.value.terms[key] - collective.value[key]
  if (Math.abs(diff) < 1e-9) return ''
  return diff > 0 ? 'drake-row__ship--up' : 'drake-row__ship--down'
}

onMounted(async () => {
  await ensureStoresLoaded(drakeStore, obsStore)
  await Promise.all([
    verdictsStore.fetchForObservations(obsStore.list.map((o) => o.id)),
    drakeStore.fetchHistory(),
  ])
})
</script>

<template>
  <div class="page-full">
    <div class="page-content drake-page">
      <h1 class="page-title">Équation de Drake</h1>

      <div class="drake-compare">
        <div class="drake-compare__cell drake-compare__cell--ship">
          <div class="drake-compare__label">N de bord</div>
          <div class="drake-compare__value">{{ formatN(ship.n) }}</div>
          <div class="drake-compare__sub">ce que votre vaisseau croit, d’après ses verdicts</div>
        </div>
        <div class="drake-compare__cell">
          <div class="drake-compare__label">N collectif</div>
          <div class="drake-compare__value">{{ formatN(collectiveN) }}</div>
          <div class="drake-compare__sub">ce que croient les vaisseaux — recalculé chaque jour</div>
        </div>
      </div>
      <p v-if="gap" class="drake-gap">{{ gap }}</p>

      <div class="drake-table" role="table" aria-label="Termes de l’équation">
        <div class="drake-row drake-row--head" role="row">
          <span role="columnheader" />
          <span role="columnheader" />
          <span role="columnheader">Référence</span>
          <span role="columnheader">Bord</span>
          <span role="columnheader">Collectif</span>
        </div>
        <template v-for="t in TERMS" :key="t.key">
          <div class="drake-row" role="row">
            <span class="drake-row__symbol" role="cell">{{ t.symbol }}</span>
            <span class="drake-row__label" role="cell">
              {{ t.label }}
              <span v-if="t.families" class="drake-row__families">{{ t.families }}</span>
            </span>
            <span class="drake-row__val" role="cell">{{ formatTerm(t.key, DRAKE_REFERENCE[t.key]) }}</span>
            <span class="drake-row__val drake-row__ship" :class="direction(t.key)" role="cell">{{ formatTerm(t.key, ship.terms[t.key]) }}</span>
            <span class="drake-row__val" role="cell">{{ formatTerm(t.key, collective[t.key]) }}</span>
          </div>
          <ul v-if="ship.contributions[t.key]?.length" class="drake-verdicts">
            <li v-for="c in ship.contributions[t.key]" :key="c.verdict.id">
              <RouterLink :to="{ path: '/laboratoire', query: { select: c.verdict.observationId } }" class="drake-verdicts__obs">
                {{ observationName(c.verdict.observationId) }}
              </RouterLink>
              <span class="drake-verdicts__reading">{{ formatVerdict(c.verdict) }} · génération {{ c.verdict.generation }}</span>
              <span class="drake-verdicts__value" :class="c.value > 0 ? 'is-up' : 'is-down'">{{ formatContribution(c.value) }}</span>
            </li>
          </ul>
        </template>
      </div>

      <div v-if="drakeStore.history.length" class="drake-history">
        <div class="drake-history__title">Variations du N collectif</div>
        <ul class="drake-history__list">
          <li v-for="h in drakeStore.history" :key="h.id">
            <span class="sw-key">{{ formatRelativeTime(h.created_at) }}</span>
            <span class="sw-val">N = {{ formatN(h.n) }}</span>
            <span v-if="h.changed_term" class="drake-history__terms">{{ h.changed_term }}</span>
          </li>
        </ul>
      </div>

      <p v-if="!verdictsStore.currentVerdicts.length" class="drake-empty">
        Aucun verdict pour l’instant : le N de bord reste aux valeurs de référence. Rendez un verdict au Laboratoire.
      </p>
    </div>
  </div>
</template>
