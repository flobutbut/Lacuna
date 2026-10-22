<script setup>
import SiteDoc from '@/components/site/SiteDoc.vue'
import LegalValue from '@/components/site/LegalValue.vue'
import { LEGAL } from '@/content/legal'
</script>

<template>
  <SiteDoc kicker="Ceux qui ont regardé avant nous" title="Crédits">
    <p class="site-doc__intro">
      Le ciel de {{ LEGAL.siteName }} n’est pas inventé. Chaque étoile, chaque exoplanète vient d’un catalogue patiemment
      construit par des astronomes. Merci à eux.
    </p>

    <h2>Conception et développement</h2>
    <p><LegalValue :value="LEGAL.editor.name" /></p>

    <h2>Données astronomiques</h2>
    <h3>Étoiles</h3>
    <p>
      <strong>HYG Database</strong> v4.2 (Hipparcos, Yale Bright Star, Gliese), compilée par David Nash —
      <a href="https://www.astronexus.com/projects/hyg" rel="noopener">astronexus.com</a>.
      Distribuée sous licence <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" rel="noopener">CC BY-SA 4.0</a>&nbsp;;
      les données stellaires dérivées utilisées par le jeu sont partagées dans les mêmes conditions.
    </p>
    <h3>Exoplanètes</h3>
    <p>
      Ce projet utilise le <strong>NASA Exoplanet Archive</strong>, opéré par le California Institute of Technology
      sous contrat avec la NASA dans le cadre de l’Exoplanet Exploration Program —
      <a href="https://exoplanetarchive.ipac.caltech.edu" rel="noopener">exoplanetarchive.ipac.caltech.edu</a>.
    </p>
    <h3>Constellations</h3>
    <p>
      Tracés des 88 constellations d’après les cartes de l’<strong>Union astronomique internationale</strong>,
      compilés par Martin Krzywinski (mkweb.bcgsc.ca).
    </p>

    <h2>Les anomalies réelles</h2>
    <ul>
      <li><strong>Signal Wow!</strong> — radiotélescope Big Ear, Ohio State University, 15 août 1977, relevé par Jerry R. Ehman.</li>
      <li><strong>1I/ʻOumuamua</strong> — découvert par le relevé Pan-STARRS, Université d’Hawaï, 19 octobre 2017.</li>
      <li><strong>Ryugu et Bennu</strong> — échantillons rapportés par les missions Hayabusa2 (JAXA) et OSIRIS-REx (NASA).</li>
    </ul>

    <h2>Typographies</h2>
    <ul>
      <li><strong>Syne</strong> — Bonjour Monde, licence SIL Open Font License 1.1.</li>
      <li><strong>Share Tech Mono</strong> — Carrois Apostrophe, licence SIL Open Font License 1.1.</li>
    </ul>
    <p>Les deux polices sont servies directement par le site, sans appel à un service tiers.</p>

    <h2>Outils</h2>
    <p>
      Construit avec <a href="https://vuejs.org" rel="noopener">Vue.js</a>, <a href="https://vite.dev" rel="noopener">Vite</a>
      et <a href="https://threejs.org" rel="noopener">three.js</a>&nbsp;; données et comptes sur
      <a href="https://supabase.com" rel="noopener">Supabase</a>&nbsp;; hébergé par <a href="https://vercel.com" rel="noopener">Vercel</a>.
    </p>
  </SiteDoc>
</template>
