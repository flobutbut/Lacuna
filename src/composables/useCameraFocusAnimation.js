/**
 * Composable — animation de focus caméra 3D (Three.js + OrbitControls).
 * Déplace la cible et la caméra vers une position, en orientant la caméra vers la cible à chaque frame
 * pour éviter un « retour » d’orientation en fin d’animation. Réinitialise les deltas OrbitControls en fin.
 * Partagé par Stars3DCanvas (vue Conception) et CarteMap3D (vue Carte).
 */
import * as THREE from 'three'

const DEFAULT_DURATION_MS = 800
const CAM_DIST_MIN = 40
const CAM_DIST_MAX = 80
const CAM_OFFSET = new THREE.Vector3(0.6, 0.3, 0.6)

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function resetOrbitControlsDeltas(controls) {
  if (controls._sphericalDelta) controls._sphericalDelta.set(0, 0, 0)
  if (controls._panOffset) controls._panOffset.set(0, 0, 0)
}

/**
 * Anime la caméra et la cible vers un point (ex. une étoile). La caméra reste orientée vers la cible à chaque frame.
 * @param {THREE.PerspectiveCamera} camera
 * @param {import('three/examples/jsm/controls/OrbitControls.js').OrbitControls} controls
 * @param {{ x: number, y: number, z: number }} endTargetPosition - Position monde de la cible
 * @param {{ duration?: number, onStart?: () => void, onComplete?: () => void }} options
 */
export function animateFocusTo(camera, controls, endTargetPosition, options = {}) {
  if (!camera || !controls) return
  const duration = options.duration ?? DEFAULT_DURATION_MS
  const endTarget = new THREE.Vector3(endTargetPosition.x, endTargetPosition.y, endTargetPosition.z)
  const dist = Math.hypot(endTarget.x, endTarget.y, endTarget.z)
  const camDist = Math.max(CAM_DIST_MIN, Math.min(CAM_DIST_MAX, dist * 0.4))

  const startTarget = controls.target.clone()
  const startPos = camera.position.clone()
  const endPos = endTarget
    .clone()
    .add(CAM_OFFSET.clone().normalize().multiplyScalar(camDist))

  if (options.onStart) options.onStart()
  const startTime = performance.now()

  function lerp(now) {
    const t = Math.min(1, (now - startTime) / duration)
    const eased = easeInOutCubic(t)
    controls.target.lerpVectors(startTarget, endTarget, eased)
    camera.position.lerpVectors(startPos, endPos, eased)
    camera.lookAt(controls.target)
    if (t >= 1) {
      controls.target.copy(endTarget)
      camera.position.copy(endPos)
      camera.lookAt(controls.target)
      resetOrbitControlsDeltas(controls)
      if (options.onComplete) options.onComplete()
    } else {
      requestAnimationFrame(lerp)
    }
  }
  requestAnimationFrame(lerp)
}

/**
 * Anime uniquement la cible vers une position (ex. barycentre). La caméra suit la cible du regard à chaque frame.
 * @param {THREE.PerspectiveCamera} camera
 * @param {import('three/examples/jsm/controls/OrbitControls.js').OrbitControls} controls
 * @param {{ x: number, y: number, z: number }} endTargetPosition
 * @param {{ duration?: number, onStart?: () => void, onComplete?: () => void }} options
 */
export function animateTargetTo(camera, controls, endTargetPosition, options = {}) {
  if (!camera || !controls) return
  const duration = options.duration ?? DEFAULT_DURATION_MS
  const endTarget = new THREE.Vector3(endTargetPosition.x, endTargetPosition.y, endTargetPosition.z)
  const startTarget = controls.target.clone()

  if (options.onStart) options.onStart()
  const startTime = performance.now()

  function lerp(now) {
    const t = Math.min(1, (now - startTime) / duration)
    const eased = easeInOutCubic(t)
    controls.target.lerpVectors(startTarget, endTarget, eased)
    camera.lookAt(controls.target)
    if (t >= 1) {
      controls.target.copy(endTarget)
      camera.lookAt(controls.target)
      resetOrbitControlsDeltas(controls)
      if (options.onComplete) options.onComplete()
    } else {
      requestAnimationFrame(lerp)
    }
  }
  requestAnimationFrame(lerp)
}
