/**
 * Doutes à lever — LACUNA
 * Un doute est un écart resté à l'état d'ombre : un instrument l'a deviné, aucun rapport ne l'a mesuré,
 * faute d'un niveau d'observation suffisant. C'est la raison de voyager (LACUNA_VERDICT.md §4.7, §6.1).
 */
import { NIVEAU_ORDER, NIVEAU_LABELS } from '@/constants/lab'
import { getReportDeviations } from '@/lib/deviations'
import { getSystemXyz } from '@/lib/stellarCoordinates'

/** Clé de niveau d'une observation (son libellé côté client → PASSIF, SYSTEME…) */
export function getObsNiveauKey(obs) {
  return Object.keys(NIVEAU_LABELS).find((k) => NIVEAU_LABELS[k] === obs?.niveau) || 'PASSIF'
}

/**
 * Niveau effectif (NIVEAU_ORDER) : un corps du système où se trouve le vaisseau est observé
 * au moins depuis l'orbite proche.
 */
export function getEffectiveNiveau(obs, currentSystemId) {
  const base = NIVEAU_ORDER[getObsNiveauKey(obs)] ?? 0
  const inSystem = obs?.system_id && currentSystemId && obs.system_id === currentSystemId
  if (inSystem && obs.type !== 'SIGNAL') return Math.max(base, NIVEAU_ORDER.ORBITE)
  return base
}

/** Écarts d'un rapport ; recalculés depuis l'objet pour les rapports antérieurs à lab_reports.deviations */
export function getDeviationsOf(obs, report, niveau) {
  if (Array.isArray(report.deviations)) return report.deviations
  return getReportDeviations(obs, report.instrumentId, { fiability: report.fiability, niveau })
}

/**
 * Doutes encore ouverts d'une observation : ombres qu'aucun rapport n'a mesurées.
 * @param {object} obs
 * @param {Array<object>} reports - Rapports de l'observation
 * @param {number} niveau - Niveau effectif actuel (getEffectiveNiveau)
 * @returns {Array<{ id: string, family: string, requiresNiveau: string, instrumentIds: string[], reachable: boolean }>}
 *   reachable : le niveau actuel suffit ; il reste à relancer un instrument.
 */
export function getOpenDoubts(obs, reports, niveau) {
  const measured = new Set()
  const shadows = new Map()
  for (const r of reports) {
    for (const d of getDeviationsOf(obs, r, niveau)) {
      if (!d.requiresNiveau) {
        measured.add(d.id)
        continue
      }
      const prev = shadows.get(d.id)
      if (prev) {
        if (!prev.instrumentIds.includes(r.instrumentId)) prev.instrumentIds.push(r.instrumentId)
        if (NIVEAU_ORDER[d.requiresNiveau] < NIVEAU_ORDER[prev.requiresNiveau]) prev.requiresNiveau = d.requiresNiveau
      } else {
        shadows.set(d.id, { id: d.id, family: d.family, requiresNiveau: d.requiresNiveau, instrumentIds: [r.instrumentId] })
      }
    }
  }
  return [...shadows.values()]
    .filter((d) => !measured.has(d.id))
    .map((d) => ({ ...d, reachable: niveau >= NIVEAU_ORDER[d.requiresNiveau] }))
}

/**
 * Un instrument déjà utilisé peut être relancé quand le niveau atteint permet de mesurer
 * un doute qu'il avait deviné.
 */
export function isInstrumentRelaunchable(instrumentId, doubts) {
  return doubts.some((d) => d.reachable && d.instrumentIds.includes(instrumentId))
}

/** Distance (al) entre deux systèmes de stellar_systems */
export function distanceBetweenSystems(from, to) {
  if (!from || !to) return null
  const a = getSystemXyz(from)
  const b = getSystemXyz(to)
  return Math.hypot((b.x ?? 0) - (a.x ?? 0), (b.y ?? 0) - (a.y ?? 0), (b.z ?? 0) - (a.z ?? 0))
}
