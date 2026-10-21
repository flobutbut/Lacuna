/**
 * Store Notifications — toast global et pastilles de navigation (Laboratoire, Carte)
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const notification = ref('')
  const notificationVisible = ref(false)
  /** Variante du toast : 'default' | 'info' | 'warn' | 'error' | 'success' */
  const notificationVariant = ref('default')
  const labHasNewObservations = ref(false)
  /** Pastille Carte : true quand un nouveau système a été ajouté à la carte depuis une autre vue */
  const carteHasNewNodes = ref(false)

  function showNotification(msg, duration = 3000, variant = 'default') {
    notification.value = msg
    notificationVariant.value = ['default', 'info', 'warn', 'error', 'success'].includes(variant) ? variant : 'default'
    notificationVisible.value = true
    setTimeout(() => {
      notificationVisible.value = false
    }, duration)
  }

  function setLabHasNew(value = true) {
    labHasNewObservations.value = value
  }

  function clearLabHasNew() {
    labHasNewObservations.value = false
  }

  function setCarteHasNew(value = true) {
    carteHasNewNodes.value = !!value
  }

  function clearCarteHasNew() {
    carteHasNewNodes.value = false
  }

  return {
    notification,
    notificationVisible,
    notificationVariant,
    showNotification,
    labHasNewObservations,
    setLabHasNew,
    clearLabHasNew,
    carteHasNewNodes,
    setCarteHasNew,
    clearCarteHasNew,
  }
})
