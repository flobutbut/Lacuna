/**
 * Informations légales du site public — LACUNA
 * Source unique des mentions légales, de la politique de confidentialité et des conditions.
 * Une valeur null s'affiche « À compléter » (en ambre) : à renseigner avant l'ouverture publique.
 */

export const LEGAL = {
  /** Date de dernière mise à jour des trois documents */
  updatedAt: '22 octobre 2026',
  siteName: 'LACUNA',
  siteUrl: 'https://lacuna-lac.vercel.app',

  /** Éditeur du site, responsable du traitement et directeur de la publication */
  editor: {
    /** Nom et prénom (personne physique) ou dénomination */
    name: 'Florian Butour',
    /** Adresse postale ; un particulier non professionnel peut la confier au seul hébergeur (LCEN, art. 6-III-2) */
    address: '1, les Sablières, 44680 Saint-Mars-de-Coutais, France',
  },
  /** Adresse de contact affichée sur le site (questions, exercice des droits RGPD) */
  contactEmail: 'f.butour@gmail.com',

  /** Durée d'inactivité au-delà de laquelle un compte est supprimé (ex. « 3 ans ») */
  inactiveAccountRetention: '1 an',

  /** Âge minimal pour créer un compte sans accord parental */
  minimumAge: 15,

  hosts: [
    {
      role: 'Hébergement de l’application',
      name: 'Vercel Inc.',
      address: '440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis',
      contact: 'privacy@vercel.com',
      url: 'https://vercel.com',
    },
    {
      role: 'Base de données et authentification',
      name: 'Supabase Pte. Ltd.',
      address: '65 Chulia Street #38-02/03, OCBC Centre, Singapour 049513',
      contact: 'privacy@supabase.com',
      url: 'https://supabase.com',
      /** Région du projet Supabase (AWS eu-central-1) */
      dataLocation: 'Union européenne (Francfort, Allemagne)',
    },
  ],
}
