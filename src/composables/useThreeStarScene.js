/**
 * Composable — scène Three.js partagée des vues 3D d'étoiles (Carte, Vue 3D conception)
 * Scène, caméra, rendu, OrbitControls, boucle d'animation, redimensionnement,
 * clic vs glisser, picking en espace écran, animations de focus et nettoyage au démontage.
 */
import { onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { animateFocusTo, animateTargetTo } from '@/composables/useCameraFocusAnimation'
import { HIGHLIGHT_RING_SIZE } from '@/composables/useStarHighlight'
import { getCssVar } from '@/lib/cssVars'
import { STAR_SPRITE_BASE_SIZE, STAR_SPRITE_MIN_PIXELS } from '@/constants/starDisplay'

const BASE_CAMERA_DISTANCE = 80
const CLICK_DRAG_THRESHOLD = 5

/**
 * Taille minimale à l'écran pour les PointsMaterial (shader patché) : une étoile lointaine reste visible.
 * @param {THREE.PointsMaterial} material
 */
export function applyMinSizeToPointsMaterial(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.minSize = { value: STAR_SPRITE_MIN_PIXELS }
    shader.vertexShader = shader.vertexShader
      .replace('uniform float scale;', 'uniform float scale;\nuniform float minSize;')
      .replace(
        'if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );',
        'if ( isPerspective ) gl_PointSize = max( size * ( scale / - mvPosition.z ), minSize );'
      )
  }
}

/** Libère géométries et matériaux d'un objet et de ses enfants (textures partagées conservées) */
function disposeObject(obj) {
  obj.traverse((o) => {
    // La géométrie des Sprites est partagée par Three.js : ne pas la libérer
    if (!o.isSprite) o.geometry?.dispose?.()
    o.material?.dispose?.()
  })
}

/**
 * @param {import('vue').Ref<HTMLElement|null>} containerRef - Élément qui reçoit le canvas
 * @param {object} [options]
 * @param {(three: object) => void} [options.onFrame] - Appelé à chaque frame avant le rendu
 * @param {(event: MouseEvent) => void} [options.onClick] - Clic sans glisser (seuil 5 px)
 * @param {(event: MouseEvent) => void} [options.onMouseMove]
 * @param {() => void} [options.onMouseLeave]
 * @param {() => void} [options.onReady] - Appelé une fois la scène créée
 */
export function useThreeStarScene(containerRef, options = {}) {
  const { onFrame, onClick, onMouseMove, onMouseLeave, onReady } = options
  /** Objets Three.js, disponibles après le montage */
  const three = { scene: null, camera: null, renderer: null, controls: null }
  let rafId = null
  let resizeObserver = null
  let mouseDownPos = null
  let isFocusAnimating = false

  function init() {
    const el = containerRef.value
    const width = el.clientWidth
    const height = el.clientHeight
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(getCssVar('--color-bg', '#03060d'))
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000)
    camera.position.set(BASE_CAMERA_DISTANCE, BASE_CAMERA_DISTANCE * 0.5, BASE_CAMERA_DISTANCE)
    camera.lookAt(0, 0, 0)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.target.set(0, 0, 0)
    controls.minDistance = 2
    controls.maxDistance = 3000
    controls.enablePan = true
    Object.assign(three, { scene, camera, renderer, controls })
  }

  function animate() {
    rafId = requestAnimationFrame(animate)
    const { scene, camera, renderer, controls } = three
    if (controls && !isFocusAnimating) controls.update()
    onFrame?.(three)
    if (renderer && scene && camera) renderer.render(scene, camera)
  }

  function resize() {
    const el = containerRef.value
    const { camera, renderer } = three
    if (!el || !camera || !renderer) return
    camera.aspect = el.clientWidth / el.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(el.clientWidth, el.clientHeight)
  }

  function onMouseDown(event) {
    mouseDownPos = { x: event.clientX, y: event.clientY }
  }

  function onClickInternal(event) {
    if (mouseDownPos) {
      const dist = Math.hypot(event.clientX - mouseDownPos.x, event.clientY - mouseDownPos.y)
      mouseDownPos = null
      if (dist > CLICK_DRAG_THRESHOLD) return
    }
    onClick?.(event)
  }

  function onMouseLeaveInternal() {
    onMouseLeave?.()
  }

  /**
   * Remplace un objet de la scène : retire et libère l'ancien, ajoute le nouveau.
   * @returns {THREE.Object3D|null} Le nouvel objet (à conserver par l'appelant)
   */
  function replaceObject(current, next) {
    if (current) {
      three.scene?.remove(current)
      disposeObject(current)
    }
    if (next) three.scene?.add(next)
    return next ?? null
  }

  /**
   * Étoile sous le curseur : hitbox proportionnelle à la taille apparente (espace écran), la plus proche en profondeur.
   * @param {MouseEvent} event
   * @param {Array<{ id: string, x: number, y: number, z: number, size?: number }>} points
   * @param {string|null} highlightId - Étoile en surbrillance (hitbox de l'anneau)
   */
  function pickStarAtMouse(event, points, highlightId) {
    const el = containerRef.value
    const { camera } = three
    if (!el || !camera || !points?.length) return null
    const rect = el.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    const scaleFactor = (0.5 * rect.height) / Math.tan((camera.fov * Math.PI) / 360)
    const v = new THREE.Vector3()
    const hits = []
    for (const p of points) {
      v.set(p.x, p.y, p.z)
      const camDist = camera.position.distanceTo(v)
      v.project(camera)
      if (v.z > 1) continue
      const sx = (v.x * 0.5 + 0.5) * rect.width
      const sy = (1 - (v.y * 0.5 + 0.5)) * rect.height
      const distPx = Math.hypot(mouseX - sx, mouseY - sy)
      const worldSize = p.id === highlightId ? HIGHLIGHT_RING_SIZE : p.size || STAR_SPRITE_BASE_SIZE
      const screenSizePx = Math.max(STAR_SPRITE_MIN_PIXELS, (worldSize * scaleFactor) / Math.max(0.1, camDist))
      if (distPx <= Math.max(6, screenSizePx * 0.6)) hits.push({ star: p, depth: camDist })
    }
    hits.sort((a, b) => a.depth - b.depth)
    return hits[0]?.star ?? null
  }

  const focusCallbacks = {
    onStart: () => { isFocusAnimating = true },
    onComplete: () => { isFocusAnimating = false },
  }

  /** Anime la caméra vers une position */
  function focusOn(pos) {
    if (!pos || !three.camera || !three.controls) return
    animateFocusTo(three.camera, three.controls, pos, focusCallbacks)
  }

  /** Recentre la cible sur le barycentre (origine) */
  function focusBarycentre() {
    if (!three.camera || !three.controls) return
    animateTargetTo(three.camera, three.controls, { x: 0, y: 0, z: 0 }, focusCallbacks)
  }

  onMounted(() => {
    const el = containerRef.value
    if (!el) return
    init()
    onReady?.()
    animate()
    window.addEventListener('resize', resize)
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(el)
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('click', onClickInternal)
    if (onMouseMove) el.addEventListener('mousemove', onMouseMove)
    el.addEventListener('mouseleave', onMouseLeaveInternal)
  })

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    resizeObserver?.disconnect()
    const el = containerRef.value
    if (el) {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('click', onClickInternal)
      if (onMouseMove) el.removeEventListener('mousemove', onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeaveInternal)
      if (three.renderer?.domElement?.parentNode === el) el.removeChild(three.renderer.domElement)
    }
    if (three.scene) disposeObject(three.scene)
    three.controls?.dispose()
    three.renderer?.dispose()
  })

  return { three, replaceObject, pickStarAtMouse, focusOn, focusBarycentre }
}
