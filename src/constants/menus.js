/**
 * Données de menus partagées — LACUNA
 * Utilisées par PageSystemes, PageArtefacts, InstrumentsBar, SettingsModal
 */

/** Menu Systèmes (vue ARCA) — 1 item par groupe SVG + Identité + Historique */
export const SYSTEMS_MENU_ITEMS = [
  { id: 'identity', label: 'Identité', icon: 'identity', groupIds: [] },
  { id: 'plasma-shield', label: 'Bouclier plasma', icon: 'shield', groupIds: ['plasma-shield'], legendColor: 'cyan' },
  { id: 'bumper-shield', label: 'Pare-chocs ablatif', icon: 'bumper', groupIds: ['bumper-shield'], legendColor: 'bumper' },
  { id: 'population-quarters', label: 'Anneaux habitat', icon: 'habitat', groupIds: ['population-quarters'], legendColor: 'green' },
  { id: 'fission-reactors', label: 'Réacteurs & Cargaison', icon: 'reactor', groupIds: ['fission-reactors'], legendColor: 'cyan' },
  { id: 'thermal-radiators', label: 'Radiateurs thermiques', icon: 'radiator', groupIds: ['thermal-radiators'], legendColor: 'amber' },
  { id: 'fuel-tanks', label: 'Réservoirs cryogéniques', icon: 'tank', groupIds: ['fuel-tanks'], legendColor: 'cyan' },
  { id: 'propulsion', label: 'Moteur fusion MTF', icon: 'thruster', groupIds: ['propulsion'], legendColor: 'signal' },
  { id: 'comms', label: 'Laser comms', icon: 'laser', groupIds: ['comms'], legendColor: 'comms' },
  { id: 'navigation', label: 'Navigation pulsar', icon: 'pulsar', groupIds: ['navigation'], legendColor: 'nav' },
  { id: 'history', label: 'Historique', icon: 'history', groupIds: [] },
]

/** Barre Instruments — modules de navigation */
export const INSTRUMENTS = [
  { id: 'observatoire', path: '/observatoire', icon: 'observatory', label: 'Observatoire' },
  { id: 'carte', path: '/carte', icon: 'star-map', label: 'Carte' },
  { id: 'laboratoire', path: '/laboratoire', icon: 'laboratory', label: 'Laboratoire' },
  { id: 'artefacts', path: '/artefacts', icon: 'artifact', label: 'Artefacts' },
  { id: 'journal', path: '/journal', icon: 'journal', label: 'Journal' },
  { id: 'drake', path: '/drake', icon: 'galaxy', label: 'Drake' },
  { id: 'population', path: '/population', icon: 'population', label: 'Population' },
  { id: 'systemes', path: '/systemes', icon: 'gauge', label: 'Systèmes' },
  // Outil de conception : visible pour les admins (et hors ligne)
  { id: 'conception-etoiles', path: '/conception-etoiles', icon: 'sparkle', label: 'Vue 3D étoiles', adminOnly: true },
  // Modération des joueurs : admins seulement
  { id: 'admin', path: '/admin', icon: 'shield', label: 'Admin', adminOnly: true },
]

/** Menu Population — onglets */
export const POPULATION_MENU_ITEMS = [
  { id: 'generations', label: 'Générations', icon: 'generations' },
  { id: 'current', label: 'Génération actuelle', icon: 'person' },
  { id: 'reasons', label: 'Registre des Raisons', icon: 'register' },
]

/** Icônes par type de trace (Artefacts) — noms de components/icons/iconSet.js */
export const TRACE_ICONS = {
  SIGNAL_RADIO: 'radio',
  INTERSTELLAR_OBJECT: 'interstellar',
  CHEMICAL_ANOMALY: 'molecule',
  STELLAR_ANOMALY: 'sun',
  ORBITAL_ANOMALY: 'orbit',
  ENCODED_SEQUENCE: 'sequence',
  PHYSICAL_ARTIFACT: 'specimen',
  PLAYER_TRACE: 'marker',
}

/** Type trace → icône (défaut : artifact) */
export function getTraceIcon(type) {
  return TRACE_ICONS[type] ?? 'artifact'
}

/** Paramètres (modale du header) — une entrée par section */
export const SETTINGS_SECTIONS = [
  { id: 'account', label: 'Compte', icon: 'account' },
  { id: 'admin', label: 'Administration', icon: 'shield', adminOnly: true },
]
