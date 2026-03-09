<script setup>
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()
</script>

<template>
  <div class="travel-widget" :class="{ visible: ui.travelWidgetVisible }">
    <div class="travel-widget__inner">
      <div class="travel-widget__label">VOYAGE EN COURS</div>
      <div class="travel-widget__dest">{{ ui.travelDestination || '—' }}</div>
      <div class="travel-widget__time">{{ ui.travelTime || '—' }}</div>
    </div>
  </div>
</template>
