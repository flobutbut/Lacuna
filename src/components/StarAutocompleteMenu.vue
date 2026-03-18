<script setup>
import { computed } from 'vue'
import { getStarSvgPath } from '@/assets/illustrations/stars'
import { formatDistanceLy, getStarClassLabel } from '@/lib/starClassification'

const props = defineProps({
  items: { type: Array, default: () => [] },
  activeIndex: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  emptyLabel: { type: String, default: 'Aucun résultat' },
})

const emit = defineEmits(['select', 'hover'])

const hasItems = computed(() => Array.isArray(props.items) && props.items.length > 0)
</script>

<template>
  <div class="star-ac-menu" role="listbox" aria-label="Suggestions">
    <div v-if="loading" class="star-ac-menu__state">Recherche…</div>
    <div v-else-if="!hasItems" class="star-ac-menu__state">{{ emptyLabel }}</div>
    <button
      v-for="(s, idx) in items"
      v-else
      :key="s.id"
      type="button"
      class="star-ac-menu__item"
      :class="{ 'star-ac-menu__item--active': idx === activeIndex }"
      role="option"
      :aria-selected="idx === activeIndex"
      @mouseenter="emit('hover', idx)"
      @click="emit('select', s)"
    >
      <img class="star-ac-menu__icon" :src="getStarSvgPath(s.spectral_type)" alt="" />
      <div class="star-ac-menu__main">
        <div class="star-ac-menu__name">{{ s.name ?? s.id }}</div>
        <div class="star-ac-menu__meta">
          <span class="star-ac-menu__class">{{ getStarClassLabel(s.spectral_type) }}</span>
          <span class="star-ac-menu__sep">·</span>
          <span class="star-ac-menu__dist">{{ formatDistanceLy(s.distance) }}</span>
        </div>
      </div>
    </button>
  </div>
</template>

<style scoped>
.star-ac-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: rgba(3, 6, 13, 0.98);
  border: var(--border-width) solid var(--border-default);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  max-height: 320px;
  overflow: auto;
  z-index: 10;
}

.star-ac-menu__state {
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.star-ac-menu__item {
  width: 100%;
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3) var(--space-4);
  background: transparent;
  border: none;
  border-top: var(--border-width) solid rgba(255, 255, 255, 0.06);
  text-align: left;
  cursor: pointer;
}
.star-ac-menu__item:first-of-type {
  border-top: none;
}
.star-ac-menu__item:hover,
.star-ac-menu__item--active {
  background: var(--color-cyan-subtle);
}

.star-ac-menu__icon {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  opacity: 0.9;
}

.star-ac-menu__name {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-white);
  line-height: 1.1;
}
.star-ac-menu__meta {
  margin-top: 2px;
  font-size: var(--text-xs);
  color: var(--color-muted);
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}
.star-ac-menu__sep {
  opacity: 0.5;
}
</style>

