<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const instruments = [
  { id: 'observatoire', path: '/', icon: '◎', label: 'Observatoire' },
  { id: 'carte', path: '/carte', icon: '⊹', label: 'Carte' },
  { id: 'artefacts', path: '/artefacts', icon: '◈', label: 'Artefacts', badge: true },
  { id: 'laboratoire', path: '/laboratoire', icon: '⌬', label: 'Laboratoire' },
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
      <span v-if="inst.badge" class="inst-badge" />
    </RouterLink>
  </nav>
</template>
