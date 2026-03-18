/**
 * Constantes d'affichage des étoiles — design system
 * Aligné avec --color-cyan (#00b4c8)
 */

/** Couleur cyan highlight — hex pour Three.js */
export const HIGHLIGHT_CYAN_HEX = 0x00b4c8

/** Couleur verte design system (--color-green #40a870) — hex pour Three.js */
export const COLOR_GREEN_HEX = 0x40a870

/** Vert lumineux design system (--color-green-bright #5dd99a) — hex pour Three.js (lignes transits) */
export const COLOR_GREEN_BRIGHT_HEX = 0x5dd99a

/** Couleur cyan highlight — rgba pour Canvas 2D */
export const HIGHLIGHT_CYAN_RGBA = 'rgba(0,180,200,0.9)'

/** Anneau highlight secondaire (léger) */
export const HIGHLIGHT_CYAN_RGBA_SOFT = 'rgba(0,180,200,0.25)'

/** Anneau visited (discret) */
export const HIGHLIGHT_VISITED_RGBA = 'rgba(0,180,200,0.3)'

/** Multiplicateur de taille pour highlight 3D (point surélevé) */
export const HIGHLIGHT_3D_SIZE_MULT = 4

/** Taille de base des sprites étoiles 3D (world units, sizeAttenuation) */
export const STAR_SPRITE_BASE_SIZE = 1.2

/** Taille minimale des sprites en pixels (évite que les étoiles disparaissent au zoom) */
export const STAR_SPRITE_MIN_PIXELS = 2
