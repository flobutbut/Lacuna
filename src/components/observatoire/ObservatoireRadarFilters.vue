<script setup>
/**
 * Filtres barre Radar — pause, bande, échelle temps, INT., fréq.
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/ui'
import AppSelect from '@/components/AppSelect.vue'
import AppDualRangeSlider from '@/components/AppDualRangeSlider.vue'
import RadarNoiseIcon from '@/components/icons/RadarNoiseIcon.vue'

const ui = useUIStore()
const {
  radarFrequencyBand,
  radarPaused,
  radarTimeScale,
  radarIntensityThreshold,
  radarFreqLow,
  radarFreqHigh,
  radarNoiseEnabled,
} = storeToRefs(ui)

const BANDS = [
  { value: 'P', label: 'P — 150–400 MHz' },
  { value: 'L', label: 'L — 1000–1800 MHz' },
  { value: 'X', label: 'X — 2–10 GHz' },
  { value: 'G', label: 'γ — > 10 keV' },
]

const TIME_SCALES = [
  { value: 10, label: '10 ms' },
  { value: 100, label: '100 ms' },
  { value: 1000, label: '1 s' },
  { value: 10000, label: '10 s' },
]

const sliderDisplayValue = computed(() => {
  const t = radarIntensityThreshold.value
  if (t <= 0) return 0
  if (t <= 0.001) return 1
  return Math.round((Math.log10(t) + 3) / 3 * 100)
})

function onThresholdInput(sliderVal) {
  const s = Number(sliderVal)
  // s=0   → 0 (rien filtré)
  // s=1   → 0.001
  // s=50  → 0.032
  // s=100 → 1.0
  const threshold = s === 0
    ? 0
    : Math.pow(10, (s / 100) * 3 - 3)
  ui.setRadarIntensityThreshold(threshold)
}
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
    <AppSelect
      :model-value="radarFrequencyBand"
      :options="BANDS"
      value-key="value"
      label-key="label"
      class="radar-filters__select"
      :disabled="radarPaused"
      :title="radarPaused ? 'Relance le radar pour changer la bande' : undefined"
      @update:model-value="ui.setRadarFrequencyBand"
    />
    <AppSelect
      :model-value="radarTimeScale"
      :options="TIME_SCALES"
      value-key="value"
      label-key="label"
      class="radar-filters__select"
      :disabled="radarPaused"
      :title="radarPaused ? 'Relance le radar pour changer l’échelle temps' : undefined"
      @update:model-value="ui.setRadarTimeScale"
    />
    <div class="radar-filters__threshold">
      <span class="radar-filters__threshold-label">INT.</span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        :value="sliderDisplayValue"
        class="radar-filters__slider"
        aria-label="Seuil d'intensité du flux"
        @input="onThresholdInput($event.target.value)"
      />
    </div>
    <div class="radar-filters__threshold">
      <span class="radar-filters__threshold-label">fréq.</span>
      <AppDualRangeSlider
        :low="radarFreqLow"
        :high="radarFreqHigh"
        :min="0"
        :max="125"
        :step="1"
        aria-label-low="Borne basse du filtre fréquentiel (Hz)"
        aria-label-high="Borne haute du filtre fréquentiel (Hz)"
        @update:low="ui.setRadarFreqLow"
        @update:high="ui.setRadarFreqHigh"
      />
    </div>
    <button
      type="button"
      class="btn btn-secondary radar-filters__btn--noise"
      :class="{ 'is-active': radarNoiseEnabled !== false }"
      :title="radarNoiseEnabled === false ? 'Activer le bruit de fond' : 'Couper le bruit de fond'"
      :aria-pressed="radarNoiseEnabled !== false"
      aria-label="Bruit de fond du spectrogramme"
      @click="ui.toggleRadarNoise"
    >
      <RadarNoiseIcon :off="radarNoiseEnabled === false" />
    </button>
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
.radar-filters__btn--noise {
  min-width: 2.25rem;
  padding-left: var(--space-4);
  padding-right: var(--space-4);
  line-height: 0;
}
.radar-filters__btn--noise :deep(.radar-noise-icon) {
  display: block;
}

/* Aligné sur .ds-select (select.css) : même cadre, typo et hover que les AppSelect */
.radar-filters__threshold {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  overflow: visible;
  /* Même padding vertical que .ds-select (select.css) — line-height serré pour ne pas dépasser */
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-normal);
  line-height: 1;
  text-transform: uppercase;
  color: var(--color-muted);
  background: var(--color-panel);
  border: var(--border-width) solid var(--border-default);
  border-radius: var(--border-radius-sm);
  transition:
    color var(--transition-base),
    border-color var(--transition-base),
    background-color var(--transition-base);
}
.radar-filters__threshold:hover {
  color: var(--color-white);
  border-color: var(--border-bright);
  background-color: var(--color-cyan-glow);
}
.radar-filters__threshold:focus-within {
  border-color: var(--color-cyan-dim);
  color: var(--color-cyan);
}
.radar-filters__threshold-label {
  flex-shrink: 0;
  white-space: nowrap;
  line-height: 1;
}

/* Range custom : évite le thumb bleu système et garde une hauteur de ligne proche du .ds-select */
.radar-filters__slider {
  -webkit-appearance: none;
  appearance: none;
  width: 92px;
  min-width: 72px;
  height: 4px;
  margin: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  vertical-align: middle;
}

.radar-filters__slider:focus {
  outline: none;
}

/* WebKit */
.radar-filters__slider::-webkit-slider-runnable-track {
  height: 4px;
  background: var(--border-default);
  border-radius: 2px;
}
.radar-filters__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  margin-top: -3px;
  border-radius: 50%;
  background: var(--color-muted);
  border: 1px solid var(--border-bright);
  box-sizing: border-box;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}
.radar-filters__threshold:hover .radar-filters__slider::-webkit-slider-thumb,
.radar-filters__threshold:hover :deep(.dual-range__input::-webkit-slider-thumb) {
  background: var(--color-white);
  border-color: var(--border-bright);
}
.radar-filters__threshold:focus-within .radar-filters__slider::-webkit-slider-thumb,
.radar-filters__threshold:focus-within :deep(.dual-range__input::-webkit-slider-thumb) {
  background: var(--color-cyan);
  border-color: var(--color-cyan-dim);
}
.radar-filters__slider:focus-visible::-webkit-slider-thumb,
.radar-filters__threshold :deep(.dual-range__input:focus-visible::-webkit-slider-thumb) {
  box-shadow: 0 0 0 2px var(--color-cyan-glow);
}

/* Firefox */
.radar-filters__slider::-moz-range-track {
  height: 4px;
  background: var(--border-default);
  border-radius: 2px;
}
.radar-filters__slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-muted);
  border: 1px solid var(--border-bright);
  box-sizing: border-box;
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    box-shadow var(--transition-base);
}
.radar-filters__threshold:hover .radar-filters__slider::-moz-range-thumb,
.radar-filters__threshold:hover :deep(.dual-range__input::-moz-range-thumb) {
  background: var(--color-white);
  border-color: var(--border-bright);
}
.radar-filters__threshold:focus-within .radar-filters__slider::-moz-range-thumb,
.radar-filters__threshold:focus-within :deep(.dual-range__input::-moz-range-thumb) {
  background: var(--color-cyan);
  border-color: var(--color-cyan-dim);
}
.radar-filters__slider:focus-visible::-moz-range-thumb,
.radar-filters__threshold :deep(.dual-range__input:focus-visible::-moz-range-thumb) {
  box-shadow: 0 0 0 2px var(--color-cyan-glow);
}
</style>
