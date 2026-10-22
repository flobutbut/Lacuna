<script setup>
import SiteDoc from '@/components/site/SiteDoc.vue'
import LegalValue from '@/components/site/LegalValue.vue'
import { LEGAL } from '@/content/legal'
</script>

<template>
  <SiteDoc kicker="Règles de bord" title="Conditions d’utilisation" :updated-at="LEGAL.updatedAt">
    <p class="site-doc__intro">
      Quelques règles simples pour que la galaxie reste un endroit où l’on a envie de se perdre.
      En créant un compte, vous les acceptez.
    </p>

    <h2>1. Le service</h2>
    <p>
      {{ LEGAL.siteName }} est une simulation d’exploration galactique jouable dans le navigateur, éditée par
      <LegalValue :value="LEGAL.editor.name" /> (voir les <RouterLink :to="{ name: 'mentions-legales' }">mentions légales</RouterLink>).
      Le jeu est <strong>en cours de développement</strong>&nbsp;: des fonctions peuvent changer, apparaître ou disparaître,
      et certaines évolutions peuvent nécessiter de modifier ou de réinitialiser des données de partie.
    </p>

    <h2>2. Votre compte</h2>
    <ul>
      <li>Un compte par personne, avec une adresse email valide dont vous êtes titulaire.</li>
      <li>Vous devez avoir au moins {{ LEGAL.minimumAge }} ans, ou l’accord d’un parent ou tuteur légal.</li>
      <li>Votre mot de passe est personnel&nbsp;: vous êtes responsable de ce qui se fait avec votre compte.</li>
      <li>Le pseudo et le nom du vaisseau ne doivent pas usurper l’identité d’autrui ni être injurieux.</li>
      <li>Vous pouvez supprimer votre compte à tout moment depuis <strong>Paramètres → Compte</strong>.</li>
    </ul>

    <h2>3. Ce que vous écrivez</h2>
    <p>
      Vos interprétations des traces sont lisibles par les autres joueurs, sans votre pseudo. Vous restez l’auteur de vos textes
      et accordez à l’éditeur, gratuitement et pour la durée du service, le droit de les afficher dans le jeu.
      Ils sont supprimés avec votre compte.
    </p>
    <p>Sont interdits&nbsp;:</p>
    <ul>
      <li>les contenus illicites, haineux, violents, harcelants, diffamatoires ou à caractère sexuel&nbsp;;</li>
      <li>les informations personnelles, les vôtres comme celles d’autrui&nbsp;;</li>
      <li>la publicité, les liens commerciaux et le spam.</li>
    </ul>

    <h2>4. Jouer loyalement</h2>
    <p>
      La lenteur fait partie du jeu. Il est interdit de contourner ses règles&nbsp;: automatiser des actions, exploiter
      une faille pour modifier sa partie ou celle d’un autre, perturber le service ou tenter d’accéder à des données
      qui ne sont pas les vôtres. Si vous découvrez une faille, signalez-la à <LegalValue :value="LEGAL.contactEmail" mailto />&nbsp;:
      c’est une trace précieuse.
    </p>

    <h2>5. Suspension</h2>
    <p>
      En cas de manquement à ces règles, l’éditeur peut supprimer un contenu, suspendre ou supprimer le compte concerné,
      après avoir, sauf urgence, invité son titulaire à s’expliquer par email.
    </p>

    <h2>6. Disponibilité et responsabilité</h2>
    <p>
      Le jeu est fourni gratuitement et en l’état. L’éditeur fait de son mieux pour qu’il fonctionne et que vos parties
      soient conservées, mais ne peut garantir une disponibilité continue ni l’absence d’erreur, et ne saurait être tenu
      responsable d’une interruption ou d’une perte de données de jeu.
    </p>

    <h2>7. Propriété intellectuelle</h2>
    <p>
      Le jeu, son code, ses textes, son interface et son univers appartiennent à l’éditeur. Les données astronomiques
      proviennent de catalogues publics, cités dans les <RouterLink :to="{ name: 'credits' }">crédits</RouterLink>.
    </p>

    <h2>8. Données personnelles</h2>
    <p>
      Voir la <RouterLink :to="{ name: 'confidentialite' }">politique de confidentialité</RouterLink>.
    </p>

    <h2>9. Évolution des conditions</h2>
    <p>
      Ces conditions peuvent évoluer avec le jeu. En cas de changement important, les joueurs en seront informés&nbsp;;
      continuer à jouer vaut acceptation de la nouvelle version.
    </p>

    <h2>10. Droit applicable</h2>
    <p>
      Ces conditions sont soumises au droit français. En cas de désaccord, une solution amiable sera recherchée avant toute
      action devant les tribunaux compétents.
    </p>
  </SiteDoc>
</template>
