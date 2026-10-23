/**
 * Constantes signaux — LACUNA
 * Libellés des supports de signal (court pour badges, long pour listes/détail).
 */

/** Libellés courts — badges, listes compactes (ex. SideLeft) */
export const SIGNAL_SUPPORT_LABELS_SHORT = {
  GRAVITATIONNEL: 'Grav',
  GAMMA_X: 'γ/X',
  EM_RADIO: 'EM',
  NEUTRINO: 'ν',
}

/** Libellés longs — listes et détail Laboratoire */
export const SIGNAL_SUPPORT_LABELS_LONG = {
  EM_RADIO: 'EM radio',
  GAMMA_X: 'Gamma/X',
  GRAVITATIONNEL: 'Gravitationnel',
  NEUTRINO: 'Neutrinos',
}

/**
 * Libellé d'affichage pour un support de signal.
 * @param {string} support - Clé (EM_RADIO, GAMMA_X, GRAVITATIONNEL, NEUTRINO)
 * @param {'short'|'long'} [variant='short'] - Court (badge) ou long (détail)
 * @returns {string}
 */
export function getSupportLabel(support, variant = 'short') {
  const labels = variant === 'long' ? SIGNAL_SUPPORT_LABELS_LONG : SIGNAL_SUPPORT_LABELS_SHORT
  const fallback = variant === 'long' ? 'EM radio' : '—'
  return labels[support] ?? support ?? fallback
}
