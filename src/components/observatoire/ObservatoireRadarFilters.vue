<script setup>
/**
 * Barre Radar, ancrée à droite comme celle du Ciel profond, de gauche à droite :
 * - sélection (radar en pause) : zone, période ;
 * - réglages : bande, échelle temps, seuil d'intensité, plage de fréquences ;
 * - actions : filtre de bruit, pause ;
 * - alimentation : marche / arrêt, tout à droite.
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRadarStore } from '@/stores/radar'
import AppSelect from '@/components/AppSelect.vue'
import AppSwitch from '@/components/AppSwitch.vue'
import AppDualRangeSlider from '@/components/AppDualRangeSlider.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const radarStore = useRadarStore()
const {
  radarFrequencyBand,
  radarPaused,
  radarTimeScale,
  radarIntensityThreshold,
  radarFreqLow,
  radarFreqHigh,
  radarNoiseEnabled,
  radarEnabled,
  radarSelectionMode,
} = storeToRefs(radarStore)

/** Filtre de bruit actif = bruit de fond retiré du spectrogramme */
const noiseFiltered = computed(() => radarNoiseEnabled.value === false)

function toggleSelectionMode(mode) {
  radarStore.setRadarSelectionMode(radarSelectionMode.value === mode ? null : mode)
}

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

// Seuil linéaire sur l'échelle dB affichée : 0 = tout visible, 100 = seulement le maximum de la fenêtre
const sliderDisplayValue = computed(() => Math.round(radarIntensityThreshold.value * 100))

function onThresholdInput(sliderVal) {
  radarStore.setRadarIntensityThreshold(Number(sliderVal) / 100)
}
</script>

<template>
  <div class="radar-filters">
    <!-- Sélection : seulement radar en pause ; à gauche, la barre étant ancrée à droite, rien ne se décale -->
    <div v-if="radarPaused" class="radar-filters__group" role="group" aria-label="Sélection">
      <button
        type="button"
        class="btn btn-secondary"
        :class="{ 'is-active': radarSelectionMode === 'zone' }"
        title="Sélectionner une zone (spectrogramme)"
        @click="toggleSelectionMode('zone')"
      >
        Zone
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        :class="{ 'is-active': radarSelectionMode === 'period' }"
        title="Sélectionner une période (les deux graphiques)"
        @click="toggleSelectionMode('period')"
      >
        Période
      </button>
    </div>

    <div class="radar-filters__group" role="group" aria-label="Réglages">
      <AppSelect
        :model-value="radarFrequencyBand"
        :options="BANDS"
        value-key="value"
        label-key="label"
        class="radar-filters__select"
        :disabled="radarPaused"
        :title="radarPaused ? 'Relance le radar pour changer la bande' : undefined"
        @update:model-value="radarStore.setRadarFrequencyBand"
      />
      <AppSelect
        :model-value="radarTimeScale"
        :options="TIME_SCALES"
        value-key="value"
        label-key="label"
        class="radar-filters__select radar-filters__select--short"
        :disabled="radarPaused"
        :title="radarPaused ? 'Relance le radar pour changer l’échelle temps' : undefined"
        @update:model-value="radarStore.setRadarTimeScale"
      />
      <div class="radar-filters__threshold">
        <span class="radar-filters__threshold-label">Intensité</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          :value="sliderDisplayValue"
          class="radar-filters__slider"
          aria-label="Seuil d'intensité affichée"
          @input="onThresholdInput($event.target.value)"
        />
      </div>
      <div class="radar-filters__threshold">
        <span class="radar-filters__threshold-label">Fréq.</span>
        <AppDualRangeSlider
          :low="radarFreqLow"
          :high="radarFreqHigh"
          :min="0"
          :max="125"
          :step="1"
          aria-label-low="Borne basse du filtre fréquentiel (Hz)"
          aria-label-high="Borne haute du filtre fréquentiel (Hz)"
          @update:low="radarStore.setRadarFreqLow"
          @update:high="radarStore.setRadarFreqHigh"
        />
      </div>
    </div>

    <div class="radar-filters__group" role="group" aria-label="Actions">
      <button
        type="button"
        class="btn btn-secondary btn--icon"
        :class="{ 'is-active': noiseFiltered }"
        :title="noiseFiltered ? 'Afficher le bruit de fond' : 'Filtrer le bruit de fond'"
        :aria-pressed="noiseFiltered"
        aria-label="Filtre de bruit de fond"
        @click="radarStore.toggleRadarNoise"
      >
        <AppIcon name="noise-filter" />
      </button>
      <button
        type="button"
        class="btn btn-secondary btn--icon"
        :class="{ 'is-active': radarPaused }"
        :title="radarPaused ? 'Reprendre' : 'Pause'"
        :aria-label="radarPaused ? 'Reprendre' : 'Pause'"
        @click="radarStore.toggleRadarPaused"
      >
        <AppIcon :name="radarPaused ? 'play' : 'pause'" />
      </button>
    </div>

    <div class="radar-filters__group" role="group" aria-label="Alimentation">
      <AppSwitch
        v-model="radarEnabled"
        label="Radar"
        :title="radarEnabled ? 'Couper le radar' : 'Allumer le radar'"
      />
    </div>
  </div>
</template>

<style scoped>
.radar-filters {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

/* Groupes séparés par un filet vertical */
.radar-filters__group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.radar-filters__group + .radar-filters__group {
  padding-left: var(--space-6);
  border-left: var(--border-width) solid var(--border-default);
}

.radar-filters__select {
  min-width: 140px;
}
.radar-filters__select--short {
  min-width: 90px;
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
  line-height: var(--leading-none);
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
  line-height: var(--leading-none);
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
  border-radius: var(--border-radius-sm);
}
.radar-filters__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  margin-top: -3px;
  border-radius: var(--border-radius-full);
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
  border-radius: var(--border-radius-sm);
}
.radar-filters__slider::-moz-range-thumb {
  width: 10px;
  height: 10px;
  border-radius: var(--border-radius-full);
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
