/**
 * Onboarding — écran 5, le premier choix (LACUNA_LORE.md §3 et §5).
 * Les neuf anomalies-destinations du catalogue embarqué ; les trois autres (WOW!, Oumuamua, Bennu)
 * sont des traces embarquées sans système où se rendre.
 */

/** Systèmes des anomalies 4 à 12 du catalogue (identifiants stellar_systems) */
export const CATALOGUE_SYSTEM_IDS = new Set([
  'PROXIMA',
  'barnards-star',
  'ROSS128',
  'ran',
  'TAU_CETI',
  'gl-gl-667c',
  'hd-40307',
  'kic-8462852',
  'PSR_B1919',
])

/**
 * Le premier cap n'est pas encore fixé : l'écran 5 reste affiché.
 * @param {{ voyage?: number, travel_state?: string }|null} ship
 */
export function isFirstChoicePending(ship) {
  return !!ship && (ship.voyage ?? 1) <= 1 && ship.travel_state !== 'IN_TRANSIT'
}
