<script setup>
import { useUIStore } from '@/stores/ui'
import ObservatoireSpectralFilters from '@/components/ObservatoireSpectralFilters.vue'

const ui = useUIStore()

const TABS = [
  { id: 'sky', label: 'Ciel profond' },
  { id: 'system', label: 'Système' },
]
</script>

<template>
  <div
    class="observatoire-tabs"
    :class="{ 'observatoire-tabs--full-width': ui.observatoireViewMode === 'system' || (ui.observatoireViewMode === 'sky' && !ui.observatoireTilesVisible) }"
  >
    <div
      class="observatoire-tabs__buttons"
      :class="{ 'observatoire-tabs__buttons--over-star': ui.observatoireViewMode === 'system' }"
    >
      <button
        v-for="t in TABS"
        :key="t.id"
        type="button"
        class="observatoire-tabs__btn"
        :class="{ 'observatoire-tabs__btn--active': ui.observatoireViewMode === t.id }"
        @click="ui.setObservatoireViewMode(t.id)"
      >
        {{ t.label }}
      </button>
    </div>
    <ObservatoireSpectralFilters v-if="ui.observatoireViewMode === 'sky'" class="observatoire-tabs__filters" />
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

.observatoire-tabs__buttons--over-star .observatoire-tabs__btn {
  background: var(--color-panel);
}
.observatoire-tabs__buttons--over-star .observatoire-tabs__btn:hover {
  background: var(--color-panel);
}
.observatoire-tabs__buttons--over-star .observatoire-tabs__btn--active {
  background: var(--color-panel-solid);
}
.observatoire-tabs__filters {
  flex-shrink: 0;
}
.observatoire-tabs__btn {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-sm);
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-normal);
  text-transform: uppercase;
  color: var(--color-muted);
  background: transparent;
  border: var(--border-width) solid var(--border-default);
  border-left: none;
  cursor: pointer;
  transition: all var(--transition-base);
}
.observatoire-tabs__btn:first-child {
  border-left: var(--border-width) solid var(--border-default);
  border-top-left-radius: var(--border-radius-sm);
  border-bottom-left-radius: var(--border-radius-sm);
}
.observatoire-tabs__btn:last-child {
  border-top-right-radius: var(--border-radius-sm);
  border-bottom-right-radius: var(--border-radius-sm);
}
.observatoire-tabs__btn:hover {
  color: var(--color-white);
  border-color: var(--border-bright);
  background: var(--color-cyan-subtle);
}
.observatoire-tabs__btn--active {
  color: var(--color-cyan);
  border-color: var(--color-cyan-dim);
  background: var(--color-cyan-hover);
}
</style>
