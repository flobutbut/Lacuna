<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useObservationsStore } from '@/stores/observations'
import { INSTRUMENTS } from '@/constants/menus'
import NavTabButton from '@/components/NavTabButton.vue'

const route = useRoute()
const ui = useUIStore()
const obsStore = useObservationsStore()

const instrumentsWithBadge = computed(() =>
  INSTRUMENTS.map((inst) => ({
    ...inst,
    showBadge:
      inst.id === 'artefacts' ||
      (inst.id === 'observatoire' && obsStore.hasUnanalyzed()) ||
      (inst.id === 'laboratoire' && ui.labHasNewObservations),
  }))
)

function isActive(inst) {
  if (inst.path === '/') return route.path === '/'
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
