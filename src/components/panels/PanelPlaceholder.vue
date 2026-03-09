<script setup>
import { useUIStore } from '@/stores/ui'

defineProps({
  id: { type: String, required: true },
  title: { type: String, required: true },
  position: { type: String, default: 'top: 60px; left: 220px' },
})

const ui = useUIStore()
</script>

<template>
  <div class="panel-overlay" :class="{ open: ui.activePanel === id }" :style="position">
    <div class="panel-box">
      <div class="panel-header">
        <div class="panel-title">{{ title }}</div>
        <button type="button" class="panel-close btn-close" @click="ui.closePanel(id)">✕</button>
      </div>
      <div class="panel-body">
        <p class="panel-section-title" style="color: var(--color-muted)">
          Module en cours de développement.
        </p>
      </div>
    </div>
  </div>
</template>
