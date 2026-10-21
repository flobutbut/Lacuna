<script setup>
import { computed } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

/**
 * Toast de notification réutilisable.
 * Mode store : sans props, utilise useNotificationsStore (showNotification).
 * Mode standalone : props message, visible, variant.
 *
 * @prop {string} [message] - Texte à afficher (optionnel si store)
 * @prop {boolean} [visible] - Afficher/masquer (optionnel si store)
 * @prop {'default'|'info'|'warn'|'error'|'success'} [variant='default'] - Style (violet par défaut)
 */
const props = defineProps({
  message: { type: String, default: '' },
  visible: { type: Boolean, default: undefined },
  variant: { type: String, default: 'default', validator: (v) => ['default', 'info', 'warn', 'error', 'success'].includes(v) },
})

const notificationsStore = useNotificationsStore()

const isStoreMode = computed(() => props.visible === undefined && props.message === '')
const text = computed(() => (isStoreMode.value ? notificationsStore.notification : props.message))
const show = computed(() =>
  isStoreMode.value ? notificationsStore.notificationVisible : (props.visible ?? !!props.message)
)
const variant = computed(() => (isStoreMode.value ? notificationsStore.notificationVariant : props.variant))
const modifierClass = computed(() =>
  variant.value === 'default' ? 'notification-toast--default' : `notification-toast--${variant.value}`
)
</script>

<template>
  <div
    v-if="text"
    class="notification-toast"
    :class="[modifierClass, { 'notification-toast--visible': show }]"
  >
    {{ text }}
  </div>
</template>
