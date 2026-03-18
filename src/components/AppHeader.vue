<script setup>
import { computed, onMounted } from 'vue'
import { useShipStore } from '@/stores/ship'
import { useDrakeStore } from '@/stores/drake'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useUIStore } from '@/stores/ui'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { resetPrototypeSession } from '@/lib/session'

const shipStore = useShipStore()
const drakeStore = useDrakeStore()
const stellarStore = useStellarSystemsStore()
const ui = useUIStore()

function resetProto() {
  resetPrototypeSession()
  ui.showNotification('Session prototype réinitialisée — rechargement…', 500)
  setTimeout(() => window.location.reload(), 400)
}

const currentSystemName = computed(() => {
  const sys = stellarStore.list.find((s) => s.id === shipStore.currentSystemId)
  return sys?.name ?? '—'
})

const transitHeaderLabel = computed(() => {
  if (!shipStore.isInTransit) return null
  const origin = currentSystemName.value
  const destSys = stellarStore.list.find((s) => s.id === shipStore.travelDestination)
  const destName = destSys?.name ?? shipStore.travelDestination ?? '—'
  const pct = Math.round(shipStore.transitProgress * 100)
  return `${origin} → ${destName} — ${pct}%`
})

onMounted(async () => {
  await ensureStoresLoaded(shipStore, stellarStore, drakeStore)
})
</script>

<template>
  <header class="header">
    <RouterLink
      to="/"
      class="header__logo"
      title="Accueil — Double-clic : réinitialiser la session prototype"
      @dblclick.prevent="resetProto"
    >LAC<span class="header__logo-accent">U</span>NA</RouterLink>

    <div class="header__center">
      <div class="header__ship-name">{{ shipStore.name }} — VOYAGE {{ shipStore.voyage }}</div>
      <div
        v-if="transitHeaderLabel"
        class="header__system-name header__system-name--transit"
      >
        {{ transitHeaderLabel }}
      </div>
      <div v-else class="header__system-name">
        {{ currentSystemName }}
      </div>
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
