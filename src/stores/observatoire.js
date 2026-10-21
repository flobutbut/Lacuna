/**
 * Store Observatoire — sélection et survol (étoile, corps, signal, constellation), réticule,
 * direction de vue, filtres du ciel, recherche, mode de vue et tuiles latérales
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useTransitStore } from '@/stores/transit'

export const useObservatoireStore = defineStore('observatoire', () => {
  const transitStore = useTransitStore()

  const selectedStar = ref(null)
  const selectedBody = ref(null)
  const observatoireOpen = ref(false)
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
  /** Vue Observatoire : 'sky' | 'radar' | 'system' */
  const observatoireViewMode = ref('sky')
  /** Tuiles latérales (SideLeft, SideRight) en vue ciel profond — raccourci [@] pour masquer */
  const observatoireTilesVisible = ref(true)

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

  function toggleConstellationsEnabled() {
    constellationsEnabled.value = !constellationsEnabled.value
    localStorage.setItem('lacuna_constellations_enabled', JSON.stringify(constellationsEnabled.value))
  }

  function selectStar(star) {
    selectedStar.value = star
    selectedBody.value = null
    transitStore.travelWidgetVisible = !!star
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
    transitStore.travelWidgetVisible = false
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
    selectedStar,
    selectedBody,
    setSelectedBody,
    observatoireOpen,
    hoveredStar,
    reticulePosition,
    selectStar,
    openObservatoire,
    closeObservatoire,
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
    signalSearchMatchIds,
    setSignalSearchMatchIds,
    clearSignalSearchMatchIds,
    observatoireViewMode,
    setObservatoireViewMode,
    observatoireTilesVisible,
    toggleObservatoireTiles,
  }
})
