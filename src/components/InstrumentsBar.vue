<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useNotificationsStore } from '@/stores/notifications'
import { useObservationsStore } from '@/stores/observations'
import { useAuthStore } from '@/stores/auth'
import { useSupabaseStore } from '@/stores/supabase'
import { INSTRUMENTS } from '@/constants/menus'
import NavTabButton from '@/components/NavTabButton.vue'

const route = useRoute()
const notificationsStore = useNotificationsStore()
const { carteHasNewNodes, labHasNewObservations } = storeToRefs(notificationsStore)
const obsStore = useObservationsStore()
const authStore = useAuthStore()
const supabaseStore = useSupabaseStore()

/** Entrées réservées aux admins masquées pour les joueurs (hors ligne : tout est visible) */
const visibleInstruments = computed(() =>
  INSTRUMENTS.filter((inst) => !inst.adminOnly || authStore.isAdmin || !supabaseStore.isConfigured())
)

const instrumentsWithBadge = computed(() =>
  visibleInstruments.value.map((inst) => ({
    ...inst,
    showBadge:
      inst.id === 'artefacts' ||
      (inst.id === 'observatoire' && obsStore.hasUnanalyzed()) ||
      (inst.id === 'laboratoire' && labHasNewObservations.value) ||
      (inst.id === 'carte' && carteHasNewNodes.value),
  }))
)

function isActive(inst) {
  return route.path.startsWith(inst.path)
}
</script>

<template>
  <nav class="instruments">
    <NavTabButton
      v-for="inst in instrumentsWithBadge"
      :key="inst.id"
      :icon="inst.icon"
      :label="inst.label"
      :to="inst.path"
      :active="isActive(inst)"
      :badge="inst.showBadge"
    />
  </nav>
</template>
