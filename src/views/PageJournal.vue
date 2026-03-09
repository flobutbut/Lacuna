<script setup>
const entries = [
  {
    date: 'JOUR 1 — AN 2187.042',
    gen: 'GÉNÉRATION I — FONDATEURS',
    text: "Départ confirmé. 10 247 âmes embarquées. Les réservoirs sont pleins. Le bouclier plasma est actif. On a regardé la Terre disparaître dans l'observatoire pendant 4 heures. Personne n'a dit grand chose.",
    anomaly: false,
  },
  {
    date: 'JOUR 47 — AN 2187.089',
    gen: 'GÉNÉRATION I — FONDATEURS',
    text: "Premier scan approfondi du signal WOW-1977-A. La fréquence 1420 MHz correspond exactement à la raie de l'hydrogène. Ce n'est pas une coïncidence naturelle. Tout le monde le sait. Personne ne le dit encore.",
    anomaly: false,
  },
  {
    date: 'JOUR 91 — AN 2187.133',
    gen: 'GÉNÉRATION I — FONDATEURS',
    text: "Anomalie détectée dans le système Tau Ceti. Géométrie orbitale irrégulière. Le laboratoire demande 72h d'analyse. On attend.",
    anomaly: true,
  },
]
</script>

<template>
  <div class="page-full">
    <div class="page-content">
      <h1 class="page-title">Journal de Bord</h1>
      <div
        v-for="(entry, i) in entries"
        :key="i"
        class="journal-entry"
        :class="{ 'journal-entry--anomaly': entry.anomaly }"
      >
        <div class="je-date">{{ entry.date }}</div>
        <div class="je-gen">{{ entry.gen }}</div>
        <div class="je-text">{{ entry.text }}</div>
      </div>
    </div>
  </div>
</template>

