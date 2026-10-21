<script setup>
import { computed, onMounted } from 'vue'
import { useObservatoireStore } from '@/stores/observatoire'
import { useShipStore } from '@/stores/ship'
import ProgressBar from '@/components/ProgressBar.vue'
import { valClass } from '@/lib/formatUtils'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

const observatoireStore = useObservatoireStore()
const shipStore = useShipStore()

const propulsion = computed(() => (shipStore.systems?.propulsion ?? 0.88) * 100)
const he3 = computed(() => (shipStore.fuel?.he3 ?? 0.742) * 100)
const hull = computed(() => (shipStore.systems?.hull ?? 0.971) * 100)
const plasmaShield = computed(() => (shipStore.systems?.plasma_shield ?? 1) * 100)

onMounted(() => ensureStoresLoaded(shipStore))
</script>

<template>
  <div class="side-right">
    <div class="side-widget">
      <div class="sw-title">Systèmes vaisseau</div>
      <div class="sw-row">
        <div class="sw-key">Propulsion</div>
        <div class="sw-val" :class="valClass(propulsion/100)">{{ propulsion >= 80 ? 'NOMINAL' : (propulsion.toFixed(1) + '%') }}</div>
      </div>
      <ProgressBar :value="propulsion" pct />
      <div class="sw-row">
        <div class="sw-key">Carburant He³</div>
        <div class="sw-val" :class="valClass(he3/100)">{{ he3.toFixed(1) }}%</div>
      </div>
      <ProgressBar :value="he3" pct />
      <div class="sw-row">
        <div class="sw-key">Intégrité coque</div>
        <div class="sw-val" :class="valClass(hull/100)">{{ hull.toFixed(1) }}%</div>
      </div>
      <ProgressBar :value="hull" pct />
      <div class="sw-row">
        <div class="sw-key">Bouclier plasma</div>
        <div class="sw-val" :class="valClass(plasmaShield/100)">{{ plasmaShield >= 80 ? 'ACTIF' : (plasmaShield.toFixed(1) + '%') }}</div>
      </div>
      <ProgressBar :value="plasmaShield" color="cyan" pct />
    </div>

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

    <div v-if="observatoireStore.observatoireViewMode === 'sky'" class="side-widget">
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
