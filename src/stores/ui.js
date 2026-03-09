/**
 * Store UI — état des panels, notifications, tooltip
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const activePanel = ref(null) // 'obs' | 'map' | 'art' | 'lab' | 'log' | 'drake' | 'pop' | 'sys'
  const notification = ref('')
  const notificationVisible = ref(false)
  const travelWidgetVisible = ref(false)
  const travelDestination = ref('')
  const travelTime = ref('')
  const hoveredStar = ref(null)
  const reticulePosition = ref({ x: 0, y: 0 })
  const reticuleVisible = ref(false)

  function openPanel(id) {
    activePanel.value = id
  }

  function closePanel(id) {
    if (activePanel.value === id) {
      activePanel.value = null
    }
  }

  function togglePanel(id) {
    activePanel.value = activePanel.value === id ? null : id
  }

  function showNotification(msg, duration = 3000) {
    notification.value = msg
    notificationVisible.value = true
    setTimeout(() => {
      notificationVisible.value = false
    }, duration)
  }

  function showTravelWidget(dest, time, duration = 4000) {
    travelDestination.value = dest
    travelTime.value = time
    travelWidgetVisible.value = true
    setTimeout(() => {
      travelWidgetVisible.value = false
    }, duration)
  }

  function setReticulePosition(x, y) {
    reticulePosition.value = { x, y }
    reticuleVisible.value = true
  }

  function setReticuleVisible(visible) {
    reticuleVisible.value = visible
  }

  return {
    activePanel,
    notification,
    notificationVisible,
    travelWidgetVisible,
    travelDestination,
    travelTime,
    hoveredStar,
    reticulePosition,
    openPanel,
    closePanel,
    togglePanel,
    showNotification,
    showTravelWidget,
    setReticulePosition,
    setReticuleVisible,
    reticuleVisible,
  }
})
