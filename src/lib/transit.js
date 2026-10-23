/**
 * Calcul transit — GDD § Voyage
 * - Durées simulées (physiques) : accélération, inertie, freinage — en années
 * - Durée joueur : compression non-linéaire (table réf. GDD)
 * - Carburant : proportionnel à durée physique (Tsiolkovsky simplifié)
 * - Génération : t_physique / 25 ans
 */

const REF = [
  { d: 4.24, tPhys: 88, tJoueurH: 1 },
  { d: 11.9, tPhys: 248, tJoueurH: 2.4 },
  { d: 22, tPhys: 458, tJoueurH: 3.9 },
  { d: 1280, tPhys: 26600, tJoueurH: 40.8 },
  { d: 26000, tPhys: 541000, tJoueurH: 336 },
  { d: 100000, tPhys: 2083333, tJoueurH: 2160 },
]

export const ANNEES_PAR_GENERATION = 25

function interpPhysique(d) {
  if (d <= REF[0].d) return (d / REF[0].d) * REF[0].tPhys
  for (let i = 0; i < REF.length - 1; i++) {
    if (d <= REF[i + 1].d) {
      const t = (d - REF[i].d) / (REF[i + 1].d - REF[i].d)
      return REF[i].tPhys + t * (REF[i + 1].tPhys - REF[i].tPhys)
    }
  }
  return REF[REF.length - 1].tPhys * Math.pow(d / REF[REF.length - 1].d, 0.95)
}

function interpJoueurH(d) {
  if (d <= REF[0].d) return (d / REF[0].d) * REF[0].tJoueurH
  for (let i = 0; i < REF.length - 1; i++) {
    if (d <= REF[i + 1].d) {
      const t = (d - REF[i].d) / (REF[i + 1].d - REF[i].d)
      return REF[i].tJoueurH + t * (REF[i + 1].tJoueurH - REF[i].tJoueurH)
    }
  }
  return REF[REF.length - 1].tJoueurH * Math.pow(d / REF[REF.length - 1].d, 0.8)
}

export function computeTransit(distanceAl) {
  const d = parseFloat(distanceAl) || 1
  const tPhysTotal = interpPhysique(d)

  const accelRatio = d < 15 ? 0.4 : 0.12
  const inertieRatio = d < 15 ? 0.2 : 0.76
  const freinageRatio = d < 15 ? 0.4 : 0.12

  const tAccel = tPhysTotal * accelRatio
  const tInertie = tPhysTotal * inertieRatio
  const tFreinage = tPhysTotal * freinageRatio

  const tJoueurH = interpJoueurH(d)
  const tJoueurSec = Math.round(tJoueurH * 3600)

  const carburantPct = Math.min(45, Math.max(2, Math.round(2 + tPhysTotal * 0.00002)))

  // Entier inférieur, comme dans la vue de confirmation du départ (LACUNA_TRANSIT.md §4)
  const generations = Math.floor(tPhysTotal / ANNEES_PAR_GENERATION)

  return {
    tAccel,
    tInertie,
    tFreinage,
    tPhysTotal,
    tJoueurSec,
    carburantPct,
    generations,
  }
}

export function formatDureeSimulee(annees) {
  if (annees >= 1000) return `${(annees / 1000).toFixed(1)} ka`
  if (annees >= 100) return `${Math.round(annees)} ans`
  if (annees >= 10) return `${annees.toFixed(1)} ans`
  if (annees >= 1) return `${annees.toFixed(1)} an`
  return `${Math.round(annees * 12)} mois`
}

export function formatDuration(sec) {
  if (sec >= 86400) return `${(sec / 86400).toFixed(1)} j`
  if (sec >= 3600) {
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
  }
  if (sec >= 60) return `${Math.floor(sec / 60)} min`
  return `${sec} s`
}
