<script setup>
import { useUIStore } from '@/stores/ui'
import ProgressBar from '@/components/ProgressBar.vue'

const ui = useUIStore()

const terms = [
  { symbol: 'R*', label: 'Taux de formation stellaire', val: '3.0 /an', width: 100 },
  { symbol: 'fp', label: 'Fraction étoiles avec planètes', val: '1.00', width: 100 },
  { symbol: 'ne', label: 'Planètes en zone habitable', val: '0.40', width: 40 },
  { symbol: 'fl', label: 'Apparition de la vie', val: '0.31 ↑', width: 31, amber: true },
  { symbol: 'fi', label: 'Vie intelligente', val: '0.10', width: 10 },
  { symbol: 'fc', label: 'Technologie détectable', val: '0.20', width: 20 },
  { symbol: 'L', label: 'Durée de communication', val: '10 000 ans', width: 60, noBorder: true },
]
</script>

<template>
  <div
    class="panel-overlay panel-overlay--center"
    :class="{ open: ui.activePanel === 'drake' }"
  >
    <div class="panel-box panel-box--lg">
      <div class="panel-header">
        <div class="panel-title">Équation de Drake — État Galactique</div>
        <button type="button" class="panel-close btn-close" @click="ui.closePanel('drake')">✕</button>
      </div>
      <div class="panel-body">
        <div
          v-for="t in terms"
          :key="t.symbol"
          class="drake-term"
          :style="t.noBorder ? { border: 'none' } : {}"
        >
          <div class="dt-symbol" :style="t.amber ? { color: 'var(--color-amber)' } : {}">
            {{ t.symbol }}
          </div>
          <div class="dt-label">{{ t.label }}</div>
          <div class="dt-val" :style="t.amber ? { color: 'var(--color-amber)' } : {}">
            {{ t.val }}
          </div>
          <ProgressBar
            :value="t.width"
            :color="t.amber ? 'amber' : 'cyan'"
            pct
            no-margin
            class="dt-bar"
          />
        </div>
        <div class="drake-result">
          <div class="dr-label">N — CIVILISATIONS ACTIVES ESTIMÉES</div>
          <div class="dr-value">12.4</div>
          <div class="dr-sub">mis à jour collectivement — dernière variation il y a 3h</div>
        </div>
      </div>
    </div>
  </div>
</template>
