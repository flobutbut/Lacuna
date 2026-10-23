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
  'analyseur-neutrinos': '',
}

/**
 * @param {string} instrumentId
 * @returns {string} Libellé du graphique ou "données" par défaut
 */
export function getGraphName(instrumentId) {
  return GRAPH_NAMES[instrumentId] ?? 'données'
}

/** Nombre minimal de rapports d'analyse pour afficher le modèle de référence d'un signal */
export const MIN_REPORTS_FOR_CONCLUSION = 2

/**
 * Modèle de référence d'un signal : le phénomène naturel connu par rapport auquel les écarts se lisent
 * (LACUNA_VERDICT.md §4.4). Il ne conclut pas : il dit seulement à quoi l'on compare.
 * @param {{ type?: string, structure?: string, support?: string }|null} obs
 * @param {number} reportCount
 * @returns {string|null} Nom du modèle ou null
 */
export function getAnalysisConclusion(obs, reportCount) {
  if (!obs || reportCount < MIN_REPORTS_FOR_CONCLUSION) return null
  if (obs.type !== 'SIGNAL') return null
  const struct = (obs.structure ?? '').toLowerCase()
  const support = obs.support ?? ''
  if (/sursaut|burst/.test(struct)) {
    if (support === 'GAMMA_X') return 'sursaut gamma'
    if (support === 'EM_RADIO') return 'sursaut radio rapide (FRB)'
    if (support === 'GRAVITATIONNEL') return 'coalescence d’objets compacts'
  }
  if (/pulsé régulier|pulse regulier/.test(struct) && support === 'EM_RADIO') {
    return 'pulsar'
  }
  if (/continu décroissant|decroissant/.test(struct) && support === 'EM_RADIO') {
    return 'rémanent de supernova'
  }
  if (/^continu$/.test(struct) && support === 'EM_RADIO') {
    return 'émission synchrotron'
  }
  if (/non uniforme/.test(struct) && support === 'EM_RADIO') {
    return 'aucun (signal ponctuel)'
  }
  return null
}

/**
 * Instruments du Laboratoire — Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md
 * signalSupports = pour observations SIGNAL (support du signal)
 * niveau + objectTypes = pour observations actives (corps, étoile, etc.)
 */
export const LAB_INSTRUMENTS = [
  { id: 'analyseur-spectral', name: 'Analyseur spectral', signalSupports: ['EM_RADIO'], delay: 'Court' },
  { id: 'analyseur-structure-temporelle', name: 'Analyseur de structure temporelle', signalSupports: ['EM_RADIO', 'GAMMA_X', 'GRAVITATIONNEL', 'NEUTRINO'], delay: 'Court' },
  { id: 'analyseur-polarisation', name: 'Analyseur de polarisation', signalSupports: ['EM_RADIO'], delay: 'Moyen' },
  { id: 'analyseur-spectre-energetique', name: 'Analyseur de spectre énergétique', signalSupports: ['GAMMA_X'], delay: 'Moyen' },
  { id: 'analyseur-neutrinos', name: 'Analyseur de neutrinos', signalSupports: ['NEUTRINO'], delay: 'Moyen' },
  { id: 'analyseur-gravimetrique', name: 'Analyseur gravimétrique', signalSupports: ['GRAVITATIONNEL'], niveau: 'SYSTEME', objectTypes: ['ETOILE', 'PLANETE', 'MINEUR', 'OBJET'], delay: 'Long' },
  { id: 'spectro-stellaire', name: 'Spectromètre stellaire', niveau: 'SYSTEME', objectTypes: ['ETOILE', 'PLANETE'], delay: 'Moyen' },
  { id: 'analyseur-orbital', name: 'Analyseur orbital', niveau: 'SYSTEME', objectTypes: ['ETOILE', 'PLANETE', 'MINEUR', 'OBJET'], delay: 'Long' },
  { id: 'spectro-atmo', name: 'Spectromètre atmosphérique', niveau: 'ORBITE', objectTypes: ['PLANETE', 'ATMOSPHERE'], delay: 'Moyen' },
  { id: 'analyseur-vol', name: 'Analyseur volumétrique', niveau: 'ORBITE', objectTypes: ['ETOILE', 'PLANETE', 'MINEUR', 'OBJET'], delay: 'Long' },
  { id: 'scanner-morpho', name: 'Scanner morphologique', niveau: 'ORBITE', objectTypes: ['PLANETE', 'MINEUR', 'OBJET'], delay: 'Moyen' },
  { id: 'magnetometre', name: 'Magnétomètre', niveau: 'ORBITE', objectTypes: ['PLANETE', 'MINEUR'], delay: 'Court' },
  { id: 'spectro-contact', name: 'Spectromètre de contact', niveau: 'CONTACT', objectTypes: ['OBJET'], delay: 'Long' },
  { id: 'analyseur-echantillon', name: 'Analyseur d\'échantillon', niveau: 'CONTACT', objectTypes: ['OBJET'], delay: 'Très long' },
]

/** Ordre des niveaux d'observation (enum SQL observation_niveau) */
export const NIVEAU_ORDER = { PASSIF: 0, SYSTEME: 1, ORBITE: 2, CONTACT: 3 }

/** Type de corps tel que l'attendent les instruments (STAR → ETOILE, PLANET → PLANETE) */
export function getBodyType(obs) {
  return obs.type === 'STAR' ? 'ETOILE' : obs.type === 'PLANET' ? 'PLANETE' : obs.type
}

/** Instruments applicables à une observation : support pour un signal, type de corps sinon */
export function getInstrumentsForObservation(obs) {
  if (!obs) return []
  if (obs.type === 'SIGNAL') {
    const support = obs.support ?? 'EM_RADIO'
    return LAB_INSTRUMENTS.filter(i => i.signalSupports?.includes(support))
  }
  const bodyType = getBodyType(obs)
  return LAB_INSTRUMENTS.filter(i => i.objectTypes?.includes(bodyType))
}
