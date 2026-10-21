/**
 * Composable — Recherche stellaires (systèmes, constellations, signaux)
 * Logique partagée Observatoire et Vue 3D conception
 */

import { ref, computed, watch } from 'vue'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useShipStore } from '@/stores/ship'
import { useSignauxStore } from '@/stores/signaux'
import { useObservationsStore } from '@/stores/observations'
import { useNotificationsStore } from '@/stores/notifications'
import { useObservatoireStore } from '@/stores/observatoire'
import { filterBySpectralBand } from '@/lib/spectralBands'
import { xyzToRaDec, raDecToVector } from '@/lib/stellarProjection'
import { parseCoordinates, getSystemXyz } from '@/lib/stellarCoordinates'
import { useViewerSystemPolicy } from '@/composables/useViewerSystemPolicy'

/**
 * @param {object} options
 * @param {boolean} [options.standalone] - Mode conception (pas de uiStore)
 * @param {import('vue').Ref<string>} [options.spectralFilterRef] - En standalone
 * @param {import('vue').Ref<boolean>} [options.exoplanetFilterRef] - En standalone
 * @param {function} [options.onFocusStar] - En standalone : (star) => void
 * @param {function} [options.onUpdateSpectralFilter] - En standalone : (band) => void
 */
export function useStellarSearch(options = {}) {
  const {
    standalone = false,
    spectralFilterRef = null,
    exoplanetFilterRef = null,
    onFocusStar = null,
    onUpdateSpectralFilter = null,
    onClearFocus = null,
  } = options

  const stellarStore = useStellarSystemsStore()
  const systemObjectsStore = useSystemObjectsStore()
  const shipStore = useShipStore()
  const signauxStore = useSignauxStore()
  const obsStore = useObservationsStore()
  const notificationsStore = useNotificationsStore()
  const observatoireStore = useObservatoireStore()
  const { viewerSystemId, shouldExcludeViewerSystemFromSearch } = useViewerSystemPolicy()

  const context = standalone ? 'conception3d' : 'observatoire'

  const searchQuery = ref('')
  const searchMatches = ref([])
  const currentMatchIndex = ref(0)

  function getSpectralFilter() {
    return standalone && spectralFilterRef ? spectralFilterRef.value : observatoireStore.spectralFilter
  }

  function getExoplanetFilter() {
    return standalone && exoplanetFilterRef ? exoplanetFilterRef.value : observatoireStore.exoplanetFilter
  }

  async function computeSystemMatches() {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return []
    const excludeId = shouldExcludeViewerSystemFromSearch(context) ? viewerSystemId.value : null
    return stellarStore.searchSystems(q, { excludeSystemId: excludeId })
  }

  function computeSignalMatches() {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return []
    const supportLabels = { GRAVITATIONNEL: 'grav gravitationnel gw onde', GAMMA_X: 'gamma x γ', EM_RADIO: 'em radio électromagnétique' }
    return (signauxStore.list || []).filter((s) => {
      if (obsStore.findObservationForSignal(s)) return false
      const freq = (s.frequency || '').toLowerCase()
      const src = (s.sourceName || '').toLowerCase()
      const sup = (supportLabels[s.support] || s.support || '').toLowerCase()
      return freq.includes(q) || src.includes(q) || sup.includes(q)
    })
  }

  function computeConstellationMatches() {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return []
    const lines = stellarStore.constellationLines || []
    const byAbbr = new Map()
    for (const seg of lines) {
      const abbr = seg.constellation_abbr || ''
      if (!byAbbr.has(abbr)) {
        const c = seg.constellations || {}
        byAbbr.set(abbr, {
          type: 'constellation',
          abbr,
          name: c.name_latin || abbr,
          nameFr: c.name_fr || c.name_latin || abbr,
          starIds: new Set(),
        })
      }
      byAbbr.get(abbr).starIds.add(seg.star_from)
      byAbbr.get(abbr).starIds.add(seg.star_to)
    }
    return [...byAbbr.values()].filter((c) => {
      const name = (c.name || '').toLowerCase()
      const nameFr = (c.nameFr || '').toLowerCase()
      const abbr = (c.abbr || '').toLowerCase()
      return name.includes(q) || nameFr.includes(q) || abbr.includes(q)
    })
  }

  function goToConstellation(constellationMatch) {
    if (standalone) return
    observatoireStore.clearSearchedStarId()
    const pool = stellarStore.forSky()
    const fullList = stellarStore.list
    const viewerSystem = pool.find((s) => s.id === shipStore.currentSystemId) || fullList.find((s) => s.id === shipStore.currentSystemId)
    const viewerCoords = viewerSystem?.coordinates ?? { x: 0, y: 0, z: 0 }
    const vx = viewerCoords.x ?? 0
    const vy = viewerCoords.y ?? 0
    const vz = viewerCoords.z ?? 0
    let sumX = 0, sumY = 0, sumZ = 0, n = 0
    for (const starId of constellationMatch.starIds) {
      const system = pool.find((s) => s.id === starId) || fullList.find((s) => s.id === starId)
      if (!system) continue
      const xyz = getSystemXyz(system)
      const dx = (xyz.x ?? 0) - vx
      const dy = (xyz.y ?? 0) - vy
      const dz = (xyz.z ?? 0) - vz
      const { ra, dec } = xyzToRaDec(dx, dy, dz)
      const v = raDecToVector(ra, dec)
      sumX += v.x
      sumY += v.y
      sumZ += v.z
      n++
    }
    if (n === 0) {
      notificationsStore.showNotification('Constellation sans étoiles trouvées dans le catalogue', 3000)
      return
    }
    const len = Math.sqrt(sumX * sumX + sumY * sumY + sumZ * sumZ)
    if (len < 1e-6) {
      notificationsStore.showNotification('Impossible de calculer le centre de la constellation', 3000)
      return
    }
    const centerRa = (Math.atan2(sumY, sumX) * 180) / Math.PI
    const centerDec = (Math.asin(Math.max(-1, Math.min(1, sumZ / len))) * 180) / Math.PI
    observatoireStore.setTargetViewDirectionValue({ ra: centerRa, dec: centerDec })
    const label = constellationMatch.nameFr || constellationMatch.name || constellationMatch.abbr
    notificationsStore.showNotification(`Vue centrée sur ${label}`, 2000)
  }

  function goToMatch(match) {
    if (standalone && match?.type !== 'constellation') {
      onFocusStar?.(match)
      return
    }
    if (match?.type === 'constellation') {
      goToConstellation(match)
      return
    }
    const coords = match.coordinates || {}
    const viewerSystem = stellarStore.list.find((s) => s.id === shipStore.currentSystemId)
    const viewerCoords = viewerSystem?.coordinates ?? { x: 0, y: 0, z: 0 }
    const dx = (coords.x ?? 0) - (viewerCoords.x ?? 0)
    const dy = (coords.y ?? 0) - (viewerCoords.y ?? 0)
    const dz = (coords.z ?? 0) - (viewerCoords.z ?? 0)
    const { ra, dec } = xyzToRaDec(dx, dy, dz)
    const letter = (match.spectral_type || '').toUpperCase()[0]
    const band = letter === 'L' || letter === 'T' || letter === 'Y' ? 'ir' : getSpectralFilter()
    if (letter === 'L' || letter === 'T' || letter === 'Y') {
      if (standalone) onUpdateSpectralFilter?.('ir')
      else observatoireStore.setSpectralFilter('ir')
    }
    observatoireStore.setSearchedStarId(match.id)
    observatoireStore.setTargetViewDirectionValue({ ra, dec })
    const raw = stellarStore.forSky(true, { excludeSystemId: viewerSystemId.value })
    const filtered = filterBySpectralBand(raw, band)
    const exoFilter = getExoplanetFilter()
    if (!filtered.some((f) => f.star?.id === match.id)) {
      notificationsStore.showNotification('Trop loin pour voir cette étoile — vue centrée sur la zone', 4000)
    } else if (exoFilter && !systemObjectsStore.hasExoplanets(match.id)) {
      notificationsStore.showNotification('Système sans exoplanètes connues — masqué par le filtre', 3000)
    }
  }

  async function searchStar() {
    const q = searchQuery.value.trim()
    if (!q) {
      searchMatches.value = []
      if (!standalone) {
        observatoireStore.clearSearchedStarId()
        observatoireStore.clearSignalSearchMatchIds()
      }
      return
    }
    const coords = parseCoordinates(q)
    if (coords) {
      if (!standalone) {
        observatoireStore.clearSearchedStarId()
        observatoireStore.clearSignalSearchMatchIds()
        searchMatches.value = []
        observatoireStore.setTargetViewDirectionValue({ ra: coords.ra, dec: coords.dec })
        notificationsStore.showNotification(`Vue centrée sur α ${coords.ra.toFixed(1)}° δ ${coords.dec >= 0 ? '+' : ''}${coords.dec.toFixed(1)}°`, 2000)
      } else {
        searchMatches.value = []
      }
      return
    }
    const systemMatches = await computeSystemMatches()
    const signalMatches = standalone ? [] : computeSignalMatches()
    const constellationMatches = standalone ? [] : computeConstellationMatches()
    if (!standalone) observatoireStore.setSignalSearchMatchIds(signalMatches.map((s) => s.id))
    const allMatches = [...systemMatches, ...constellationMatches]
    if (allMatches.length === 0 && signalMatches.length === 0) {
      searchMatches.value = []
      if (!standalone) observatoireStore.clearSearchedStarId()
      notificationsStore.showNotification('Aucun système, constellation ni signal trouvé pour « ' + q + ' »', 3000)
      return
    }
    if (allMatches.length > 0) {
      searchMatches.value = allMatches
      currentMatchIndex.value = 0
      goToMatch(allMatches[0])
    } else {
      searchMatches.value = []
      if (!standalone) observatoireStore.clearSearchedStarId()
    }
    if (!standalone && signalMatches.length > 0) {
      notificationsStore.showNotification(`${signalMatches.length} signal${signalMatches.length > 1 ? 'ux' : ''} correspondent`, 2000)
    }
  }

  function clearSearch() {
    searchQuery.value = ''
    searchMatches.value = []
    if (!standalone) {
      observatoireStore.clearSearchedStarId()
      observatoireStore.clearSignalSearchMatchIds()
    } else {
      onClearFocus?.()
    }
  }

  function prevMatch() {
    if (searchMatches.value.length <= 1) return
    currentMatchIndex.value = (currentMatchIndex.value - 1 + searchMatches.value.length) % searchMatches.value.length
    goToMatch(searchMatches.value[currentMatchIndex.value])
  }

  function nextMatch() {
    if (searchMatches.value.length <= 1) return
    currentMatchIndex.value = (currentMatchIndex.value + 1) % searchMatches.value.length
    goToMatch(searchMatches.value[currentMatchIndex.value])
  }

  const hasSearch = computed(() => !!searchQuery.value.trim())
  const hasMultipleMatches = computed(() => searchMatches.value.length > 1)
  const matchLabel = computed(() =>
    searchMatches.value.length <= 1 ? '' : `${currentMatchIndex.value + 1}/${searchMatches.value.length}`
  )

  watch(searchQuery, (q) => {
    if (!q?.trim() && !standalone) observatoireStore.clearSignalSearchMatchIds()
  })

  return {
    searchQuery,
    searchMatches,
    currentMatchIndex,
    hasSearch,
    hasMultipleMatches,
    matchLabel,
    searchStar,
    clearSearch,
    prevMatch,
    nextMatch,
    goToMatch,
  }
}
