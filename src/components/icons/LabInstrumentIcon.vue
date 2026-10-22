<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

/**
 * Icônes pour les instruments du Laboratoire — jeu commun (iconSet.js)
 */
const props = defineProps({
  instrumentId: { type: String, required: true },
  size: { type: Number, default: 32 },
})

const ICONS = {
  'analyseur-spectral': 'spectrum',
  'analyseur-structure-temporelle': 'pulse',
  'analyseur-polarisation': 'polarization',
  'analyseur-spectre-energetique': 'energy',
  'analyseur-gravimetrique': 'gravity',
  'spectro-stellaire': 'star',
  'analyseur-orbital': 'orbit',
  'spectro-atmo': 'atmosphere',
  'analyseur-vol': 'volume',
  'scanner-morpho': 'grid-scan',
  'magnetometre': 'magnet',
  'spectro-contact': 'probe',
  'analyseur-echantillon': 'test-tube',
}

const icon = computed(() => ICONS[props.instrumentId] ?? 'dot-outline')
</script>

<template>
  <AppIcon :name="icon" :size="size" class="lab-instrument-icon" />
</template>
