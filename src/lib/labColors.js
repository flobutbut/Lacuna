/**
 * Couleurs partagées pour les rapports lab (design system).
 * Gradient cyan → amber utilisé par Magneto, Morpho, Volumetrique.
 */

/** t ∈ [0, 1] → rgb(r, g, b) entre cyan (0,180,200) et amber (232,160,32) */
export function interpolateCyanAmber(t) {
  const cyan = { r: 0, g: 180, b: 200 }
  const amber = { r: 232, g: 160, b: 32 }
  const r = cyan.r + (amber.r - cyan.r) * t
  const g = cyan.g + (amber.g - cyan.g) * t
  const b = cyan.b + (amber.b - cyan.b) * t
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
}
