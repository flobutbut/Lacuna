<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { useSignauxStore } from '@/stores/signaux'
import { useUIStore } from '@/stores/ui'
import { useShipStore } from '@/stores/ship'

const signauxStore = useSignauxStore()
const ui = useUIStore()
const shipStore = useShipStore()

const propulsion = computed(() => (shipStore.systems?.propulsion ?? 0.88) * 100)
const he3 = computed(() => (shipStore.fuel?.he3 ?? 0.742) * 100)
const hull = computed(() => (shipStore.systems?.hull ?? 0.971) * 100)
const plasmaShield = computed(() => (shipStore.systems?.plasma_shield ?? 1) * 100)

function barClass(pct) {
  if (pct >= 0.8) return 'bar-green'
  if (pct >= 0.5) return 'bar-amber'
  return 'bar-red'
}
function valClass(pct) {
  if (pct >= 0.8) return 'ok'
  if (pct >= 0.5) return 'warn'
  return 'err'
}

function receivedAgo(createdAt) {
  const min = Math.floor((Date.now() - createdAt) / 60000)
  if (min < 60) return `Reçu il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Reçu il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Reçu il y a ${d}j`
}

function onCardClick(s) {
  ui.selectSignal(s)
}

function onIgnore(e, id) {
  e.stopPropagation()
  signauxStore.removeSignal(id)
}

let expiryInterval = null
onMounted(async () => {
  if (!shipStore.loaded) await shipStore.fetch()
  signauxStore.removeExpired()
  expiryInterval = setInterval(() => signauxStore.removeExpired(), 60000)
})
onUnmounted(() => {
  if (expiryInterval) clearInterval(expiryInterval)
})
</script>

<template>
  <div class="side-left">
    <div class="side-widget">
      <div class="sw-title">Systèmes vaisseau</div>
      <div class="sw-row">
        <div class="sw-key">Propulsion</div>
        <div class="sw-val" :class="valClass(propulsion/100)">{{ propulsion >= 80 ? 'NOMINAL' : (propulsion.toFixed(1) + '%') }}</div>
      </div>
      <div class="bar-wrap">
        <div class="bar-fill" :class="barClass(propulsion/100)" :style="{ width: propulsion + '%' }"></div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Carburant He³</div>
        <div class="sw-val" :class="valClass(he3/100)">{{ he3.toFixed(1) }}%</div>
      </div>
      <div class="bar-wrap">
        <div class="bar-fill" :class="barClass(he3/100)" :style="{ width: he3 + '%' }"></div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Intégrité coque</div>
        <div class="sw-val" :class="valClass(hull/100)">{{ hull.toFixed(1) }}%</div>
      </div>
      <div class="bar-wrap">
        <div class="bar-fill" :class="barClass(hull/100)" :style="{ width: hull + '%' }"></div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Bouclier plasma</div>
        <div class="sw-val" :class="valClass(plasmaShield/100)">{{ plasmaShield >= 80 ? 'ACTIF' : (plasmaShield.toFixed(1) + '%') }}</div>
      </div>
      <div class="bar-wrap">
        <div class="bar-fill bar-cyan" :style="{ width: plasmaShield + '%' }"></div>
      </div>
    </div>

    <div class="side-widget side-widget--signaux">
      <div class="sw-title" :class="{ 'sw-title--no-divider': signauxStore.listWithRemaining.length > 0 }">Signaux captés</div>
      <div v-if="signauxStore.listWithRemaining.length === 0" class="signal-empty">
        Aucun signal.
      </div>
      <div
        v-for="s in signauxStore.listWithRemaining"
        v-else
        :key="s.id"
        class="signal-card"
        :class="{ expired: s.remainingMs <= 0 }"
        @click="onCardClick(s)"
      >
        <button type="button" class="signal-card__dismiss" aria-label="Ignorer" @click="onIgnore($event, s.id)">×</button>
        <div class="signal-card__main">
          {{ s.frequency }} · azimut {{ s.azimuth }}°
        </div>
        <div class="signal-card__meta">{{ receivedAgo(s.createdAt) }}</div>
        <div class="bar-wrap signal-card__bar">
          <div class="bar-fill bar-amber" :style="{ width: s.lifetimePct + '%' }" />
        </div>
      </div>
    </div>

    <div class="side-widget">
      <div class="sw-title">Observatoire</div>
      <div class="sw-row">
        <div class="sw-key">Systèmes résolus</div>
        <div class="sw-val">3</div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Anomalies détectées</div>
        <div class="sw-val warn">2</div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Scan en cours</div>
        <div class="sw-val ok">ACTIF</div>
      </div>
    </div>
  </div>
</template>
