<script setup>
import { useObservatoireStore } from '@/stores/observatoire'
import ObservatoireSpectralFilters from '@/components/observatoire/ObservatoireSpectralFilters.vue'
import ObservatoireRadarFilters from '@/components/observatoire/ObservatoireRadarFilters.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const observatoireStore = useObservatoireStore()

const TABS = [
  { id: 'sky', label: 'Ciel profond' },
  { id: 'radar', label: 'Radar' },
  { id: 'system', label: 'Système' },
]
</script>

<template>
  <div class="observatoire-tabs">
    <div class="observatoire-tabs__left">
      <div
        class="observatoire-tabs__buttons"
        :class="{ 'observatoire-tabs__buttons--over-star': observatoireStore.observatoireViewMode === 'system' || observatoireStore.observatoireViewMode === 'radar' }"
      >
        <button
          v-for="t in TABS"
          :key="t.id"
          type="button"
          class="btn btn-secondary"
          :class="{ 'is-active': observatoireStore.observatoireViewMode === t.id }"
          @click="observatoireStore.setObservatoireViewMode(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
      <button
        v-if="observatoireStore.observatoireViewMode === 'sky'"
        type="button"
        class="btn btn-secondary btn--icon"
        :class="{ 'is-active': observatoireStore.observatoireTilesVisible }"
        :title="observatoireStore.observatoireTilesVisible ? 'Masquer les panneaux (@)' : 'Afficher les panneaux (@)'"
        :aria-pressed="observatoireStore.observatoireTilesVisible"
        aria-label="Panneaux latéraux"
        @click="observatoireStore.toggleObservatoireTiles"
      >
        <AppIcon name="panels" />
      </button>
    </div>
    <ObservatoireSpectralFilters v-if="observatoireStore.observatoireViewMode === 'sky'" class="observatoire-tabs__filters" />
    <ObservatoireRadarFilters v-else-if="observatoireStore.observatoireViewMode === 'radar'" class="observatoire-tabs__filters" />
  </div>
</template>

<style scoped>
.observatoire-tabs {
  position: absolute;
  /* Même place dans les trois vues ; les panneaux latéraux commencent en dessous */
  top: var(--sidebar-offset);
  left: var(--sidebar-offset);
  right: var(--sidebar-offset);
  height: var(--toolbar-height);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  z-index: 20;
  pointer-events: auto;
}

.observatoire-tabs__left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* Tous les contrôles de la barre (onglets, boutons, selects, curseurs) à la même hauteur */
.observatoire-tabs :deep(.btn),
.observatoire-tabs :deep(.ds-select),
.observatoire-tabs :deep(.radar-filters__threshold) {
  height: var(--toolbar-height);
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

.observatoire-tabs__filters {
  flex-shrink: 0;
}
</style>
