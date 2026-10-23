/**
 * Sources du ciel de départ — LACUNA (LACUNA_UI.md §2, « Radar — sources du ciel de départ »)
 * Trois des signaux donnés au départ ont une source qui émet quand le Radar la vise. L'émission suit la source,
 * pas l'entrée de la liste : elle continue après l'envoi du signal au Laboratoire ou son expiration.
 * Les autres signaux de départ (WOW-like, sursaut gamma, sursaut gravitationnel) restent muets.
 * Flux et niveaux : valeurs provisoires.
 */

/** PSR B1919+21 (PSR-001) : une impulsion toutes les 1,337 s en bande L, comme un pulsar du catalogue */
export const START_PULSARS = [
  {
    id: 'start-psr-b1919-21',
    sourceType: 'PULSAR',
    azimuth: 290,
    elevation: 22,
    band: 'L',
    frequencyHz: 1.42e9,
    pulsePeriodS: 1.337,
    fluxRelative: 0.1,
  },
]

/** Niveau du rémanent de SN-001 une fois installé : repris pour les sources continues */
const REMNANT_RADIO_LEVEL = 0.85
const HOUR_MS = 60 * 60 * 1000

/**
 * Sources continues : bruit large bande dans une seule bande.
 * decayMs : décroissance linéaire depuis la création de la partie, puis plus rien.
 */
export const START_CONTINUUM = [
  { id: 'start-synchrotron-408', ra: 89, dec: -5, band: 'P', level: REMNANT_RADIO_LEVEL },
  { id: 'start-sn-2341-k452', ra: 290, dec: 45, band: 'L', level: REMNANT_RADIO_LEVEL, decayMs: HOUR_MS },
]

/**
 * Niveau (0–1) d'une source continue à nowMs.
 * @param {{ level: number, decayMs?: number }} source
 * @param {number|null} gameStartMs - Création de la partie (null = inconnue : pas de source décroissante)
 * @param {number} [nowMs]
 */
export function continuumLevel(source, gameStartMs, nowMs = Date.now()) {
  if (!source.decayMs) return source.level
  if (gameStartMs == null || !Number.isFinite(gameStartMs)) return 0
  const u = (nowMs - gameStartMs) / source.decayMs
  if (u < 0 || u >= 1) return 0
  return source.level * (1 - u)
}
