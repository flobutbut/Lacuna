/**
 * Rendu canvas — ciel Observatoire
 * Milky Way, grille dôme, nébuleuses IR, étoiles, signaux, bordure spectrale
 */

import { projectStarInFov, projectNebulaShape } from './stellarProjection'
import { resolveStarColor } from './spectralBands'
import { HIGHLIGHT_CYAN_RGBA, HIGHLIGHT_CYAN_RGBA_SOFT, HIGHLIGHT_VISITED_RGBA } from '@/constants/starDisplay'

const TRANSITION_SPEED = 0.032 // ~0.5s à 60fps

/** Voie lactée — gradient elliptique flou (désactivé en ciel profond) */
export function drawMilkyWay(_ctx, _w, _h) {
  /* Flare désactivé — no-op */
}

/** Lignes horizontales courbes — effet dôme céleste (alpha uniforme, pas de flare centre) */
export function drawCurvedGrid(ctx, w, h) {
  const tiers = [0.15, 0.3, 0.45, 0.55, 0.7, 0.85]
  const curveStrength = Math.min(w, h) * 0.08
  const alpha = 0.08
  tiers.forEach((t) => {
    const y = h * t
    const cy = y + (t < 0.5 ? curveStrength : -curveStrength)
    ctx.strokeStyle = `rgba(100, 130, 180, ${alpha})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.quadraticCurveTo(w * 0.5, cy, w, y)
    ctx.stroke()
  })
}

/** Nébuleuses IR — style JWST */
export function drawNebulas(ctx, nebulas, raView, decView, w, h, viewerCoords = { x: 0, y: 0, z: 0 }) {
  nebulas.forEach((n) => {
    const vertices = projectNebulaShape(n, raView, decView, w, h, viewerCoords)
    if (!vertices || vertices.length <= 2) return

    const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length
    const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length
    const maxR = Math.max(...vertices.map((v) => Math.hypot(v.x - cx, v.y - cy))) || 1

    function drawScaledPath(scale) {
      ctx.beginPath()
      const v0 = vertices[0]
      ctx.moveTo(cx + (v0.x - cx) * scale, cy + (v0.y - cy) * scale)
      for (let i = 1; i < vertices.length; i++) {
        const v = vertices[i]
        ctx.lineTo(cx + (v.x - cx) * scale, cy + (v.y - cy) * scale)
      }
      ctx.closePath()
    }

    ctx.save()

    for (let layer = 0; layer < 4; layer++) {
      const scale = 1.35 - layer * 0.09
      const alpha = (4 - layer) * 0.02
      drawScaledPath(scale)
      ctx.fillStyle = `rgba(180, 80, 140, ${alpha})`
      ctx.fill()
    }

    ctx.globalCompositeOperation = 'lighter'
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
    grad.addColorStop(0, 'rgba(255, 180, 120, 0.22)')
    grad.addColorStop(0.3, 'rgba(255, 130, 90, 0.12)')
    grad.addColorStop(0.6, 'rgba(200, 90, 130, 0.06)')
    grad.addColorStop(0.85, 'rgba(140, 60, 120, 0.02)')
    grad.addColorStop(1, 'rgba(100, 40, 80, 0)')
    drawScaledPath(1)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'

    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.5)
    coreGrad.addColorStop(0, 'rgba(255, 200, 150, 0.15)')
    coreGrad.addColorStop(0.5, 'rgba(255, 140, 80, 0.04)')
    coreGrad.addColorStop(1, 'rgba(255, 100, 60, 0)')
    drawScaledPath(1)
    ctx.fillStyle = coreGrad
    ctx.fill()

    drawScaledPath(1)
    ctx.strokeStyle = 'rgba(255, 160, 120, 0.08)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.restore()
  })
}

/** Lignes de constellation — cyan atténué, réutilise positions projetées.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{star_from:string, star_to:string, constellation_abbr:string}>} lines
 * @param {Map<string, {x:number, y:number}>} projectedPositions - id → position écran (stars in FOV)
 * @param {number} [opacity=0.35] - opacité des traits (ex. 0.2 quand filtre exoplanètes actif)
 */
export function drawConstellationLines(ctx, lines, projectedPositions, w, h, opacity = 0.35) {
  if (!lines?.length || !projectedPositions) return
  ctx.save()
  ctx.strokeStyle = `rgba(0, 180, 200, ${opacity})`
  ctx.lineWidth = 1
  ctx.setLineDash([])
  lines.forEach((seg) => {
    const posFrom = projectedPositions.get(seg.star_from)
    const posTo = projectedPositions.get(seg.star_to)
    if (!posFrom || !posTo) return
    ctx.beginPath()
    ctx.moveTo(posFrom.x, posFrom.y)
    ctx.lineTo(posTo.x, posTo.y)
    ctx.stroke()
  })
  ctx.restore()
}

/** Étoiles avec scintillement, palettes spectrales et transition d'opacité.
 * @param {Map<string, {x:number, y:number}>} [projectedPositions] - si fourni, réutilise au lieu de recalculer
 */
/** Couleur de la supernova selon la bande : UV bleu-violet, IR rouge ; visible et R suivent le refroidissement */
const SUPERNOVA_BAND_COLORS = { uv: { r: 190, g: 175, b: 255 }, ir: { r: 255, g: 120, b: 90 } }

/**
 * Étoile en supernova, dans la bande affichée : cœur, halo, aigrettes quand elle est très brillante,
 * nébuleuse du rémanent (valeur de jeu, agrandie pour être visible).
 * @param {{ level: number, color: {r,g,b}, nebula: number, band: string }} sn
 */
function drawSupernova(ctx, pos, baseR, sn) {
  const { level, nebula, band } = sn
  const c = SUPERNOVA_BAND_COLORS[band] ?? sn.color
  const rgba = (a) => `rgba(${c.r},${c.g},${c.b},${a})`

  // Nébuleuse du rémanent : coquille irrégulière, plus nette en IR (poussière), absente en UV
  if (nebula > 0 && band !== 'uv') {
    const strength = band === 'ir' ? 1.5 : 1
    const R = 8 + 24 * nebula
    const fill = ctx.createRadialGradient(pos.x, pos.y, R * 0.3, pos.x, pos.y, R * 1.2)
    fill.addColorStop(0, rgba(0))
    fill.addColorStop(0.7, rgba(0.14 * nebula * strength))
    fill.addColorStop(1, rgba(0))
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, R * 1.2, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2
      const r = R * (1 + 0.12 * Math.sin(i * 2.3))
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, r, a0, a0 + Math.PI / 7)
      ctx.strokeStyle = rgba(Math.min(1, (0.3 + 0.12 * Math.sin(i * 1.7)) * nebula * strength))
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  if (level < 0.01) return
  const core = baseR * (1 + 5 * level)
  const halo = core * (2 + 8 * level)
  const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, halo)
  gradient.addColorStop(0, rgba(0.5 * level))
  gradient.addColorStop(1, rgba(0))
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, halo, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  // Aigrettes de diffraction quand la source devient éblouissante
  if (level > 0.35) {
    const len = core * (4 + 10 * level)
    ctx.strokeStyle = rgba(0.6 * level)
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pos.x - len, pos.y)
    ctx.lineTo(pos.x + len, pos.y)
    ctx.moveTo(pos.x, pos.y - len)
    ctx.lineTo(pos.x, pos.y + len)
    ctx.stroke()
  }

  ctx.beginPath()
  ctx.arc(pos.x, pos.y, core, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${Math.min(255, c.r + 20)},${Math.min(255, c.g + 20)},${Math.min(255, c.b + 20)},${Math.min(1, 0.25 + level)})`
  ctx.fill()
}

/**
 * @param {Set<string>|null} [anomalyIds] - Si fourni, seules ces étoiles sont distinguées comme anomalies
 *   (écran 5 de l'onboarding : les destinations du catalogue embarqué)
 */
export function drawStars(ctx, starList, raView, decView, w, h, selectedStar, searchedStarId, projectedPositions, anomalyIds = null) {
  starList.forEach((s) => {
    const pos = projectedPositions
      ? projectedPositions.get(s.id)
      : projectStarInFov(s.ra, s.dec, raView, decView, w, h)
    if (!pos) return

    if (s.opacityTarget !== undefined) {
      s.opacityCurrent += (s.opacityTarget - s.opacityCurrent) * TRANSITION_SPEED
    }

    s.twinkle += s.twinkleSpeed
    const flicker = 0.92 + 0.08 * Math.sin(s.twinkle)
    const mult = s.brightnessMultiplier ?? 1.0
    const opacity = s.opacityCurrent ?? 1.0
    const rawAlpha = s.brightness * mult * flicker * opacity
    const alpha = (s.opacityTarget ?? 0) > 0 ? Math.max(0.35, rawAlpha) : rawAlpha

    const rgb = s.star
      ? resolveStarColor(s.star, s.colorOverride ?? null)
      : { r: 255, g: 255, b: 255 }

    // Supernova : remplace le rendu de l'étoile, quelle que soit sa visibilité habituelle dans la bande
    if (s.supernova) {
      drawSupernova(ctx, pos, s.r, s.supernova)
      return
    }

    const fillStyleMain = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
    const fillStyleHalo = s.r > 1.2 ? `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.08})` : null

    if (anomalyIds ? anomalyIds.has(s.id) : s.isAnomaly) {
      s.anomalyPhase += 0.03
      const pulse = 0.4 + 0.4 * Math.sin(s.anomalyPhase)
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r * 3.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(232,160,32,${pulse * 0.15 * opacity})`
      ctx.fill()
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r * 1.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(232,160,32,${pulse * 0.8 * opacity})`
      ctx.fill()
    } else {
      if (s.r > 1.2) {
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, s.r * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = fillStyleHalo ?? `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.08})`
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = fillStyleMain
      ctx.fill()
    }

    const isCapTarget = s.isCapTarget === true
    const isHighlighted = s === selectedStar || s.id === searchedStarId

    if (isCapTarget) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r + 9, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(232,160,32,0.9)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r + 7, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(232,160,32,0.45)'
      ctx.lineWidth = 2
      ctx.stroke()
    } else if (isHighlighted) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r + 8, 0, Math.PI * 2)
      ctx.strokeStyle = HIGHLIGHT_CYAN_RGBA
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r + 6, 0, Math.PI * 2)
      ctx.strokeStyle = HIGHLIGHT_CYAN_RGBA_SOFT
      ctx.lineWidth = 2
      ctx.stroke()
    } else if (s.visited) {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, s.r + 3, 0, Math.PI * 2)
      ctx.strokeStyle = HIGHLIGHT_VISITED_RGBA
      ctx.lineWidth = 0.5
      ctx.stroke()
    }
  })
}

/** Signaux radio — ancrés aux coordonnées célestes (ra, dec), se déplacent avec le ciel */
export function drawSignals(ctx, activeSignals, raView, decView, w, h) {
  const t = Date.now() * (Math.PI * 2 / 6000)
  activeSignals.forEach((sig) => {
    const ra = sig.ra ?? sig.azimuth ?? 0
    const dec = sig.dec ?? sig.elevation ?? 0
    const pos = projectStarInFov(ra, dec, raView, decView, w, h)
    if (!pos) return
    const phase = (sig.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 100) / 100 * Math.PI * 2
    const signalPulse = 0.5 + 0.5 * Math.sin(t + phase)
    const r = 14 + signalPulse * 6
    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r)
    grad.addColorStop(0, `rgba(168, 85, 247, ${0.35 + signalPulse * 0.25})`)
    grad.addColorStop(0.25, `rgba(139, 92, 246, ${0.2 + signalPulse * 0.15})`)
    grad.addColorStop(0.6, `rgba(124, 58, 237, ${0.08 + signalPulse * 0.06})`)
    grad.addColorStop(1, 'rgba(124, 58, 237, 0)')
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + signalPulse * 0.2})`
    ctx.lineWidth = 1
    ctx.stroke()
  })
}

/** Bordure spectrale (IR, UV, R) */
export function drawSpectralBorder(ctx, band, w, h) {
  if (band === 'visible') return
  const borderConfig =
    band === 'ir' ? { r: 255, g: 130, b: 70 }
    : band === 'uv' ? { r: 90, g: 130, b: 220 }
    : band === 'r' ? { r: 230, g: 150, b: 110 }
    : null
  if (!borderConfig) return

  const headerH = 48
  const instrumentsH = 52
  const inset = 8
  const x = inset
  const y = headerH + inset
  const rw = w - inset * 2
  const rh = h - headerH - instrumentsH - inset * 2
  if (rw <= 0 || rh <= 0) return

  ctx.save()
  ctx.strokeStyle = `rgb(${borderConfig.r}, ${borderConfig.g}, ${borderConfig.b})`
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, rw, rh)
  ctx.restore()
}

