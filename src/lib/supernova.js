/**
 * Supernova de Bételgeuse (SN-001, LACUNA_TRACES_IMMUABLES.md §5) — déroulé en temps réel joueur.
 * T0 est propre à chaque partie (ships.supernova_t0). Ordre réel des phases, durées raccourcies :
 * bouffée de neutrinos (10 s), silence (20 min), sortie du choc (2 min), montée (jusqu'à T0 + 2 h),
 * déclin (jusqu'à T0 + 7 jours), rémanent.
 */

/** Étoile concernée (identifiant stellar_systems) */
export const SUPERNOVA_STAR_ID = 'betelgeuse'

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const SUPERNOVA_PHASES = {
  BURST_END: 10 * 1000,
  BREAKOUT_START: 20 * MIN,
  RISE_START: 22 * MIN,
  PEAK: 2 * HOUR,
  DECLINE_END: 7 * DAY,
}

/** Éclat relatif (0–1, 1 = maximum) : sortie du choc, palier de départ de la montée, rémanent */
const BREAKOUT_LEVEL = 0.5
const RISE_FROM = 0.25
const DECLINE_TO = 0.08
const REMNANT_LEVEL = 0.04

/**
 * État de la supernova à l'instant donné.
 * level = éclat relatif qui remplace le rendu de l'étoile ; null tant que la lumière n'est pas arrivée.
 * @param {string|number|null} t0 - Date de la bouffée (ISO ou ms), null = pas d'événement pour cette partie
 * @param {number} [nowMs]
 * @returns {{ phase: 'none'|'before'|'burst'|'silence'|'breakout'|'rise'|'decline'|'remnant', level: number|null }}
 */
export function supernovaState(t0, nowMs = Date.now()) {
  const t0Ms = typeof t0 === 'number' ? t0 : Date.parse(t0)
  if (t0 == null || !Number.isFinite(t0Ms)) return { phase: 'none', level: null }
  const t = nowMs - t0Ms
  const P = SUPERNOVA_PHASES
  if (t < 0) return { phase: 'before', level: null }
  if (t < P.BURST_END) return { phase: 'burst', level: null }
  if (t < P.BREAKOUT_START) return { phase: 'silence', level: null }
  if (t < P.RISE_START) {
    // Éclair bref : montée en 10 % de la phase, puis retombée vers le palier de départ de la montée
    const u = (t - P.BREAKOUT_START) / (P.RISE_START - P.BREAKOUT_START)
    const level = u < 0.1 ? (u / 0.1) * BREAKOUT_LEVEL : BREAKOUT_LEVEL - ((u - 0.1) / 0.9) * (BREAKOUT_LEVEL - RISE_FROM)
    return { phase: 'breakout', level }
  }
  if (t < P.PEAK) {
    const u = (t - P.RISE_START) / (P.PEAK - P.RISE_START)
    return { phase: 'rise', level: RISE_FROM + (1 - RISE_FROM) * (1 - (1 - u) * (1 - u)) }
  }
  if (t < P.DECLINE_END) {
    // Décroissance exponentielle : ~1 % de l'écart restant à la fin du déclin
    const u = (t - P.PEAK) / (P.DECLINE_END - P.PEAK)
    return { phase: 'decline', level: DECLINE_TO + (1 - DECLINE_TO) * Math.exp(-5 * u) }
  }
  return { phase: 'remnant', level: REMNANT_LEVEL }
}
