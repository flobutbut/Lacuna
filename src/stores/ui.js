/**
 * Store UI — état des panels, notifications, tooltip
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const activePanel = ref(null) // 'obs' | 'map' | 'art' | 'lab' | 'log' | 'drake' | 'pop' | 'sys'
  const notification = ref('')
  const notificationVisible = ref(false)
  /** Variante du toast : 'default' | 'info' | 'warn' | 'error' | 'success' */
  const notificationVariant = ref('default')
  const travelWidgetVisible = ref(false)
  const travelDestination = ref('')
  const travelTime = ref('')
  const selectedStar = ref(null)
  const selectedBody = ref(null)
  const observatoireOpen = ref(false)
  const labHasNewObservations = ref(false)
  const hoveredStar = ref(null)
  const reticulePosition = ref({ x: 0, y: 0 })
  const reticuleVisible = ref(false)
  const selectedSignal = ref(null)
  const hoveredSignal = ref(null)
  const viewDirection = ref({ ra: 180, dec: 0 })
  const targetViewDirection = ref({ ra: 180, dec: 0 })
  /** Filtre spectral Observatoire : 'visible' | 'ir' | 'uv' | 'r' */
  const spectralFilter = ref('visible')
  /** ID de l'étoile recherchée (centrée et highlightée) */
  const searchedStarId = ref(null)
  /** IDs des signaux correspondant à la recherche (pour surligner dans SideLeft) */
  const signalSearchMatchIds = ref(new Set())
  /** Vue Observatoire : 'sky' | 'system' */
  const observatoireViewMode = ref('sky')

  function setObservatoireViewMode(mode) {
    if (['sky', 'system'].includes(mode)) {
      observatoireViewMode.value = mode
    }
  }

  function setSearchedStarId(id) {
    searchedStarId.value = id
  }

  function clearSearchedStarId() {
    searchedStarId.value = null
  }

  function setSignalSearchMatchIds(ids) {
    signalSearchMatchIds.value = new Set(Array.isArray(ids) ? ids : [])
  }

  function clearSignalSearchMatchIds() {
    signalSearchMatchIds.value = new Set()
  }

  function setViewDirection(ra, dec) {
    viewDirection.value = { ra, dec }
  }

  function setTargetViewDirection(ra, dec) {
    targetViewDirection.value = { ra, dec }
  }

  function setViewDirectionValue(obj) {
    viewDirection.value = obj
  }

  function setTargetViewDirectionValue(obj) {
    targetViewDirection.value = obj
  }

  function setSpectralFilter(band) {
    if (['visible', 'ir', 'uv', 'r'].includes(band)) {
      spectralFilter.value = band
    }
  }

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

  function showNotification(msg, duration = 3000, variant = 'default') {
    notification.value = msg
    notificationVariant.value = ['default', 'info', 'warn', 'error', 'success'].includes(variant) ? variant : 'default'
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
    selectedBody.value = null
    travelWidgetVisible.value = !!star
    selectedSignal.value = null
  }

  function setSelectedBody(body) {
    selectedBody.value = body
  }

  function openObservatoire() {
    observatoireOpen.value = true
  }

  function closeObservatoire() {
    observatoireOpen.value = false
    selectedBody.value = null
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
    notificationVariant,
    travelWidgetVisible,
    travelDestination,
    travelTime,
    selectedStar,
    selectedBody,
    setSelectedBody,
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
    viewDirection,
    targetViewDirection,
    setViewDirection,
    setTargetViewDirection,
    setViewDirectionValue,
    setTargetViewDirectionValue,
    spectralFilter,
    setSpectralFilter,
    searchedStarId,
    setSearchedStarId,
    clearSearchedStarId,
    signalSearchMatchIds,
    setSignalSearchMatchIds,
    clearSignalSearchMatchIds,
    observatoireViewMode,
    setObservatoireViewMode,
  }
})
