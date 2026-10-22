<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useShipStore } from '@/stores/ship'
import { useDrakeStore } from '@/stores/drake'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useRadarStore } from '@/stores/radar'
import { useAuthStore } from '@/stores/auth'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import SettingsModal from '@/components/settings/SettingsModal.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const shipStore = useShipStore()
const drakeStore = useDrakeStore()
const stellarStore = useStellarSystemsStore()
const radarStore = useRadarStore()
const route = useRoute()
const authStore = useAuthStore()
const { radarEnabled } = storeToRefs(radarStore)
const settingsOpen = ref(false)

// App.vue recharge la page sur /connexion dès que la session disparaît
function logout() {
  authStore.signOut()
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
      :to="{ name: 'observatoire' }"
      class="header__logo"
      title="Observatoire"
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
      <!-- Indicateur seul : l'acquisition ne tourne que sur l'Observatoire, où se trouvent ses interrupteurs -->
      <div
        v-if="route.name === 'observatoire'"
        class="header__stat-block header__radar-status"
        :class="{ 'header__radar-status--off': !radarEnabled }"
        role="status"
        :title="radarEnabled ? 'Acquisition radar en cours' : 'Acquisition radar coupée'"
        :aria-label="radarEnabled ? 'Radar : acquisition en cours' : 'Radar : acquisition coupée'"
      >
        <span class="header__radar-status__label" aria-hidden="true">Radar</span>
        <span
          class="header__stat-val header__radar-status__state"
          :class="{ 'header__radar-status__state--on': radarEnabled }"
          aria-hidden="true"
        ><AppIcon :name="radarEnabled ? 'dot' : 'dot-outline'" /></span>
      </div>
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
      <button
        v-if="authStore.isAuthenticated"
        type="button"
        class="header__stat-block header__settings"
        title="Paramètres"
        aria-label="Paramètres"
        @click="settingsOpen = true"
      >
        <AppIcon name="account" class="header__settings__icon" />
      </button>
      <button
        v-if="authStore.isAuthenticated"
        type="button"
        class="header__stat-block header__logout"
        title="Se déconnecter"
        @click="logout"
      >
        <span class="header__logout__label">Quitter</span>
      </button>
    </div>
    <!-- Hors du header : son z-index limiterait la modale -->
    <Teleport to="body">
      <SettingsModal v-if="settingsOpen" @close="settingsOpen = false" />
    </Teleport>
  </header>
</template>
