/**
 * Store UI — notifications, sélection, tooltip, état Observatoire et Radar
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
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
  /** Pastille Carte : true quand un nouveau système a été ajouté à la carte depuis une autre vue */
  const carteHasNewNodes = ref(false)
  const hoveredStar = ref(null)
  const reticulePosition = ref({ x: 0, y: 0 })
  const reticuleVisible = ref(false)
  const selectedSignal = ref(null)
  const hoveredSignal = ref(null)
  /** Constellation survolée (ligne) : { abbr, name } ou null */
  const hoveredConstellation = ref(null)
  /** Vue par défaut ra=180,dec=0 — override à l’ouverture Observatoire si à SOL (voir SkyCanvas) */
  const viewDirection = ref({ ra: 180, dec: 0 })
  const targetViewDirection = ref({ ra: 180, dec: 0 })
  /** Filtre spectral Observatoire : 'visible' | 'ir' | 'uv' | 'r' */
  const spectralFilter = ref('visible')
  /** Filtre exoplanètes — n'afficher que les systèmes avec exoplanètes connues (s'additionne aux filtres spectraux) */
  const exoplanetFilter = ref(false)
  /** Afficher les lignes de constellation (tous filtres spectraux) — préférence localStorage, désactivé par défaut */
  const constellationsEnabled = ref(
    JSON.parse(localStorage.getItem('lacuna_constellations_enabled') ?? 'false')
  )
  /** ID de l'étoile recherchée (centrée et highlightée) */
  const searchedStarId = ref(null)
  /** IDs des signaux correspondant à la recherche (pour surligner dans SideLeft) */
  const signalSearchMatchIds = ref(new Set())
  /** Cap fixé en attente de confirmation — { id, name, dist, distanceLy, spectral_type, transitMeta } */
  const pendingDeparture = ref(null)
  /** Vue de confirmation du départ (ALLUMER LES MOTEURS) ouverte */
  const departureConfirmationOpen = ref(false)
  /** Vue Observatoire : 'sky' | 'radar' | 'system' */
  const observatoireViewMode = ref('sky')
  /** Tuiles latérales (SideLeft, SideRight) en vue ciel profond — raccourci [@] pour masquer */
  const observatoireTilesVisible = ref(true)
  /** Bande de fréquences Radar : 'P' | 'L' | 'X' | 'G' */
  const radarFrequencyBand = ref('L')
  /** Radar en pause (n'acquiert plus de données) */
  const radarPaused = ref(false)
  /** Mode sélection Radar en pause : 'zone' | 'period' | null. Zone présélectionné. */
  const radarSelectionMode = ref('zone')
  /** Échelle temps spectrogramme radar : ms par colonne (10 | 100 | 1000 | 10000) */
  const radarTimeScale = ref(100)
  /** Seuil minimum flux_relative pour l'injection pulsars (0–1) */
  const radarIntensityThreshold = ref(0)
  /** Son radar (spectrogramme) — UI seule tant que l’audio n’est pas branché */
  const radarSoundEnabled = ref(false)
  /** Bruit de fond du spectrogramme radar (thermique + synchrotron) */
  const radarNoiseEnabled = ref(true)
  /** Borne basse du zoom fréquentiel (0–125 Hz) */
  const radarFreqLow = ref(0)
  /** Borne haute du zoom fréquentiel (0–125 Hz) */
  const radarFreqHigh = ref(125)
  /** Acquisition spectrogramme (buffer radar) — piloté depuis le header */
  const radarEnabled = ref(true)

  function toggleRadarEnabled() {
    radarEnabled.value = !radarEnabled.value
  }

  function setObservatoireViewMode(mode) {
    if (['sky', 'radar', 'system'].includes(mode)) {
      observatoireViewMode.value = mode
      if (mode === 'sky') {
        selectedStar.value = null
        selectedBody.value = null
        observatoireOpen.value = false
      }
    }
  }

  function setSearchedStarId(id) {
    searchedStarId.value = id
  }

  function clearSearchedStarId() {
    searchedStarId.value = null
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

  function setExoplanetFilter(value) {
    exoplanetFilter.value = !!value
  }

  function toggleExoplanetFilter() {
    exoplanetFilter.value = !exoplanetFilter.value
  }

  function toggleObservatoireTiles() {
    observatoireTilesVisible.value = !observatoireTilesVisible.value
  }

  function setRadarFrequencyBand(band) {
    if (band) radarFrequencyBand.value = band
  }

  function toggleRadarPaused() {
    radarPaused.value = !radarPaused.value
  }

  function setRadarSelectionMode(mode) {
    radarSelectionMode.value = mode === 'zone' || mode === 'period' ? mode : null
  }

  function setRadarTimeScale(ms) {
    if ([10, 100, 1000, 10000].includes(Number(ms))) {
      radarTimeScale.value = Number(ms)
    }
  }

  function setRadarIntensityThreshold(val) {
    const n = parseFloat(val)
    if (!isNaN(n)) {
      radarIntensityThreshold.value = Math.min(1, Math.max(0, n))
    }
  }

  function setRadarFreqLow(val) {
    const n = parseFloat(val)
    if (!isNaN(n)) {
      radarFreqLow.value = Math.min(
        radarFreqHigh.value - 1,
        Math.max(0, n)
      )
    }
  }

  function setRadarFreqHigh(val) {
    const n = parseFloat(val)
    if (!isNaN(n)) {
      radarFreqHigh.value = Math.max(
        radarFreqLow.value + 1,
        Math.min(125, n)
      )
    }
  }

  function toggleRadarSound() {
    radarSoundEnabled.value = !radarSoundEnabled.value
  }

  function toggleRadarNoise() {
    radarNoiseEnabled.value = !radarNoiseEnabled.value
  }

  function toggleConstellationsEnabled() {
    constellationsEnabled.value = !constellationsEnabled.value
    localStorage.setItem('lacuna_constellations_enabled', JSON.stringify(constellationsEnabled.value))
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

  function setCarteHasNew(value = true) {
    carteHasNewNodes.value = !!value
  }

  function clearCarteHasNew() {
    carteHasNewNodes.value = false
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

  function setHoveredConstellation(constellation) {
    hoveredConstellation.value = constellation
  }

  return {
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
    carteHasNewNodes,
    hoveredStar,
    reticulePosition,
    showNotification,
    showTravelWidget,
    selectStar,
    openObservatoire,
    closeObservatoire,
    setLabHasNew,
    clearLabHasNew,
    setCarteHasNew,
    clearCarteHasNew,
    setReticulePosition,
    setReticuleVisible,
    reticuleVisible,
    selectedSignal,
    hoveredSignal,
    selectSignal,
    closeSignalModal,
    setHoveredSignal,
    hoveredConstellation,
    setHoveredConstellation,
    viewDirection,
    targetViewDirection,
    setViewDirection,
    setTargetViewDirection,
    setViewDirectionValue,
    setTargetViewDirectionValue,
    spectralFilter,
    setSpectralFilter,
    exoplanetFilter,
    setExoplanetFilter,
    toggleExoplanetFilter,
    constellationsEnabled,
    toggleConstellationsEnabled,
    searchedStarId,
    setSearchedStarId,
    clearSearchedStarId,
    pendingDeparture,
    departureConfirmationOpen,
    setPendingDeparture,
    clearPendingDeparture,
    openDepartureConfirmation,
    closeDepartureConfirmation,
    signalSearchMatchIds,
    setSignalSearchMatchIds,
    clearSignalSearchMatchIds,
    observatoireViewMode,
    setObservatoireViewMode,
    observatoireTilesVisible,
    toggleObservatoireTiles,
    radarFrequencyBand,
    setRadarFrequencyBand,
    radarPaused,
    toggleRadarPaused,
    radarSelectionMode,
    setRadarSelectionMode,
    radarTimeScale,
    setRadarTimeScale,
    radarIntensityThreshold,
    setRadarIntensityThreshold,
    radarSoundEnabled,
    toggleRadarSound,
    radarNoiseEnabled,
    toggleRadarNoise,
    radarFreqLow,
    setRadarFreqLow,
    radarFreqHigh,
    setRadarFreqHigh,
    radarEnabled,
    toggleRadarEnabled,
  }
})
