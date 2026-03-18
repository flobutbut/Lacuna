/**
 * Zoom, pan et « pan to selection » pour la vue Map (carte projetée).
 * Réutilise la logique de la vue 3D : zoom molette, pan par glisser, centrage sur la sélection.
 */
import { ref, computed, watch } from 'vue'

const ZOOM_MIN = 0.3
const ZOOM_MAX = 4
const ZOOM_STEP = 0.15
const ORBIT_SENSITIVITY = 0.25

/**
 * @param {import('vue').ComputedRef<{ minX: number, minY: number, width: number, height: number } | null>} viewBoxRef
 * @param {import('vue').ComputedRef<Map<string, { x: number, y: number }>>} positionsRef
 * @param {import('vue').Ref<string | null>} selectedSystemIdRef
 * @param {import('vue').Ref<HTMLElement | null>} [containerRef] - pour pan en coordonnées données
 */
export function useCarteMapPanZoom(viewBoxRef, positionsRef, selectedSystemIdRef, containerRef) {
  const zoom = ref(1)
  const centerX = ref(null)
  const centerY = ref(null)
  const orbitAngle = ref(0)
  const isDragging = ref(false)
  const dragStart = ref(null)

  const viewBox = computed(() => viewBoxRef.value)
  const positions = computed(() => positionsRef.value)

  /** ViewBox effective (zoom + pan) pour l’affichage */
  const effectiveViewBox = computed(() => {
    const vb = viewBox.value
    if (!vb) return null
    const z = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom.value))
    const w = vb.width / z
    const h = vb.height / z
    const cx = centerX.value ?? vb.minX + vb.width / 2
    const cy = centerY.value ?? vb.minY + vb.height / 2
    return {
      minX: cx - w / 2,
      minY: cy - h / 2,
      width: w,
      height: h,
    }
  })

  /** Pivot d’orbit = barycentre ou étoile sélectionnée (comme target OrbitControls en 3D) */
  const orbitPivot = computed(() => {
    const vb = viewBox.value
    if (!vb) return { x: 0, y: 0 }
    const cx = centerX.value ?? vb.minX + vb.width / 2
    const cy = centerY.value ?? vb.minY + vb.height / 2
    return { x: cx, y: cy }
  })

  function centerOnSystem(systemId) {
    const vb = viewBox.value
    const posMap = positions.value
    if (!vb || !posMap) return
    if (!systemId) {
      centerX.value = vb.minX + vb.width / 2
      centerY.value = vb.minY + vb.height / 2
      return
    }
    const pos = posMap.get(systemId)
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return
    centerX.value = pos.x
    centerY.value = pos.y
  }

  function resetView() {
    zoom.value = 1
    centerX.value = null
    centerY.value = null
    orbitAngle.value = 0
  }

  function onWheel(e) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom.value + delta))
    zoom.value = newZoom
  }

  function onMouseDown(e) {
    if (e.button !== 0) return
    isDragging.value = true
    dragStart.value = {
      x: e.clientX,
      y: e.clientY,
      startAngle: orbitAngle.value,
    }
  }

  function onMouseMove(e) {
    if (!isDragging.value || !dragStart.value) return
    const dx = e.clientX - dragStart.value.x
    orbitAngle.value = dragStart.value.startAngle + dx * ORBIT_SENSITIVITY
  }

  function onMouseUp() {
    isDragging.value = false
    dragStart.value = null
  }

  function onMouseLeave() {
    if (isDragging.value) {
      isDragging.value = false
      dragStart.value = null
    }
  }

  watch(selectedSystemIdRef, (id) => {
    centerOnSystem(id ?? null)
  }, { immediate: true })

  return {
    zoom,
    orbitAngle,
    orbitPivot,
    effectiveViewBox,
    centerOnSystem,
    resetView,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    isDragging,
  }
}
