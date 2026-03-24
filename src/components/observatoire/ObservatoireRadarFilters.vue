<script setup>
/**
 * Filtres barre Radar — sélecteur de bande de fréquences, pause, record
 */
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import AppSelect from '@/components/AppSelect.vue'

const ui = useUIStore()
const { radarFrequencyBand, radarPaused, radarRecording } = storeToRefs(ui)

const BANDS = [
  { value: 'P', label: 'P — 150–400 MHz' },
  { value: 'L', label: 'L — 1000–1800 MHz' },
  { value: 'X', label: 'X — 2–10 GHz' },
  { value: 'G', label: 'γ — > 10 keV' },
]
</script>

<template>
  <div class="radar-filters">
    <button
      type="button"
      class="btn btn-secondary"
      :class="{ 'is-active': radarPaused }"
      :title="radarPaused ? 'Reprendre' : 'Pause'"
      aria-label="Pause"
      @click="ui.toggleRadarPaused"
    >
      {{ radarPaused ? '▶' : '⏸' }}
    </button>
    <button
      type="button"
      class="btn btn-secondary radar-filters__btn--record"
      :class="{ 'radar-filters__btn--rec': radarRecording }"
      :title="'Enregistrement (bientôt)'"
      aria-label="Enregistrer"
      disabled
    >
      {{ radarRecording ? '⏹' : '⏺' }}
    </button>
    <AppSelect
      :model-value="radarFrequencyBand"
      :options="BANDS"
      value-key="value"
      label-key="label"
      class="radar-filters__select"
      @update:model-value="ui.setRadarFrequencyBand"
    />
  </div>
</template>

<style scoped>
.radar-filters {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.radar-filters__select {
  min-width: 140px;
}
.radar-filters__btn--record {
  opacity: 0.5;
}
.radar-filters__btn--record:disabled {
  cursor: not-allowed;
}
.radar-filters__btn--rec {
  color: var(--color-red);
  border-color: var(--color-red);
}
.radar-filters__btn--rec:hover {
  color: var(--color-red);
  border-color: var(--color-red);
}
</style>
