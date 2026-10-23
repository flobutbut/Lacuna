/**
 * Fenêtres d'émission des signaux — LACUNA
 * Un signal à fenêtres n'émet que pendant une partie d'un cycle périodique, mesuré en temps réel
 * depuis une époque commune à tous les joueurs (game_settings.scenario_signal_epoch) : la phase
 * est une fonction pure de l'heure, donc déterministe. Hors fenêtre, le signal reste présent mais inactif.
 */

/**
 * Normalise la fenêtre stockée dans les attributs d'un signal (clés snake_case, époque ISO).
 * @param {{ epoch?: string, cycle_s?: number, offset_s?: number, duration_s?: number }|null|undefined} raw
 * @returns {{ epochMs: number, cycleS: number, offsetS: number, durationS: number }|null} null = toujours actif
 */
export function parseSignalWindow(raw) {
  if (!raw) return null
  const epochMs = Date.parse(raw.epoch)
  const cycleS = Number(raw.cycle_s)
  const durationS = Number(raw.duration_s)
  if (!Number.isFinite(epochMs) || !(cycleS > 0) || !(durationS > 0)) return null
  return { epochMs, cycleS, offsetS: Number(raw.offset_s) || 0, durationS }
}

/**
 * Secondes écoulées depuis l'ouverture du cycle courant (0 ≤ phase < cycleS).
 * @param {{ epochMs: number, cycleS: number, offsetS: number }} win
 * @param {number} nowMs
 */
export function windowPhaseS(win, nowMs) {
  const elapsed = (nowMs - win.epochMs) / 1000 - win.offsetS
  return ((elapsed % win.cycleS) + win.cycleS) % win.cycleS
}

/**
 * La fenêtre est-elle ouverte à l'instant donné ? Sans fenêtre, le signal est toujours actif.
 * @param {ReturnType<typeof parseSignalWindow>} win
 * @param {number} [nowMs]
 */
export function isWindowOpen(win, nowMs = Date.now()) {
  if (!win) return true
  return windowPhaseS(win, nowMs) < win.durationS
}
