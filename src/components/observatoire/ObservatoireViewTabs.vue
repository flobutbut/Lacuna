<script setup>
import { useUIStore } from '@/stores/ui'
import ObservatoireSpectralFilters from '@/components/observatoire/ObservatoireSpectralFilters.vue'
import ObservatoireRadarFilters from '@/components/observatoire/ObservatoireRadarFilters.vue'

const ui = useUIStore()

const TABS = [
  { id: 'sky', label: 'Ciel profond' },
  { id: 'radar', label: 'Radar' },
  { id: 'system', label: 'Système' },
]
</script>

<template>
  <div
    class="observatoire-tabs"
    :class="{ 'observatoire-tabs--full-width': ui.observatoireViewMode === 'system' || ui.observatoireViewMode === 'radar' || (ui.observatoireViewMode === 'sky' && !ui.observatoireTilesVisible) }"
  >
    <div
      class="observatoire-tabs__buttons"
      :class="{ 'observatoire-tabs__buttons--over-star': ui.observatoireViewMode === 'system' || ui.observatoireViewMode === 'radar' }"
    >
      <button
        v-for="t in TABS"
        :key="t.id"
        type="button"
        class="btn btn-secondary"
        :class="{ 'is-active': ui.observatoireViewMode === t.id }"
        @click="ui.setObservatoireViewMode(t.id)"
      >
        {{ t.label }}
      </button>
    </div>
    <div
      v-if="ui.observatoireViewMode === 'radar' && ui.radarPaused"
      class="observatoire-tabs__center"
    >
      <button
        type="button"
        class="btn btn-secondary"
        :class="{ 'is-active': ui.radarSelectionMode === 'zone' }"
        title="Sélectionner une zone (spectrogramme)"
        @click="ui.setRadarSelectionMode(ui.radarSelectionMode === 'zone' ? null : 'zone')"
      >
        Zone
      </button>
      <button
        type="button"
        class="btn btn-secondary"
        :class="{ 'is-active': ui.radarSelectionMode === 'period' }"
        title="Sélectionner une période (les deux graphiques)"
        @click="ui.setRadarSelectionMode(ui.radarSelectionMode === 'period' ? null : 'period')"
      >
        Période
      </button>
    </div>
    <ObservatoireSpectralFilters v-if="ui.observatoireViewMode === 'sky'" class="observatoire-tabs__filters" />
    <ObservatoireRadarFilters v-else-if="ui.observatoireViewMode === 'radar'" class="observatoire-tabs__filters" />
  </div>
</template>

<style scoped>
.observatoire-tabs {
  position: absolute;
  top: var(--sidebar-offset);
  /* Réserve la place des panneaux latéraux (SideLeft / SideRight) */
  left: calc(var(--sidebar-offset) + var(--sidebar-width));
  right: calc(var(--sidebar-offset) + var(--sidebar-width));
  padding-left: var(--space-6);
  padding-right: var(--space-6);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  z-index: 20;
  pointer-events: auto;
  transition: left var(--transition-base), right var(--transition-base);
}

.observatoire-tabs--full-width {
  left: var(--sidebar-offset);
  right: var(--sidebar-offset);
}

.observatoire-tabs__buttons {
  display: flex;
  gap: 0;
}

.observatoire-tabs__buttons .btn {
  border-left: none;
}
.observatoire-tabs__buttons .btn:first-child {
  border-left: var(--border-width) solid var(--border-default);
  border-top-left-radius: var(--border-radius-sm);
  border-bottom-left-radius: var(--border-radius-sm);
}
.observatoire-tabs__buttons .btn:last-child {
  border-top-right-radius: var(--border-radius-sm);
  border-bottom-right-radius: var(--border-radius-sm);
}

.observatoire-tabs__buttons--over-star .btn {
  background: var(--color-panel);
}
.observatoire-tabs__buttons--over-star .btn:hover {
  background: var(--color-panel);
}
.observatoire-tabs__buttons--over-star .btn.is-active {
  background: var(--color-panel-solid);
}

.observatoire-tabs__center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
}
.observatoire-tabs__filters {
  flex-shrink: 0;
}
</style>
