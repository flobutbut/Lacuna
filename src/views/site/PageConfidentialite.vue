<script setup>
import SiteDoc from '@/components/site/SiteDoc.vue'
import LegalValue from '@/components/site/LegalValue.vue'
import { LEGAL } from '@/content/legal'

const supabaseHost = LEGAL.hosts.find((h) => h.name.startsWith('Supabase'))
</script>

<template>
  <SiteDoc kicker="Données personnelles" title="Politique de confidentialité" :updated-at="LEGAL.updatedAt">
    <p class="site-doc__intro">
      {{ LEGAL.siteName }} collecte le strict nécessaire pour faire voyager votre vaisseau. Pas de publicité,
      pas de mesure d’audience, pas de revente, pas de cookie de suivi.
    </p>

    <h2>Responsable du traitement</h2>
    <p>
      <LegalValue :value="LEGAL.editor.name" />, éditeur du site, joignable à
      <LegalValue :value="LEGAL.contactEmail" mailto />.
    </p>

    <h2>Données collectées</h2>
    <h3>Votre compte</h3>
    <ul>
      <li><strong>Adresse email</strong> : pour vous identifier, confirmer votre inscription et réinitialiser votre mot de passe.</li>
      <li><strong>Mot de passe</strong> : jamais stocké en clair, seule son empreinte (hachage) est conservée.</li>
      <li><strong>Pseudo et nom du vaisseau</strong> : choisis par vous, modifiables à tout moment depuis le jeu.</li>
    </ul>
    <h3>Votre partie</h3>
    <ul>
      <li>Position et voyages du vaisseau, population, carte, observations, signaux, rapports de laboratoire, journal de bord.</li>
      <li>
        <strong>Interprétations</strong> : les textes que vous écrivez sur les traces sont lisibles par les autres joueurs,
        <strong>sans votre pseudo ni aucun lien vers votre compte</strong>. N’y mettez pas d’information personnelle.
      </li>
    </ul>
    <h3>Données techniques</h3>
    <ul>
      <li>
        Adresse IP, navigateur, date et heure des connexions&nbsp;: enregistrées par nos hébergeurs dans leurs journaux,
        pour la sécurité et le bon fonctionnement du service.
      </li>
      <li>
        Lorsqu’une vérification anti-robot est active sur l’inscription et la connexion, elle est assurée par
        Cloudflare Turnstile, qui analyse des signaux techniques du navigateur sans cookie publicitaire.
      </li>
    </ul>

    <h2>Pourquoi, et sur quelle base</h2>
    <ul>
      <li><strong>Faire fonctionner le jeu</strong> (compte, partie, emails de service) : exécution des conditions d’utilisation que vous acceptez en créant un compte.</li>
      <li><strong>Protéger le service</strong> (journaux techniques, anti-robot, lutte contre les abus) : intérêt légitime de l’éditeur.</li>
    </ul>
    <p>Aucune donnée n’est utilisée à des fins publicitaires ni pour établir un profil commercial.</p>

    <h2>Stockage dans votre navigateur</h2>
    <p>
      {{ LEGAL.siteName }} n’utilise pas de cookie. Le navigateur conserve dans son stockage local votre session de connexion
      (pour ne pas vous la redemander à chaque visite) et quelques préférences d’affichage, comme les lignes de constellation.
      Ces éléments sont strictement nécessaires au service&nbsp;: ils ne demandent pas de consentement et ne servent à aucun suivi.
    </p>

    <h2>Qui y a accès</h2>
    <p>Vos données ne sont ni vendues ni cédées. Elles sont traitées par les prestataires techniques suivants&nbsp;:</p>
    <ul>
      <li>
        <strong>Supabase</strong> — base de données, comptes et envoi des emails de service.
        Données stockées dans l’{{ supabaseHost?.dataLocation }}.
      </li>
      <li><strong>Vercel</strong> — hébergement et distribution de l’application.</li>
      <li><strong>Cloudflare</strong> — vérification anti-robot, lorsqu’elle est active.</li>
    </ul>
    <p>
      Ces sociétés peuvent traiter certaines données hors de l’Union européenne (États-Unis, Singapour)&nbsp;; ces transferts
      sont encadrés par les garanties prévues par le RGPD (clauses contractuelles types de la Commission européenne ou
      cadre de protection des données UE–États-Unis).
    </p>

    <h2>Combien de temps</h2>
    <ul>
      <li><strong>Compte et partie</strong> : tant que votre compte existe.</li>
      <li>
        <strong>Comptes inactifs</strong> : supprimés après <LegalValue :value="LEGAL.inactiveAccountRetention" /> sans connexion.
      </li>
      <li><strong>Journaux techniques</strong> : quelques jours à quelques semaines, selon les durées de conservation des hébergeurs.</li>
    </ul>
    <p>
      Vous pouvez supprimer votre compte vous-même, à tout moment&nbsp;: <strong>Paramètres → Compte → Supprimer le compte</strong>.
      La suppression est immédiate et définitive&nbsp;: compte, pseudo, vaisseau, partie et interprétations sont effacés.
    </p>

    <h2>Vos droits</h2>
    <p>
      Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données.
      Le pseudo et le nom du vaisseau se modifient directement dans le jeu&nbsp;; l’effacement se fait depuis les Paramètres.
      Pour toute autre demande, écrivez à <LegalValue :value="LEGAL.contactEmail" mailto />&nbsp;: réponse sous un mois.
    </p>
    <p>
      Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL
      (<a href="https://www.cnil.fr/fr/plaintes" rel="noopener">cnil.fr/fr/plaintes</a>).
    </p>

    <h2>Âge minimum</h2>
    <p>
      {{ LEGAL.siteName }} s’adresse aux personnes de {{ LEGAL.minimumAge }} ans et plus. En dessous, l’inscription nécessite
      l’accord d’un parent ou tuteur légal.
    </p>

    <h2>Sécurité</h2>
    <p>
      Connexions chiffrées (HTTPS), mots de passe hachés, et des règles d’accès en base qui empêchent chaque joueur de lire
      ou modifier la partie d’un autre. Les décisions de jeu sensibles, comme la durée d’un voyage, sont calculées par le serveur.
    </p>

    <h2>Modifications</h2>
    <p>
      Cette politique peut évoluer avec le jeu. La date de dernière mise à jour figure en haut de page&nbsp;;
      en cas de changement important, les joueurs en seront informés.
    </p>
  </SiteDoc>
</template>
