<script setup>
import { onMounted, computed } from 'vue'
import { useDrakeStore } from '@/stores/drake'
import { formatRelativeTime } from '@/lib/formatUtils'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import ProgressBar from '@/components/ProgressBar.vue'

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
  await ensureStoresLoaded(drakeStore)
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
        <ProgressBar
          :value="t.width"
          :color="t.amber ? 'amber' : 'cyan'"
          pct
          no-margin
          class="dt-bar"
        />
      </div>
      <div class="drake-result">
        <div class="dr-label">N — CIVILISATIONS ACTIVES ESTIMÉES</div>
        <div class="dr-value">{{ drakeStore.n }}</div>
        <div class="dr-sub">mis à jour collectivement — dernière variation {{ formatRelativeTime(drakeStore.lastUpdated) }}</div>
      </div>
    </div>
  </div>
</template>

