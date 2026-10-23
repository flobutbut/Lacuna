/**
 * Construction du payload d'observation — LACUNA
 * Partagé entre ObservatoirePanel, PageCarte et SignalModal (alignement nom / niveau).
 */

import { OBJECT_TYPE_LABELS } from '@/constants/objectTypes'
import { formatSignalObservationName } from '@/lib/formatUtils'

/**
 * Nom d'affichage d'un corps : name prioritaire, sinon système + désignation, sinon système ou '—'.
 * @param {object} body - Corps (name, designation)
 * @param {string} systemName - Nom du système (ex. étoile sélectionnée)
 * @returns {string}
 */
export function getBodyDisplayName(body, systemName) {
  const sysName = systemName ?? ''
  const fallback = body?.designation ? `${sysName} ${body.designation}` : sysName || '—'
  return body?.name || fallback
}

/**
 * Corps synthétique pour l'étoile seule (système sans objets en base).
 * @param {object} star - Étoile (name, isAnomaly)
 * @returns {Array<{ id: string, name: string, type: string, anomaly: number }>}
 */
export function getStarOnlyBody(star) {
  if (!star) return []
  return [{ id: 'star', name: star.name, type: 'ETOILE', anomaly: star.isAnomaly ? 78 : 8 }]
}

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

/**
 * Payload observation pour obsStore.addObservation à partir d'un signal (niveau = PASSIF).
 * @param {object} s - Signal (support, structure, distanceEst, receivedAt, durationSec, anomalous, polarization, pulsePeriodS)
 * @param {{ PASSIF: string }} niveaux - obsStore.NIVEAUX
 * @returns {object|null}
 */
export function signalToObsPayload(s, niveaux) {
  if (!s) return null
  const name = formatSignalObservationName(s)
  return {
    name,
    type: 'SIGNAL',
    support: s.support ?? 'EM_RADIO',
    structure: s.structure ?? 'non uniforme',
    system: '—',
    system_id: null,
    distance: s.distanceEst ?? '—',
    coords: '—',
    date: s.receivedAt,
    niveau: niveaux.PASSIF,
    durationSec: s.durationSec ?? 72,
    anomalous: s.anomalous ?? false,
    // Mesures du signal que les instruments du Laboratoire reprennent telles quelles
    attributes: {
      ...(s.polarization ? { polarization: s.polarization } : {}),
      ...(s.pulsePeriodS ? { pulse_period_s: s.pulsePeriodS } : {}),
    },
  }
}
