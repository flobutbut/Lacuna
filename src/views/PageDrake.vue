<script setup>
import { onMounted, computed } from 'vue'
import { useDrakeStore } from '@/stores/drake'
import { formatRelativeTime } from '@/lib/formatUtils'

const drakeStore = useDrakeStore()

const terms = computed(() => {
  const t = drakeStore.terms
  if (!t) return []
  return t.map((x) => ({
    ...x,
    width: x.symbol === 'L' ? 60 : Math.min(100, Number(x.raw) * 100),
    noBorder: x.symbol === 'L',
    amber: x.symbol === 'fl',
  }))
})

onMounted(async () => {
  if (!drakeStore.loaded) await drakeStore.fetch()
})
</script>

<template>
  <div class="page-full">
    <div class="page-content page-content--wide">
      <h1 class="page-title">Équation de Drake — État Galactique</h1>
      <div
        v-for="t in terms"
        :key="t.symbol"
        class="drake-term"
        :style="t.noBorder ? { border: 'none' } : {}"
      >
        <div class="dt-symbol" :style="t.amber ? { color: 'var(--color-amber)' } : {}">
          {{ t.symbol }}
        </div>
        <div class="dt-label">{{ t.label }}</div>
        <div class="dt-val" :style="t.amber ? { color: 'var(--color-amber)' } : {}">
          {{ t.val }}
        </div>
        <div class="dt-bar">
          <div
            class="dt-bar-fill"
            :class="{ 'bar-amber': t.amber }"
            :style="{ width: t.width + '%' }"
          />
        </div>
      </div>
      <div class="drake-result">
        <div class="dr-label">N — CIVILISATIONS ACTIVES ESTIMÉES</div>
        <div class="dr-value">{{ drakeStore.n }}</div>
        <div class="dr-sub">mis à jour collectivement — dernière variation {{ formatRelativeTime(drakeStore.lastUpdated) }}</div>
      </div>
    </div>
  </div>
</template>

