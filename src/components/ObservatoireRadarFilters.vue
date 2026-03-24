<script setup>
/**
 * Filtres barre Radar — sélecteur de bande de fréquences, pause, record
 */
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import AppSelect from '@/components/AppSelect.vue'

const ui = useUIStore()
const { radarFrequencyBand, radarPaused, radarRecording } = storeToRefs(ui)

const FREQUENCY_BANDS = [
  { id: '408', label: '408 MHz' },
  { id: '1420', label: '1420 MHz' },
  { id: '1420.4', label: '1420.4 MHz (HI)' },
  { id: '1665', label: '1665 MHz (OH)' },
  { id: '50', label: '50 MHz' },
  { id: '100', label: '100 MHz' },
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
      :options="FREQUENCY_BANDS"
      value-key="id"
      label-key="label"
      aria-label="Bande de fréquences"
      title="Bande de fréquences radar"
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
