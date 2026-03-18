/**
 * Composable — highlight de sélection 3D (deux cercles concentriques).
 * Utilisé par Stars3DCanvas et CarteMap3D pour garder le même rendu et la même logique.
 */
import * as THREE from 'three'
import { getHighlightRingTexture } from '@/lib/starSpriteTexture'

/** Taille du sprite anneaux (plus grand que l’étoile, pas collé) — world units */
export const HIGHLIGHT_RING_SIZE = 1.8

/** Taille minimale en pixels à l’écran pour rester visible au dézoom */
export const MIN_HIGHLIGHT_PIXELS = 22

const HIGHLIGHT_COLOR = '#00b4c8'

/**
 * Crée un sprite « anneaux » à la position donnée (deux cercles concentriques, pas de glow).
 * @param {number} x - Position X world
 * @param {number} y - Position Y world
 * @param {number} z - Position Z world
 * @returns {THREE.Sprite}
 */
export function createHighlightSprite(x, y, z) {
  const material = new THREE.SpriteMaterial({
    map: getHighlightRingTexture(HIGHLIGHT_COLOR),
    transparent: true,
    opacity: 1,
    depthTest: true,
    depthWrite: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.position.set(x, y, z)
  sprite.scale.set(HIGHLIGHT_RING_SIZE, HIGHLIGHT_RING_SIZE)
  return sprite
}

/**
 * Met à jour l’échelle du sprite pour qu’il reste lisible au dézoom (taille min en pixels).
 * À appeler chaque frame dans animate() quand un highlight est affiché.
 * @param {THREE.Sprite} sprite - Sprite highlight
 * @param {THREE.PerspectiveCamera} camera - Caméra de la scène
 * @param {number} viewportHeight - Hauteur du viewport (px)
 */
export function updateHighlightScale(sprite, camera, viewportHeight) {
  if (!sprite || !camera || !viewportHeight) return
  const dist = camera.position.distanceTo(sprite.position)
  const scaleFactor = (0.5 * viewportHeight) / Math.tan((camera.fov * Math.PI) / 360)
  const minWorld = (MIN_HIGHLIGHT_PIXELS * dist) / scaleFactor
  const s = Math.max(HIGHLIGHT_RING_SIZE, minWorld)
  sprite.scale.set(s, s)
}
