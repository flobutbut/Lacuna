/**
 * Libellés des graphiques par instrument du Laboratoire.
 * Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md
 */
export const GRAPH_NAMES = {
  'analyseur-spectral': 'spectrogramme',
  'analyseur-structure-temporelle': '',
  'analyseur-polarisation': 'ellipse de polarisation',
  'analyseur-spectre-energetique': 'spectre énergétique',
  'analyseur-gravimetrique': 'modèle sources + résidus',
  'spectro-stellaire': 'spectre + courbe de lumière',
  'analyseur-orbital': 'diagramme orbital',
  'spectro-atmo': 'profil moléculaire',
  'analyseur-vol': 'cartes de densité',
  'scanner-morpho': 'modèle surface + thermique',
  'magnetometre': 'carte champ + profil',
}

/**
 * @param {string} instrumentId
 * @returns {string} Libellé du graphique ou "données" par défaut
 */
export function getGraphName(instrumentId) {
  return GRAPH_NAMES[instrumentId] ?? 'données'
}

/** Nombre minimal de rapports d'analyse pour afficher une conclusion sur un signal */
export const MIN_REPORTS_FOR_CONCLUSION = 2

/**
 * Conclusion d'analyse à partir de l'observation (signal) et du nombre de rapports.
 * @param {{ type?: string, structure?: string, support?: string }|null} obs
 * @param {number} reportCount
 * @returns {string|null} Texte de conclusion ou null
 */
export function getAnalysisConclusion(obs, reportCount) {
  if (!obs || reportCount < MIN_REPORTS_FOR_CONCLUSION) return null
  if (obs.type !== 'SIGNAL') return null
  const struct = (obs.structure ?? '').toLowerCase()
  const support = obs.support ?? ''
  if (/sursaut|burst/.test(struct)) {
    if (support === 'GAMMA_X') return 'Probablement un sursaut gamma'
    if (support === 'EM_RADIO') return 'Probablement un sursaut radio (FRB)'
    if (support === 'GRAVITATIONNEL') return 'Probablement une onde gravitationnelle'
  }
  if (/pulsé régulier|pulse regulier/.test(struct) && support === 'EM_RADIO') {
    return 'Probablement un pulsar'
  }
  if (/continu décroissant|decroissant/.test(struct) && support === 'EM_RADIO') {
    return 'Probablement une émission post-supernova'
  }
  if (/^continu$/.test(struct) && support === 'EM_RADIO') {
    return 'Probablement une émission synchrotron'
  }
  if (/non uniforme/.test(struct) && support === 'EM_RADIO') {
    return 'Signal ponctuel — origine non identifiée'
  }
  return null
}
