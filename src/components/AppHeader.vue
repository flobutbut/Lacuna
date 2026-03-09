<script setup>
import { ref, onMounted } from 'vue'

const coords = ref('α 04h 22m 14s  δ −14° 08′  d 0.00 al')
const drakeN = ref(12.4)
const drakeDelta = ref(0.3)
const drakeDeltaPositive = ref(true)

onMounted(() => {
  // Animation Drake
  const interval = setInterval(() => {
    const delta = (Math.random() - 0.48) * 0.3
    drakeN.value = Math.max(0.1, drakeN.value + delta)
    drakeDelta.value = Math.abs(delta)
    drakeDeltaPositive.value = delta >= 0
  }, 8000)

  // Coordonnées (placeholder)
  const coordInterval = setInterval(() => {
    const h = String(Math.floor(Math.random() * 24)).padStart(2, '0')
    const m = String(Math.floor(Math.random() * 60)).padStart(2, '0')
    coords.value = `α ${h}h ${m}m  δ −14° 08′  d 0.00 al`
  }, 5000)

  return () => {
    clearInterval(interval)
    clearInterval(coordInterval)
  }
})
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="header__logo">LAC<span class="header__logo-accent">U</span>NA</RouterLink>

    <div class="header__center">
      <div class="header__ship-name">ARK TESSERA — VOYAGE 1</div>
      <div class="header__coords">{{ coords }}</div>
    </div>

    <div class="header__right">
      <div class="gen-indicator">
        <div class="gen-indicator__label">Génération</div>
        <div class="gen-indicator__value">I</div>
      </div>
      <div class="drake-widget">
        <div>
          <div class="drake-widget__label">N =</div>
          <div class="drake-widget__sub">civilisations actives</div>
        </div>
        <div>
          <div class="drake-widget__value">{{ drakeN.toFixed(1) }}</div>
          <div
            class="drake-widget__delta"
            :class="{ 'drake-widget__delta--negative': !drakeDeltaPositive }"
          >
            {{ drakeDeltaPositive ? '▲' : '▼' }}
            {{ drakeDeltaPositive ? '+' : '' }}{{ drakeDelta.toFixed(1) }}
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
