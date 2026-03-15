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
  <div class="observatoire-tabs">
    <div class="observatoire-tabs__row">
      <div class="observatoire-tabs__buttons">
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
    </div>
    <ObservatoireSpectralFilters v-if="ui.observatoireViewMode === 'sky'" />
  </div>
</template>

<style scoped>
.observatoire-tabs {
  position: absolute;
  top: var(--sidebar-offset);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  z-index: 20;
  pointer-events: auto;
}
.observatoire-tabs__row {
  display: flex;
  align-items: center;
}
.observatoire-tabs__buttons {
  display: flex;
  gap: 0;
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
