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
  const selectedStar = ref(null)
  const observatoireOpen = ref(false)
  const labHasNewObservations = ref(false)
  const hoveredStar = ref(null)
  const reticulePosition = ref({ x: 0, y: 0 })
  const reticuleVisible = ref(false)
  const selectedSignal = ref(null)
  const hoveredSignal = ref(null)

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

  function selectStar(star) {
    selectedStar.value = star
    travelWidgetVisible.value = !!star
    selectedSignal.value = null
  }

  function openObservatoire() {
    observatoireOpen.value = true
  }

  function closeObservatoire() {
    observatoireOpen.value = false
  }

  function setLabHasNew(value = true) {
    labHasNewObservations.value = value
  }

  function clearLabHasNew() {
    labHasNewObservations.value = false
  }

  function setReticulePosition(x, y) {
    reticulePosition.value = { x, y }
    reticuleVisible.value = true
  }

  function setReticuleVisible(visible) {
    reticuleVisible.value = visible
  }

  function selectSignal(signal) {
    selectedSignal.value = signal
    observatoireOpen.value = false
    selectedStar.value = null
    travelWidgetVisible.value = false
  }

  function closeSignalModal() {
    selectedSignal.value = null
  }

  function setHoveredSignal(signal) {
    hoveredSignal.value = signal
  }

  return {
    activePanel,
    notification,
    notificationVisible,
    travelWidgetVisible,
    travelDestination,
    travelTime,
    selectedStar,
    observatoireOpen,
    labHasNewObservations,
    hoveredStar,
    reticulePosition,
    openPanel,
    closePanel,
    togglePanel,
    showNotification,
    showTravelWidget,
    selectStar,
    openObservatoire,
    closeObservatoire,
    setLabHasNew,
    clearLabHasNew,
    setReticulePosition,
    setReticuleVisible,
    reticuleVisible,
    selectedSignal,
    hoveredSignal,
    selectSignal,
    closeSignalModal,
    setHoveredSignal,
  }
})
