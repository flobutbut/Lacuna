/**
 * Composable — chargement des SVG étoiles en texture Three.js (sprites).
 * Cache par lettre spectrale (O, B, A, … M, L, T, Y, D, PULSAR).
 * Utilisé par Stars3DCanvas et CarteMap3D pour afficher les nœuds avec les bons SVG.
 */
import * as THREE from 'three'
import { getStarSvgPath } from '@/assets/illustrations/stars'
import { getSpectralLetter } from '@/lib/starClassification'

const textureCache = new Map()

/**
 * Charge une texture Three.js à partir du SVG d’étoile pour le type spectral donné.
 * @param {string} spectralType - Type spectral (ex. G2V, M5V, PSR B1919+21)
 * @returns {Promise<THREE.CanvasTexture>}
 */
export function loadStarSvgTextureForSpectralType(spectralType) {
  const letter = getSpectralLetter(spectralType)
  if (textureCache.has(letter)) return textureCache.get(letter)
  const promise = (async () => {
    const url = getStarSvgPath(spectralType)
    const res = await fetch(url)
    const svgText = await res.text()
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
    const svgObjectUrl = URL.createObjectURL(svgBlob)
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = reject
        i.src = svgObjectUrl
      })
      const size = 128
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const tex = new THREE.CanvasTexture(canvas)
      tex.needsUpdate = true
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = false
      return tex
    } finally {
      URL.revokeObjectURL(svgObjectUrl)
    }
  })()
  textureCache.set(letter, promise)
  return promise
}
