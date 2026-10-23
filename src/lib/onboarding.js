/**
 * Onboarding — écran 5, le premier choix (LACUNA_LORE.md §3 et §5).
 * Les neuf anomalies-destinations du catalogue embarqué ; les trois autres (WOW!, Oumuamua, Bennu)
 * sont des traces embarquées sans système où se rendre.
 */
import { START_PULSARS } from './startSources'

/** Systèmes des anomalies 4 à 12 du catalogue (identifiants stellar_systems) */
export const CATALOGUE_SYSTEM_IDS = new Set([
  'PROXIMA',
  'barnards-star',
  'ROSS128',
  'ran',
  'TAU_CETI',
  'gl-gl-667c',
  'hd-40307',
  'kic-8462852',
  'PSR_B1919',
])

/**
 * Le premier cap n'est pas encore fixé : l'écran 5 reste affiché.
 * @param {{ voyage?: number, travel_state?: string }|null} ship
 */
export function isFirstChoicePending(ship) {
  return !!ship && (ship.voyage ?? 1) <= 1 && ship.travel_state !== 'IN_TRANSIT'
}

/** Source montrée à l'étape « signaux » : PSR B1919+21, visible au Radar (bande L) dès le départ */
export const RADAR_SOURCE = START_PULSARS[0]

/**
 * Visite de l'écran 5 (LACUNA_LORE.md §3, Implémentation). Chaque étape montre un objet du ciel (anomaly, signal)
 * ou un élément de l'interface (sélecteur CSS). `focus` centre la vue (et choisit la bande du Radar) en entrant
 * dans l'étape. La dernière reprend le texte d'origine de l'écran 5.
 */
export const FIRST_CHOICE_TOUR = [
  {
    id: 'anomalies',
    target: { sky: 'anomaly' },
    text: [
      'Certains systèmes ne s’expliquent pas entièrement : ils portent des anomalies que personne n’a su expliquer.',
      'Observez-les, analysez-les, et faites-vous votre propre idée.',
    ],
  },
  {
    id: 'signaux',
    target: { sky: 'radarSource' },
    focus: { ra: RADAR_SOURCE.azimuth, dec: RADAR_SOURCE.elevation, band: RADAR_SOURCE.band },
    text: [
      'Le vaisseau capte des signaux venus de l’espace. La plupart ont une origine connue : pulsars, sursauts gamma…',
      'Il arrive que certains restent inexpliqués.',
    ],
  },
  {
    id: 'radar',
    target: { selector: '[data-tour="radar"]' },
    text: [
      'Le Radar écoute le ciel dans la direction où vous regardez.',
      'Les traits verticaux réguliers viennent du signal que vous visez. Chaque bande de fréquence fait entendre des sources différentes.',
    ],
  },
  {
    id: 'neutrinos',
    target: { selector: '[data-tour="neutrinos"]' },
    text: ['Le détecteur compte les neutrinos qui traversent le vaisseau.', 'Il ne dit pas d’où ils viennent.'],
  },
  {
    id: 'laboratoire',
    target: { selector: '.instruments a[href="/laboratoire"]' },
    text: [
      'Le Laboratoire compare vos mesures à ce que prévoient les modèles et relève les écarts. Certains ne se mesurent qu’en s’approchant.',
      'Il ne conclut jamais : le verdict vous appartient.',
    ],
  },
  {
    id: 'journal',
    target: { selector: '.instruments a[href="/journal"]' },
    text: [
      'Le journal garde la mémoire du voyage : ce qui s’est passé, et ce que vous en avez conclu.',
      'Ce que vous déposez en artefact, d’autres vaisseaux le liront.',
    ],
  },
  {
    id: 'catalogue',
    target: { sky: 'anomaly' },
    text: ['12 anomalies figurent dans le catalogue embarqué.', 'Choisissez celle que vous voulez comprendre.'],
  },
]
