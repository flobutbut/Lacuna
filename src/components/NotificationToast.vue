<script setup>
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()
</script>

<template>
  <div class="notif" :class="{ visible: ui.notificationVisible }">
    {{ ui.notification }}
  </div>
</template>
