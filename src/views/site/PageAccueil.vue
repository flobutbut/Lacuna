<script setup>
/**
 * Landing — la première chose que voit un visiteur.
 * Le texte reprend le lore (docs/conception/LACUNA_LORE.md) : on ne vend pas un jeu, on propose un départ.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import SiteLayout from '@/components/site/SiteLayout.vue'
import { vReveal } from '@/components/site/reveal'
import AppIcon from '@/components/icons/AppIcon.vue'

const RECORDS = [
  {
    id: 'WOW-1977',
    status: 'Non résolu',
    type: 'Signal radio',
    rows: [
      ['Date', '15 août 1977'],
      ['Source', 'Big Ear, Ohio'],
      ['Durée', '72 secondes'],
      ['Fréquence', '1420 MHz'],
      ['Répétition', 'Jamais'],
    ],
  },
  {
    id: '1I/ʻOUMUAMUA',
    status: 'Origine inconnue',
    type: 'Objet interstellaire',
    rows: [
      ['Date', '19 octobre 2017'],
      ['Source', 'Pan-STARRS, Hawaï'],
      ['Trajectoire', 'Hyperbolique'],
      ['Accélération', 'Non gravitationnelle'],
      ['Forme', 'Très allongée'],
    ],
  },
  {
    id: 'RYUGU · BENNU',
    status: 'Question ouverte',
    type: 'Chimie prébiotique',
    rows: [
      ['Missions', 'Hayabusa2 · OSIRIS-REx'],
      ['Échantillons', 'Astéroïdes primitifs'],
      ['Contenu', 'Bases de l’ARN'],
      ['Contamination', 'Exclue'],
      ['Conséquence', 'À interpréter'],
    ],
  },
]

const FIGURES = [
  { value: '67', label: 'nations' },
  { value: '112\u00a0000', label: 'candidats' },
  { value: '10\u00a0247', label: 'âmes à bord' },
  { value: '0', label: 'retour prévu', accent: true },
]

const STEPS = [
  {
    num: '01',
    title: 'Observer',
    text: 'Le ciel est votre seule carte. Radar, spectres, pulsars : chaque instrument arrache une donnée au silence. Une étoile que vous n’avez pas résolue n’est qu’un point de lumière, sans nom et sans distance.',
  },
  {
    num: '02',
    title: 'Interpréter',
    text: 'Il n’y a pas de bonne réponse. Vous écrivez ce que vous croyez lire dans un signal, une orbite, un spectre. Votre lecture reste — datée, portée par une génération qui ne connaîtra pas la suivante.',
  },
  {
    num: '03',
    title: 'Partir',
    text: 'Vous fixez un cap, vous allumez les moteurs. À bord, des enfants naissent, des anciens s’éteignent, la mémoire se transmet. Certains voyages ne mènent à rien. Tous coûtent du temps.',
  },
]

/** N de Drake : dérive lentement, comme dans le tableau de bord du vaisseau */
const drakeN = ref(12.4)
let drakeTimer = null

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  drakeTimer = setInterval(() => {
    const next = drakeN.value + (Math.random() - 0.5) * 0.3
    drakeN.value = Math.min(14.8, Math.max(9.6, next))
  }, 2600)
})

onBeforeUnmount(() => clearInterval(drakeTimer))

function scrollToCatalogue() {
  document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <SiteLayout>
    <!-- ── Premier écran ── -->
    <section class="site-hero" aria-labelledby="hero-title">
      <p class="site-hero__kicker">847 anomalies cataloguées · 12 inexpliquées</p>
      <h1 id="hero-title" class="site-hero__title">LAC<span class="site-hero__title-accent">U</span>NA</h1>
      <p class="site-hero__lines">
        <span class="site-hero__line">Des volontaires ont choisi de partir.</span>
        <span class="site-hero__line">Ils avaient des questions sans réponse.</span>
        <span class="site-hero__line">Ils ne reviendront pas.</span>
      </p>
      <p class="site-hero__lead">
        Un vaisseau générationnel, dix mille âmes, et la plus vieille question du monde&nbsp;:
        sommes-nous seuls&nbsp;? Une simulation d’exploration galactique qui continue de tourner quand vous n’êtes plus là.
      </p>
      <div class="site-hero__actions">
        <RouterLink :to="{ name: 'inscription' }" class="site-cta">Embarquer</RouterLink>
        <RouterLink :to="{ name: 'connexion' }" class="site-cta site-cta--ghost">J’ai déjà un vaisseau</RouterLink>
      </div>
      <a href="#catalogue" class="site-hero__scroll" @click.prevent="scrollToCatalogue">
        Écouter le silence
        <AppIcon name="arrow-down" />
      </a>
    </section>

    <!-- ── I. Le catalogue ── -->
    <section id="catalogue" class="site-section" aria-labelledby="catalogue-title">
      <p v-reveal class="site-kicker">I — Le catalogue</p>
      <h2 id="catalogue-title" v-reveal class="site-h2">
        Pour la première fois, l’humanité s’est accordée sur <em>ce qu’elle ne comprend pas.</em>
      </h2>
      <div v-reveal class="site-prose">
        <p>
          Un signal de soixante-douze secondes qui ne s’est jamais répété. Un objet venu d’ailleurs qui accélère sans raison.
          Les briques de la vie, intactes, dans la poussière d’un astéroïde.
        </p>
        <p>
          Le Consortium a réuni <strong>847 anomalies</strong> dans un rayon de cinq cents années-lumière.
          Douze résistent à toute explication naturelle. Les trois premières, vous les connaissez peut-être&nbsp;:
          elles sont bien réelles. LACUNA part des vraies données, des vraies questions, et de rien d’autre.
        </p>
      </div>
      <div class="site-records">
        <article v-for="(record, i) in RECORDS" :key="record.id" v-reveal="i * 140" class="site-record">
          <header class="site-record__id">
            <span>{{ record.id }}</span>
            <span class="site-record__status">{{ record.status }}</span>
          </header>
          <span class="site-record__type">{{ record.type }}</span>
          <dl class="site-record__rows">
            <div v-for="[key, value] in record.rows" :key="key" class="site-record__row">
              <dt>{{ key }}</dt>
              <dd>{{ value }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>

    <!-- ── II. Le pari ── -->
    <section class="site-section" aria-labelledby="pari-title">
      <p v-reveal class="site-kicker">II — Le pari</p>
      <h2 id="pari-title" v-reveal class="site-h2">
        Pas une certitude. <em>Un pari.</em>
      </h2>
      <div v-reveal class="site-prose">
        <p>
          On ne pouvait pas répondre depuis la Terre. Alors des vaisseaux ont été construits, et des volontaires ont dit oui.
          Ils savaient qu’ils ne reverraient pas la Terre. Que leurs enfants non plus.
          Que la première destination serait atteinte longtemps après leur mort.
        </p>
        <p>
          Vous commandez l’un d’eux&nbsp;: un vaisseau de classe <strong>ARCA</strong>, une ville lancée dans le noir,
          et toutes les générations qui y naîtront.
        </p>
      </div>
      <div v-reveal class="site-figures">
        <div v-for="figure in FIGURES" :key="figure.label">
          <span class="site-figure__value" :class="{ 'site-figure__value--accent': figure.accent }">{{ figure.value }}</span>
          <span class="site-figure__label">{{ figure.label }}</span>
        </div>
      </div>
      <figure v-reveal class="site-blueprint">
        <img src="/ARCA_blueprint_grouped.svg" alt="Plan du vaisseau générationnel de classe ARCA, vue latérale" loading="lazy" width="2400" height="735">
        <figcaption>ARCA — Autonomous Relativistic Colony Ark · vue latérale</figcaption>
      </figure>
    </section>

    <!-- ── III. Le voyage ── -->
    <section class="site-section" aria-labelledby="voyage-title">
      <p v-reveal class="site-kicker">III — Le voyage</p>
      <h2 id="voyage-title" v-reveal class="site-h2">
        Le temps est la seule monnaie. <em>Chaque cap la dépense.</em>
      </h2>
      <ol class="site-steps">
        <li v-for="(step, i) in STEPS" :key="step.num" v-reveal="i * 160" class="site-step">
          <span class="site-step__num">{{ step.num }}</span>
          <h3 class="site-step__title">{{ step.title }}</h3>
          <p>{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <!-- ── IV. La solitude ── -->
    <section class="site-quote" aria-label="La solitude">
      <blockquote v-reveal>
        <span>Tu sais que d’autres sont passés.</span>
        <span>Tu ne sauras jamais qui.</span>
        <span>Tu ne peux pas les appeler.</span>
      </blockquote>
      <p v-reveal="200">
        Pas de chat, pas de classement, pas de carte partagée. Les autres vaisseaux n’existent que par ce qu’ils laissent&nbsp;:
        une lecture sur un artefact, un avertissement, une contradiction. La relativité fait le reste —
        partis le même jour, vous ne partagez déjà plus le même présent.
      </p>
    </section>

    <!-- ── V. L'équation ── -->
    <section class="site-section" aria-labelledby="drake-title">
      <div class="site-drake">
        <div>
          <p v-reveal class="site-kicker">V — L’équation</p>
          <h2 id="drake-title" v-reveal class="site-h2">
            Un seul nombre au tableau de bord. <em>Il bouge quand quelqu’un découvre quelque chose.</em>
          </h2>
          <div v-reveal class="site-prose">
            <p>
              N&nbsp;: le nombre de civilisations qui pourraient, en ce moment, nous entendre. Il se recalcule avec les découvertes
              de tous les vaisseaux en route. Parfois il monte. Parfois il s’effondre.
              <strong>Personne ne vous dira pourquoi.</strong>
            </p>
          </div>
        </div>
        <div v-reveal="150" class="site-drake__panel" aria-live="off">
          <div class="site-drake__label">Civilisations communicantes estimées</div>
          <div class="site-drake__value">{{ drakeN.toFixed(1).replace('.', ',') }}</div>
          <div class="site-drake__equation">
            N = R<sub>*</sub> · f<sub>p</sub> · n<sub>e</sub> · f<sub>l</sub> · f<sub>i</sub> · f<sub>c</sub> · L
          </div>
        </div>
      </div>
    </section>

    <ul v-reveal class="site-nots" aria-label="Ce que LACUNA n’est pas">
      <li>Pas de score</li>
      <li>Pas de fin</li>
      <li>Pas d’ennemi</li>
      <li>Pas de vérité imposée</li>
    </ul>

    <!-- ── Dernier appel ── -->
    <section class="site-final" aria-labelledby="final-title">
      <h2 id="final-title" v-reveal class="site-final__title">
        Ce n’est pas un jeu qu’on finit. <span>C’est un jeu qu’on habite.</span>
      </h2>
      <RouterLink v-reveal="150" :to="{ name: 'inscription' }" class="site-cta">Embarquer</RouterLink>
      <p v-reveal="250" class="site-final__note">Dans votre navigateur · En cours de développement</p>
    </section>
  </SiteLayout>
</template>
