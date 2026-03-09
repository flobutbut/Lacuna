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
      <div class="header__stat-block">
        <span class="header__stat-label">Gén.</span>
        <span class="header__stat-val">I</span>
      </div>
      <RouterLink to="/drake" class="header__stat-block header__stat-block--drake">
        <span class="header__stat-label">N =</span>
        <span class="header__stat-val">{{ drakeN.toFixed(1) }}</span>
        <span
          class="header__stat-delta"
          :class="{ 'header__stat-delta--neg': !drakeDeltaPositive }"
        >
          {{ drakeDeltaPositive ? '+' : '' }}{{ drakeDelta.toFixed(1) }}
        </span>
      </RouterLink>
    </div>
  </header>
</template>
