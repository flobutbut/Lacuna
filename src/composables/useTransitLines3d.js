/**
 * Lignes de transit 3D (Three.js) — Carte 3D et Vue conception 3D.
 * Construit un LineSegments à partir de segments { fromId, toId } et d'une Map positionsById.
 * Utilisé par CarteMap3D et Stars3DCanvas.
 */
import * as THREE from 'three'
import { COLOR_GREEN_BRIGHT_HEX } from '@/constants/starDisplay'

/** Opacité par défaut des lignes de transit (réduite pour ne pas surcharger la vue) */
export const TRANSIT_LINE_OPACITY = 0.45

/**
 * Construit un mesh THREE.LineSegments pour afficher les liens de transit entre systèmes.
 * @param {Array<{ fromId: string, toId: string }>} segments - Paires d'ids (normalisés string)
 * @param {Map<string, { x: number, y: number, z: number }>} positionsById - Positions 3D par id
 * @param {{ color?: number, opacity?: number }} [options] - Couleur (hex) et opacité optionnelles
 * @returns {THREE.LineSegments|null}
 */
export function buildTransitLinesMesh(segments, positionsById, options = {}) {
  if (!segments?.length || !positionsById || !(positionsById instanceof Map)) return null
  const vertices = []
  for (const { fromId, toId } of segments) {
    const from = positionsById.get(fromId)
    const to = positionsById.get(toId)
    if (!from || !to) continue
    vertices.push(from.x, from.y, from.z)
    vertices.push(to.x, to.y, to.z)
  }
  if (vertices.length === 0) return null
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  const material = new THREE.LineBasicMaterial({
    color: options.color ?? COLOR_GREEN_BRIGHT_HEX,
    transparent: true,
    opacity: options.opacity ?? TRANSIT_LINE_OPACITY,
  })
  return new THREE.LineSegments(geometry, material)
}
