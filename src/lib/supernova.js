/**
 * Supernova de Bételgeuse (SN-001, LACUNA_TRACES_IMMUABLES.md §5) — déroulé en temps réel joueur.
 * T0 (la bouffée) est propre à chaque partie (ships.supernova_t0). Ordre réel des phases, durées raccourcies :
 * montée des neutrinos de pré-supernova (5 min avant T0), bouffée de neutrinos (10 s), silence (6 min), sortie du choc (2 min), montée (jusqu'à T0 + 2 h),
 * déclin (jusqu'à T0 + 7 jours), rémanent.
 *
 * Chaque bande raconte une partie de l'explosion (ancrages : SN 1987A, physique des supernovas
 * à effondrement de cœur) :
 *   UV      — l'éclair de la sortie du choc, puis un déclin rapide (refroidissement) ;
 *   visible — la montée vers le maximum ; couleur du blanc bleuté vers le jaune puis l'orangé ;
 *   IR      — plus fort en fin de déclin (poussière qui se forme, écho sur la poussière environnante) ;
 *   radio   — émission synchrotron du rémanent, qui monte pendant le déclin puis reste (Radar).
 * Le rémanent visible (petite nébuleuse) est une valeur de jeu : à ~550 al, il ne grandirait réellement
 * que de quelques secondes d'arc par an.
 */

/** Étoile concernée (identifiant stellar_systems) et sa direction vue de Sol (catalogue, J2000) */
export const SUPERNOVA_STAR_ID = 'betelgeuse'
export const SUPERNOVA_DIRECTION = { ra: 88.793, dec: 7.407 }

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** Montée des neutrinos de pré-supernova (combustion du silicium) : commence 5 minutes avant la bouffée */
export const PRE_SUPERNOVA_LEAD_MS = 5 * 60 * 1000

export const SUPERNOVA_PHASES = {
  BURST_END: 10 * 1000,
  BREAKOUT_START: 6 * MIN,
  RISE_START: 8 * MIN,
  PEAK: 2 * HOUR,
  DECLINE_END: 7 * DAY,
}

/** Éclat visible relatif (0–1, 1 = maximum) : sortie du choc, palier de départ de la montée, fin du déclin, rémanent */
const BREAKOUT_LEVEL = 0.5
const RISE_FROM = 0.25
const DECLINE_TO = 0.1
const REMNANT_LEVEL = 0.06

/** Couleurs du visible : enveloppe chaude au maximum, puis refroidissement */
const COLOR_HOT = { r: 225, g: 235, b: 255 }
const COLOR_WARM = { r: 255, g: 225, b: 160 }
const COLOR_COOL = { r: 255, g: 165, b: 105 }

function mix(a, b, f) {
  return { r: Math.round(a.r + (b.r - a.r) * f), g: Math.round(a.g + (b.g - a.g) * f), b: Math.round(a.b + (b.b - a.b) * f) }
}

/**
 * Phase et éclat visible.
 * level = éclat visible relatif qui remplace le rendu de l'étoile ; null tant que la lumière n'est pas arrivée.
 * @param {string|number|null} t0 - Date de la bouffée (ISO ou ms), null = pas d'événement pour cette partie
 * @param {number} [nowMs]
 * @returns {{ phase: 'none'|'before'|'precursor'|'burst'|'silence'|'breakout'|'rise'|'decline'|'remnant', level: number|null, u: number }}
 */
export function supernovaState(t0, nowMs = Date.now()) {
  const t0Ms = typeof t0 === 'number' ? t0 : Date.parse(t0)
  if (t0 == null || !Number.isFinite(t0Ms)) return { phase: 'none', level: null, u: 0 }
  const t = nowMs - t0Ms
  const P = SUPERNOVA_PHASES
  if (t < -PRE_SUPERNOVA_LEAD_MS) return { phase: 'before', level: null, u: 0 }
  if (t < 0) return { phase: 'precursor', level: null, u: 1 + t / PRE_SUPERNOVA_LEAD_MS }
  if (t < P.BURST_END) return { phase: 'burst', level: null, u: t / P.BURST_END }
  if (t < P.BREAKOUT_START) return { phase: 'silence', level: null, u: 0 }
  if (t < P.RISE_START) {
    // Éclair bref : montée en 10 % de la phase, puis retombée vers le palier de départ de la montée
    const u = (t - P.BREAKOUT_START) / (P.RISE_START - P.BREAKOUT_START)
    const level = u < 0.1 ? (u / 0.1) * BREAKOUT_LEVEL : BREAKOUT_LEVEL - ((u - 0.1) / 0.9) * (BREAKOUT_LEVEL - RISE_FROM)
    return { phase: 'breakout', level, u }
  }
  if (t < P.PEAK) {
    const u = (t - P.RISE_START) / (P.PEAK - P.RISE_START)
    return { phase: 'rise', level: RISE_FROM + (1 - RISE_FROM) * (1 - (1 - u) * (1 - u)), u }
  }
  if (t < P.DECLINE_END) {
    // Décroissance exponentielle douce : ~5 % de l'écart restant à la fin du déclin
    const u = (t - P.PEAK) / (P.DECLINE_END - P.PEAK)
    return { phase: 'decline', level: DECLINE_TO + (1 - DECLINE_TO) * Math.exp(-3 * u), u }
  }
  return { phase: 'remnant', level: REMNANT_LEVEL, u: 1 }
}

/**
 * Éclat par bande, couleur du visible, aigrettes et nébuleuse du rémanent.
 * Tous les éclats sont relatifs (0–1). null tant que la lumière n'est pas arrivée.
 * @param {string|number|null} t0
 * @param {number} [nowMs]
 * @returns {null | {
 *   phase: string, visible: number, r: number, uv: number, ir: number, radio: number,
 *   color: { r: number, g: number, b: number }, nebula: number
 * }}
 */
export function supernovaBands(t0, nowMs = Date.now()) {
  const { phase, level, u } = supernovaState(t0, nowMs)
  if (level == null) return null
  let uv = 0
  let ir = 0.2 * level
  let radio = 0
  let color = COLOR_HOT
  let nebula = 0
  switch (phase) {
    case 'breakout':
      // L'éclair de sortie du choc culmine en UV
      uv = u < 0.1 ? u / 0.1 : 1 - 0.7 * ((u - 0.1) / 0.9)
      break
    case 'rise':
      uv = 0.3 - 0.15 * u
      break
    case 'decline':
      uv = 0.15 * Math.exp(-10 * u)
      ir = 0.2 * level + 0.6 * Math.exp(-(((u - 0.55) / 0.25) ** 2))
      radio = 1 - Math.exp(-3 * u)
      color = u < 0.3 ? mix(COLOR_HOT, COLOR_WARM, u / 0.3) : mix(COLOR_WARM, COLOR_COOL, (u - 0.3) / 0.7)
      nebula = u < 0.25 ? 0 : Math.min(1, (u - 0.25) / 0.75)
      break
    case 'remnant':
      ir = 0.3
      radio = 0.85
      color = COLOR_COOL
      nebula = 1
      break
  }
  return { phase, visible: level, r: Math.min(1, level * 1.1), uv, ir, radio, color, nebula }
}
