<script setup>
import { useUIStore } from '@/stores/ui'
import ProgressBar from '@/components/ProgressBar.vue'

const ui = useUIStore()
</script>

<template>
  <div class="side-right">
    <div class="side-widget">
      <div class="sw-title">Population</div>
      <div class="sw-row">
        <div class="sw-key">Effectif</div>
        <div class="sw-val">10 247</div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Natalité</div>
        <div class="sw-val ok">+1.2%</div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Volonté</div>
        <div class="sw-val ok">HAUTE</div>
      </div>
      <ProgressBar :value="82" color="green" pct />
      <div class="sw-row">
        <div class="sw-key">Âge moyen</div>
        <div class="sw-val">34.2 ans</div>
      </div>
    </div>

    <div v-if="ui.observatoireViewMode === 'sky'" class="side-widget">
      <div class="sw-title">Dernière trace</div>
      <div class="sw-row">
        <div class="sw-key">Désignation</div>
        <div class="sw-val warn">WOW-1977-A</div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Type</div>
        <div class="sw-val">Signal radio</div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Interprétations</div>
        <div class="sw-val">847</div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Statut</div>
        <div class="sw-val warn">NON RÉSOLU</div>
      </div>
    </div>
  </div>
</template>
