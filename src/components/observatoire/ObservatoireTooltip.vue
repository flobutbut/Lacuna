<script setup>
import { computed } from 'vue'
import SignalTypeIcon from '@/components/icons/SignalTypeIcon.vue'

const props = defineProps({
  /** Visible ou non */
  visible: { type: Boolean, default: true },
  /** Position { x, y } en px (viewport) */
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  /** Titre principal */
  title: { type: String, default: '' },
  /** Lignes { key, value, icon?, structure? } — icon: 'signal' pour SignalTypeIcon */
  rows: { type: Array, default: () => [] },
  /** Texte de statut optionnel (style amber) */
  status: { type: String, default: '' },
  /** Label d'action en bas */
  actionLabel: { type: String, default: '[ CLIC POUR OBSERVER ]' },
  /** Offset depuis le curseur { x, y } */
  offset: { type: Object, default: () => ({ x: 18, y: -60 }) },
})

const tooltipStyle = computed(() => {
  const { x, y } = props.position
  const { x: ox, y: oy } = props.offset
  const tx = x + ox > window.innerWidth - 200 ? x - 190 : x + ox
  return {
    left: `${tx}px`,
    top: `${y + oy}px`,
  }
})

const showStatus = computed(() => props.status && props.status !== '—')
</script>

<template>
  <div
    v-if="visible"
    class="observatoire-tooltip"
    :style="tooltipStyle"
  >
    <div class="observatoire-tooltip__inner">
      <div v-if="title" class="observatoire-tooltip__name">{{ title }}</div>
      <div
        v-for="(row, i) in rows"
        :key="i"
        class="observatoire-tooltip__row"
        :class="{ 'observatoire-tooltip__row--with-icon': row.icon === 'signal' }"
      >
        <span class="observatoire-tooltip__key">{{ row.key }}</span>
        <span class="observatoire-tooltip__val sw-val">
          <SignalTypeIcon
            v-if="row.icon === 'signal'"
            :structure="row.structure ?? row.value"
            :size="12"
          />
          {{ row.value }}
        </span>
      </div>
      <div v-if="showStatus" class="observatoire-tooltip__status">{{ status }}</div>
      <div v-if="actionLabel" class="observatoire-tooltip__action">{{ actionLabel }}</div>
    </div>
  </div>
</template>

<style scoped>
.observatoire-tooltip {
  position: fixed;
  z-index: var(--z-tooltip);
  pointer-events: none;
  transition: opacity var(--transition-base);
}

.observatoire-tooltip__inner {
  background: var(--color-panel);
  border: var(--border-width) solid var(--border-bright);
  padding: var(--space-5) var(--space-7);
  min-width: 160px;
}

.observatoire-tooltip__name {
  font-size: var(--text-lg);
  color: var(--color-white);
  letter-spacing: var(--tracking-normal);
  margin-bottom: var(--space-3);
}

.observatoire-tooltip__row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: var(--space-1);
}

.observatoire-tooltip__row--with-icon {
  align-items: center;
}

.observatoire-tooltip__key {
  font-size: var(--text-md);
  color: var(--color-muted);
}

.observatoire-tooltip__val {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.observatoire-tooltip__status {
  margin-top: var(--space-4);
  padding-top: var(--space-3);
  border-top: var(--border-width) solid var(--border-default);
  font-size: var(--text-md);
  color: var(--color-amber);
  letter-spacing: var(--tracking-tight);
}

.observatoire-tooltip__action {
  margin-top: var(--space-3);
  font-size: var(--text-md);
  color: var(--color-cyan-muted);
  letter-spacing: var(--tracking-tight);
  text-align: right;
}
</style>
