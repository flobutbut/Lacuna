/**
 * Constantes astronomiques — références Terre/Soleil
 * Données DB : M⊕, R⊕, UA, jours. Ce module centralise les facteurs de conversion.
 * Réf. IAU, NASA, CODATA
 * @module astroConstants
 */

/** Rayon terrestre (km) — R⊕ */
export const EARTH_RADIUS_KM = 6371

/** Masse terrestre (kg) — M⊕ */
export const EARTH_MASS_KG = 5.9722e24

/** Unité astronomique (km) — distance Terre–Soleil */
export const AU_KM = 149_597_870.7

/** Rayon solaire en rayons terrestres — R☉/R⊕ */
export const SUN_RADIUS_EARTH = 109.2

/** Masse solaire (kg) — M☉ */
export const SUN_MASS_KG = 1.9885e30

/** Période orbitale terrestre (jours) — année sidérale */
export const EARTH_ORBITAL_PERIOD_DAYS = 365.25
