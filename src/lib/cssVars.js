/**
 * Lecture des tokens CSS — LACUNA
 * Permet aux rendus canvas / Three.js d'utiliser les couleurs du design system (tokens.css).
 */

/**
 * Valeur d'une variable CSS définie sur :root.
 * @param {string} name - Nom de la variable (ex. '--color-cyan')
 * @param {string} [fallback='#0a0a0a'] - Valeur si la variable est absente
 * @returns {string}
 */
export function getCssVar(name, fallback = '#0a0a0a') {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/**
 * Police canvas (ctx.font) depuis les tokens : le canvas ne résout pas var().
 * @param {string} [sizeToken='--text-2xs'] - Token de taille (ex. '--text-xs')
 * @returns {string} ex. "10px 'Share Tech Mono', monospace"
 */
export function canvasFont(sizeToken = '--text-2xs') {
  return `${getCssVar(sizeToken, '10px')} ${getCssVar('--font-mono', 'monospace')}`
}
