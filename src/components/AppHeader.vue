<script setup>
import { computed, onMounted } from 'vue'
import { useShipStore } from '@/stores/ship'
import { useDrakeStore } from '@/stores/drake'
import { useStellarSystemsStore } from '@/stores/stellarSystems'

const shipStore = useShipStore()
const drakeStore = useDrakeStore()
const stellarStore = useStellarSystemsStore()

const currentSystemName = computed(() => {
  const sys = stellarStore.list.find((s) => s.id === shipStore.currentSystemId)
  return sys?.name ?? '—'
})

onMounted(async () => {
  if (!shipStore.loaded) await shipStore.fetch()
  if (!stellarStore.loaded) await stellarStore.fetch()
  if (!drakeStore.loaded) await drakeStore.fetch()
})
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="header__logo">LAC<span class="header__logo-accent">U</span>NA</RouterLink>

    <div class="header__center">
      <div class="header__ship-name">{{ shipStore.name }} — VOYAGE {{ shipStore.voyage }}</div>
      <div class="header__system-name">{{ currentSystemName }}</div>
    </div>

    <div class="header__right">
      <div class="header__stat-block">
        <span class="header__stat-label">Gén.</span>
        <span class="header__stat-val">{{ shipStore.generation }}</span>
      </div>
      <RouterLink to="/drake" class="header__stat-block header__stat-block--drake">
        <span class="header__stat-label">N =</span>
        <span class="header__stat-val">{{ Number(drakeStore.n).toFixed(1) }}</span>
        <span
          v-if="drakeStore.lastDelta"
          class="header__stat-delta"
          :class="{ 'header__stat-delta--neg': drakeStore.lastDelta < 0 }"
        >
          {{ drakeStore.lastDelta >= 0 ? '+' : '' }}{{ Number(drakeStore.lastDelta).toFixed(1) }}
        </span>
      </RouterLink>
    </div>
  </header>
</template>
