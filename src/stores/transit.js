/**
 * Store Transit (UI) — widget de voyage et confirmation de départ
 * L'état du voyage lui-même (progression, destination en base) est dans le store ship.
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTransitStore = defineStore('transit', () => {
  const travelWidgetVisible = ref(false)
  const travelDestination = ref('')
  const travelTime = ref('')
  /** Cap fixé en attente de confirmation — { id, name, dist, distanceLy, spectral_type, transitMeta } */
  const pendingDeparture = ref(null)
  /** Vue de confirmation du départ (ALLUMER LES MOTEURS) ouverte */
  const departureConfirmationOpen = ref(false)

  function showTravelWidget(dest, time, duration = 4000) {
    travelDestination.value = dest
    travelTime.value = time
    travelWidgetVisible.value = true
    setTimeout(() => {
      travelWidgetVisible.value = false
    }, duration)
  }

  function setPendingDeparture(payload) {
    pendingDeparture.value = payload ? { ...payload } : null
  }

  function clearPendingDeparture() {
    pendingDeparture.value = null
  }

  function openDepartureConfirmation() {
    departureConfirmationOpen.value = true
  }

  function closeDepartureConfirmation() {
    departureConfirmationOpen.value = false
    pendingDeparture.value = null
  }

  return {
    travelWidgetVisible,
    travelDestination,
    travelTime,
    showTravelWidget,
    pendingDeparture,
    departureConfirmationOpen,
    setPendingDeparture,
    clearPendingDeparture,
    openDepartureConfirmation,
    closeDepartureConfirmation,
  }
})
