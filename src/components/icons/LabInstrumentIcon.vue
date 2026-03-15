<script setup>
import { computed } from 'vue'

/**
 * Icônes pour les instruments du Laboratoire — style minimaliste sci‑fi
 */
const props = defineProps({
  instrumentId: { type: String, required: true },
  size: { type: Number, default: 32 },
})

const ICONS = {
  'analyseur-spectral': 'waveform',
  'analyseur-structure-temporelle': 'pulse',
  'analyseur-polarisation': 'ellipse',
  'analyseur-spectre-energetique': 'energy',
  'analyseur-gravimetrique': 'gravity',
  'spectro-stellaire': 'star',
  'analyseur-orbital': 'orbit',
  'spectro-atmo': 'atmo',
  'analyseur-vol': 'cube',
  'scanner-morpho': 'scan',
  'magnetometre': 'magnet',
  'spectro-contact': 'contact',
  'analyseur-echantillon': 'flask',
}

const icon = computed(() => ICONS[props.instrumentId] ?? 'default')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="lab-instrument-icon"
  >
    <!-- waveform : ondes -->
    <template v-if="icon === 'waveform'">
      <path d="M3 12h2v2H3zM7 8h2v8H7zM11 6h2v12h-2zM15 10h2v4h-2zM19 12h2v2h-2z" />
    </template>
    <!-- pulse : pulsations -->
    <template v-else-if="icon === 'pulse'">
      <path d="M4 12h3l2-4 2 8 2-4h3" />
    </template>
    <!-- ellipse : polarisation -->
    <template v-else-if="icon === 'ellipse'">
      <ellipse cx="12" cy="12" rx="8" ry="4" />
    </template>
    <!-- energy : radiation -->
    <template v-else-if="icon === 'energy'">
      <path d="M12 2L9 10h6l-3 8 6-6H9l3-8z" />
    </template>
    <!-- gravity -->
    <template v-else-if="icon === 'gravity'">
      <circle cx="12" cy="8" r="2" />
      <path d="M12 10v4M10 14l2 2 2-2" />
    </template>
    <!-- star -->
    <template v-else-if="icon === 'star'">
      <path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
    </template>
    <!-- orbit -->
    <template v-else-if="icon === 'orbit'">
      <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)" />
      <circle cx="12" cy="8" r="1.5" />
    </template>
    <!-- atmo : nuage -->
    <template v-else-if="icon === 'atmo'">
      <path d="M6 14a4 4 0 0 1 4-4 4 4 0 0 1 4 4M4 17h16" />
    </template>
    <!-- cube -->
    <template v-else-if="icon === 'cube'">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </template>
    <!-- scan : grille -->
    <template v-else-if="icon === 'scan'">
      <path d="M3 6h18M3 12h18M3 18h18M6 3v18M12 3v18M18 3v18" />
    </template>
    <!-- magnet -->
    <template v-else-if="icon === 'magnet'">
      <path d="M6 2v6a4 4 0 0 0 8 0V2M6 22V16a4 4 0 0 1 8 0v6" />
    </template>
    <!-- contact : main -->
    <template v-else-if="icon === 'contact'">
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      <path d="M12 14c-4 0-7 2-7 5v3h14v-3c0-3-3-5-7-5z" />
    </template>
    <!-- flask -->
    <template v-else-if="icon === 'flask'">
      <path d="M9 2v4M15 2v4M9 6h6M8 6v12a4 4 0 0 0 8 0V6" />
    </template>
    <!-- default -->
    <template v-else>
      <circle cx="12" cy="12" r="4" />
    </template>
  </svg>
</template>
