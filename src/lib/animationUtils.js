/**
 * Utilitaires d'animation / easing — LACUNA
 */

/**
 * Ease-out cubique : progression 0→1 lissée en fin de course.
 * @param {number} t - Progression linéaire 0–1
 * @returns {number}
 */
export function orbitEase(t) {
  return 1 - (1 - t) ** 3
}
