/**
 * Aléatoire déterministe — LACUNA
 * Générateur pseudo-aléatoire à graine (mulberry32), partagé par les données Laboratoire et Radar.
 */

/**
 * Crée un générateur pseudo-aléatoire reproductible : même graine → même suite de valeurs.
 * @param {number} seed - Graine entière
 * @returns {() => number} Fonction renvoyant un nombre dans [0, 1)
 */
export function seededRandom(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
