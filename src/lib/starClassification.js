/**
 * Classification des types d'étoiles pour la Vue conception.
 *
 * Données disponibles (RPC get_systems_for_conception = stellar_systems uniquement) :
 * - spectral_type : chaîne (ex. G2V, M5V, L7.5, T1, Y4, DA, PSR B1919+21) ou NULL
 * - id, name : identifiant et nom du système
 *
 * On n'a PAS system_objects.type (STAR/PULSAR) dans cette vue, donc les pulsars
 * sont détectés par : spectral_type commençant par PSR/PULSAR/NEUTRON/MAGNETAR,
 * ou id/name commençant par PSR (ex. PSR_B1919 avec spectral_type NULL).
 *
 * Conventions scientifiques :
 * - Pulsars : désignation PSR J/B + coordonnées (PSR B1919+21, etc.)
 * - Naines brunes : L (≈1300–2500 K), T (≈500–1300 K), Y (<500 K) — notation L0–L9, T0–T8, Y0+
 * - Naines blanches : D (sous-types DA, DB, DC, DQ, DZ…)
 * - Séquence principale : O, B, A, F, G, K, M (avec sous-type numérique ex. G2V)
 */

// Lettre de classe spectrale (Morgan-Keenan + L/T/Y naines brunes).
// Conventions : PSR/PULSAR/NEUTRON/MAGNETAR en tête = pulsar ; sinon première lettre O,B,A,F,G,K,M,L,T,Y,D.
const SPECTRAL_CLASS_LETTERS = 'OBAFGKMLTYD'
const RE_SPECTRAL_CLASS = /([OBAFGKMLTYD])/

/**
 * Lettre principale depuis spectral_type (conventions astronomiques).
 * - Pulsars : chaîne commençant par PSR, PULSAR, NEUTRON ou MAGNETAR → 'PULSAR'
 * - Autres : première lettre de classe (O,B,A,F,G,K,M,L,T,Y,D), même avec préfixes (sdT, esdY) ou suffixe (G2V, L7.5, T1, Y4)
 */
export function getSpectralLetter(spectralType) {
  if (!spectralType || typeof spectralType !== 'string') return 'M'
  const upper = spectralType.trim().toUpperCase()
  if (upper.startsWith('PSR') || upper.startsWith('PULSAR') || upper.startsWith('NEUTRON') || upper.startsWith('MAGNETAR')) {
    return 'PULSAR'
  }
  const m = upper.match(RE_SPECTRAL_CLASS)
  return m ? m[1] : 'M'
}

/**
 * Lettre spectrale depuis un objet (ex. system_object) avec type et spectral_type.
 * Si type === 'PULSAR', retourne 'PULSAR' ; sinon délègue à getSpectralLetter(spectral_type).
 */
export function getSpectralLetterFromObject(obj) {
  if (!obj) return 'M'
  if (obj.type === 'PULSAR') return 'PULSAR'
  return getSpectralLetter(obj.spectral_type || '')
}

/** Labels par lettre / type — source unique pour tuile et filtre type */
const STAR_TYPE_LABELS = {
  O: 'Étoile bleue',
  B: 'Étoile bleue-blanche',
  A: 'Étoile blanche',
  F: 'Étoile blanc-jaune',
  G: 'Étoile jaune',
  K: 'Étoile orange',
  M: 'Naine rouge',
  L: 'Naine brune',
  T: 'Naine brune froide',
  Y: 'Naine brune ultra-froide',
  D: 'Naine blanche',
  PULSAR: 'Pulsar',
}

/**
 * Label court et lisible pour un type spectral (tuile, tooltip, etc.).
 * @param {string} spectralType
 * @returns {string}
 */
export function getStarClassLabel(spectralType) {
  const letter = getSpectralLetter(spectralType)
  const label = STAR_TYPE_LABELS[letter] ?? '—'
  return letter === 'PULSAR' ? label : `${label} (${letter})`
}

/**
 * Type pour le filtre (Vue conception) — filtre par type spectral uniquement.
 * PSR = pulsar (spectral_type ou id/name commençant par PSR), sinon lettre spectrale (O…M, L, T, Y, D).
 * @param {{ spectral_type?: string, id?: string, name?: string }} star
 * @returns {string} 'O' | 'B' | … | 'M' | 'L' | 'T' | 'Y' | 'D' | 'PULSAR'
 */
export function getStarTypeForFilter(star) {
  if (!star) return 'M'
  const id = String(star.id ?? '').trim().toUpperCase()
  const name = String(star.name ?? '').trim().toUpperCase()
  if (id.startsWith('PSR') || name.startsWith('PSR ')) return 'PULSAR'
  return getSpectralLetter(star.spectral_type)
}

/** Préfixe des ids de filtre pour éviter toute confusion (ex. 'T' / 'Y' dans le select). */
const TYPE_FILTER_PREFIX = 'type_'

/** Options pour le select filtre (Vue conception) — libellés = types spectraux (lettre ou PSR). */
export const STAR_TYPE_FILTER_OPTIONS = [
  { id: 'all', label: 'Tous types' },
  { id: TYPE_FILTER_PREFIX + 'PULSAR', label: 'PSR' },
  { id: TYPE_FILTER_PREFIX + 'D', label: 'D' },
  { id: TYPE_FILTER_PREFIX + 'O', label: 'O' },
  { id: TYPE_FILTER_PREFIX + 'B', label: 'B' },
  { id: TYPE_FILTER_PREFIX + 'A', label: 'A' },
  { id: TYPE_FILTER_PREFIX + 'F', label: 'F' },
  { id: TYPE_FILTER_PREFIX + 'G', label: 'G' },
  { id: TYPE_FILTER_PREFIX + 'K', label: 'K' },
  { id: TYPE_FILTER_PREFIX + 'M', label: 'M' },
  { id: TYPE_FILTER_PREFIX + 'L', label: 'L' },
  { id: TYPE_FILTER_PREFIX + 'T', label: 'T' },
  { id: TYPE_FILTER_PREFIX + 'Y', label: 'Y' },
]

/**
 * Ramène la valeur du select (type_PULSAR, type_T, …) à la lettre pour comparaison.
 * Accepte aussi l'ancien format (PULSAR, T, Y) pour compat.
 */
export function typeFilterToLetter(typeFilter) {
  if (!typeFilter || typeFilter === 'all') return null
  if (typeof typeFilter === 'string' && typeFilter.startsWith(TYPE_FILTER_PREFIX)) {
    return typeFilter.slice(TYPE_FILTER_PREFIX.length)
  }
  return typeFilter
}

/**
 * Retourne true si l'étoile correspond au filtre type (value: 'all' ou type_PULSAR, type_T, etc.).
 */
export function matchesStarTypeFilter(star, typeFilter) {
  const letter = typeFilterToLetter(typeFilter)
  if (letter === null) return true
  return getStarTypeForFilter(star) === letter
}

/**
 * Formate une distance en années-lumière.
 * @param {number|string|null|undefined} distanceLy
 * @returns {string}
 */
export function formatDistanceLy(distanceLy) {
  const n = typeof distanceLy === 'number' ? distanceLy : Number(distanceLy)
  if (!Number.isFinite(n)) return '—'
  const rounded = n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0)
  return `${rounded} al`
}

