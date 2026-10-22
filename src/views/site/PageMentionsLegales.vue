<script setup>
import SiteDoc from '@/components/site/SiteDoc.vue'
import LegalValue from '@/components/site/LegalValue.vue'
import { LEGAL } from '@/content/legal'
</script>

<template>
  <SiteDoc kicker="Informations légales" title="Mentions légales" :updated-at="LEGAL.updatedAt">
    <p class="site-doc__intro">
      Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN),
      voici qui édite et qui héberge {{ LEGAL.siteName }}.
    </p>

    <h2>Éditeur</h2>
    <div class="site-card">
      <dl>
        <dt>Site</dt>
        <dd>{{ LEGAL.siteName }} — <a :href="LEGAL.siteUrl">{{ LEGAL.siteUrl.replace('https://', '') }}</a></dd>
        <dt>Éditeur</dt>
        <dd><LegalValue :value="LEGAL.editor.name" /></dd>
        <dt>Adresse</dt>
        <dd><LegalValue :value="LEGAL.editor.address" /></dd>
        <dt>Contact</dt>
        <dd><LegalValue :value="LEGAL.contactEmail" mailto /></dd>
        <dt>Publication</dt>
        <dd>Directeur de la publication : <LegalValue :value="LEGAL.editor.name" /></dd>
      </dl>
    </div>
    <p>
      {{ LEGAL.siteName }} est un projet personnel et non commercial, en cours de développement.
    </p>

    <h2>Hébergement</h2>
    <div v-for="host in LEGAL.hosts" :key="host.name" class="site-card">
      <p class="site-card__title">{{ host.role }}</p>
      <dl>
        <dt>Société</dt>
        <dd>{{ host.name }}</dd>
        <dt>Adresse</dt>
        <dd>{{ host.address }}</dd>
        <dt>Contact</dt>
        <dd><a :href="`mailto:${host.contact}`">{{ host.contact }}</a> · <a :href="host.url" rel="noopener">{{ host.url.replace('https://', '') }}</a></dd>
        <template v-if="host.dataLocation">
          <dt>Données</dt>
          <dd>Stockées dans l’{{ host.dataLocation }}</dd>
        </template>
      </dl>
    </div>

    <h2>Propriété intellectuelle</h2>
    <p>
      Les textes, l’interface, les illustrations, le nom et l’univers de {{ LEGAL.siteName }} sont protégés par le droit d’auteur.
      Toute reproduction ou réutilisation sans autorisation écrite de l’éditeur est interdite.
    </p>
    <p>
      Les données astronomiques proviennent de catalogues publics, utilisés selon leurs licences&nbsp;:
      voir la page <RouterLink :to="{ name: 'credits' }">Crédits</RouterLink>.
    </p>

    <h2>Données personnelles</h2>
    <p>
      Les données collectées pour faire fonctionner le jeu, et les droits dont vous disposez, sont décrits dans la
      <RouterLink :to="{ name: 'confidentialite' }">politique de confidentialité</RouterLink>.
      L’usage du service est encadré par les <RouterLink :to="{ name: 'conditions' }">conditions d’utilisation</RouterLink>.
    </p>

    <h2>Signaler un contenu</h2>
    <p>
      Les interprétations écrites par les joueurs sont visibles des autres joueurs. Pour signaler un contenu illicite,
      écrivez à <LegalValue :value="LEGAL.contactEmail" mailto /> en indiquant le texte concerné et le motif du signalement.
    </p>
  </SiteDoc>
</template>
