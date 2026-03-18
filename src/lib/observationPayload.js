/**
 * Construction du payload d'observation — LACUNA
 * Partagé entre ObservatoirePanel et PageCarte (alignement nom / niveau).
 */

import { OBJECT_TYPE_LABELS } from '@/constants/objectTypes'

/**
 * Construit le payload pour obsStore.addObservation.
 * @param {object} body - Corps (type, has_atmosphere)
 * @param {{ systemName: string, systemId: string|null, distance: string|number, displayName: string }} context - Contexte système + nom d'affichage du corps
 * @param {{ ORBITE: string, SYSTEME: string }} niveaux - obsStore.NIVEAUX
 * @returns {{ name, type, system, system_id, distance, coords, niveau }}
 */
export function buildObservationPayload(body, context, niveaux) {
  const { systemName, systemId, distance, displayName } = context
  const name = `${displayName} · ${OBJECT_TYPE_LABELS[body.type] ?? 'Corps planétaire'}`
  const needsOrbit =
    body.type === 'ATMOSPHERE' ||
    (body.type === 'PLANETE' && body.has_atmosphere !== false)
  return {
    name,
    type: body.type,
    system: systemName ?? '—',
    system_id: systemId ?? null,
    distance: distance ?? '—',
    coords: '—',
    niveau: needsOrbit ? niveaux.ORBITE : niveaux.SYSTEME,
  }
}
