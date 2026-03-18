/**
 * Texture circulaire pour sprites étoiles 3D
 * Partagé — Vue 3D conception (Three.js Points)
 * Génère un disque avec bord doux (anti-aliasing)
 */

import * as THREE from 'three'

const DEFAULT_SIZE = 64

/**
 * Crée une texture circulaire pour PointsMaterial (sprites étoiles).
 * Centre blanc opaque, bord transparent (gradient radial).
 * @param {number} [size=64] - Taille en pixels (puissance de 2 recommandée)
 * @returns {THREE.CanvasTexture}
 */
export function createCircleSpriteTexture(size = DEFAULT_SIZE) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')

  const cx = size / 2
  const cy = size / 2
  const r = cx - 2

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.4)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

/** Texture singleton (réutilisée pour toutes les étoiles) */
let _cachedTexture = null

/**
 * Récupère la texture circulaire partagée (cache).
 * @returns {THREE.CanvasTexture}
 */
export function getCircleSpriteTexture() {
  if (!_cachedTexture) {
    _cachedTexture = createCircleSpriteTexture()
  }
  return _cachedTexture
}

/** Texture singleton pour le highlight sélection (deux cercles concentriques) */
let _highlightRingTexture = null

/**
 * Texture pour indicateur de sélection : deux cercles concentriques uniquement (pas de glow).
 * Intérieur : trait 3px, extérieur : trait 2px. Centre transparent.
 * @param {string} color - Couleur CSS (ex. '#00b4c8')
 * @returns {THREE.CanvasTexture}
 */
export function getHighlightRingTexture(color = '#00b4c8') {
  if (_highlightRingTexture) return _highlightRingTexture
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const cx = size / 2
  const cy = size / 2
  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  // Cercle intérieur : rayon ~20px, épaisseur 3px
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, 20, 0, Math.PI * 2)
  ctx.stroke()
  // Cercle extérieur : rayon ~28px, épaisseur 2px
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, 28, 0, Math.PI * 2)
  ctx.stroke()
  _highlightRingTexture = new THREE.CanvasTexture(canvas)
  _highlightRingTexture.needsUpdate = true
  return _highlightRingTexture
}
