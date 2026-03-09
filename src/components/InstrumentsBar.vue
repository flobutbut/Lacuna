<script setup>
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useObservationsStore } from '@/stores/observations'

const route = useRoute()
const ui = useUIStore()
const obsStore = useObservationsStore()

const instruments = [
  { id: 'observatoire', path: '/', icon: '◎', label: 'Observatoire', badgeFn: () => obsStore.hasUnanalyzed() },
  { id: 'carte', path: '/carte', icon: '⊹', label: 'Carte' },
  { id: 'laboratoire', path: '/laboratoire', icon: '⌬', label: 'Laboratoire', badgeKey: 'labHasNewObservations' },
  { id: 'artefacts', path: '/artefacts', icon: '◈', label: 'Artefacts', badge: true },
  { id: 'journal', path: '/journal', icon: '≡', label: 'Journal' },
  { id: 'drake', path: '/drake', icon: 'N', label: 'Drake' },
  { id: 'population', path: '/population', icon: '⊕', label: 'Population' },
  { id: 'systemes', path: '/systemes', icon: '⚙', label: 'Systèmes' },
]

function isActive(inst) {
  if (inst.path === '/') return route.path === '/'
  return route.path.startsWith(inst.path)
}
</script>

<template>
  <nav class="instruments">
    <RouterLink
      v-for="inst in instruments"
      :key="inst.id"
      :to="inst.path"
      class="inst-btn"
      :class="{ active: isActive(inst) }"
    >
      <span class="inst-icon">{{ inst.icon }}</span>
      <span>{{ inst.label }}</span>
      <span v-if="inst.badge || (inst.badgeKey && ui[inst.badgeKey]) || (inst.badgeFn && inst.badgeFn())" class="inst-badge" />
    </RouterLink>
  </nav>
</template>
