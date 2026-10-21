/**
 * Données de menus partagées — LACUNA
 * Utilisées par PageSystemes, PageArtefacts, InstrumentsBar
 */

/** Menu Systèmes (vue ARCA) — 1 item par groupe SVG + Identité + Historique */
export const SYSTEMS_MENU_ITEMS = [
  { id: 'identity', label: 'Identité', icon: '◈', groupIds: [] },
  { id: 'plasma-shield', label: 'Bouclier plasma', icon: '◎', groupIds: ['plasma-shield'], legendColor: 'cyan' },
  { id: 'bumper-shield', label: 'Pare-chocs ablatif', icon: '⬡', groupIds: ['bumper-shield'], legendColor: 'bumper' },
  { id: 'population-quarters', label: 'Anneaux habitat', icon: '⊕', groupIds: ['population-quarters'], legendColor: 'green' },
  { id: 'fission-reactors', label: 'Réacteurs & Cargaison', icon: '⌬', groupIds: ['fission-reactors'], legendColor: 'cyan' },
  { id: 'thermal-radiators', label: 'Radiateurs thermiques', icon: '☰', groupIds: ['thermal-radiators'], legendColor: 'amber' },
  { id: 'fuel-tanks', label: 'Réservoirs cryogéniques', icon: '◉', groupIds: ['fuel-tanks'], legendColor: 'cyan' },
  { id: 'propulsion', label: 'Moteur fusion MTF', icon: '≋', groupIds: ['propulsion'], legendColor: 'signal' },
  { id: 'comms', label: 'Laser comms', icon: '↕', groupIds: ['comms'], legendColor: 'comms' },
  { id: 'navigation', label: 'Navigation pulsar', icon: '✧', groupIds: ['navigation'], legendColor: 'nav' },
  { id: 'history', label: 'Historique', icon: '≡', groupIds: [] },
]

/** Barre Instruments — modules de navigation */
export const INSTRUMENTS = [
  { id: 'observatoire', path: '/', icon: '◎', label: 'Observatoire' },
  { id: 'carte', path: '/carte', icon: '⊹', label: 'Carte' },
  { id: 'laboratoire', path: '/laboratoire', icon: '⌬', label: 'Laboratoire' },
  { id: 'artefacts', path: '/artefacts', icon: '◈', label: 'Artefacts' },
  { id: 'journal', path: '/journal', icon: '≡', label: 'Journal' },
  { id: 'drake', path: '/drake', icon: 'N', label: 'Drake' },
  { id: 'population', path: '/population', icon: '⊕', label: 'Population' },
  { id: 'systemes', path: '/systemes', icon: '⚙', label: 'Systèmes' },
  // Outil de conception : visible pour les admins (et hors ligne)
  { id: 'conception-etoiles', path: '/conception-etoiles', icon: '✧', label: 'Vue 3D étoiles', adminOnly: true },
]

/** Menu Population — onglets */
export const POPULATION_MENU_ITEMS = [
  { id: 'generations', label: 'Générations', icon: '⊕' },
  { id: 'current', label: 'Génération actuelle', icon: '◉' },
  { id: 'reasons', label: 'Registre des Raisons', icon: '◈' },
]

/** Icônes par type de trace (Artefacts) */
export const TRACE_ICONS = {
  SIGNAL_RADIO: '≋',
  INTERSTELLAR_OBJECT: '◇',
  CHEMICAL_ANOMALY: '⌬',
  STELLAR_ANOMALY: '◉',
  ORBITAL_ANOMALY: '⊚',
  ENCODED_SEQUENCE: '⌇',
  PHYSICAL_ARTIFACT: '◈',
  PLAYER_TRACE: '✦',
}

/** Type trace → icône (défaut ◈) */
export function getTraceIcon(type) {
  return TRACE_ICONS[type] ?? '◈'
}
