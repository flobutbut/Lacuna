<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useSignauxStore } from '@/stores/signaux'
import { useUIStore } from '@/stores/ui'

const signauxStore = useSignauxStore()
const ui = useUIStore()

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
onMounted(() => {
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
        <div class="sw-val ok">NOMINAL</div>
      </div>
      <div class="bar-wrap">
        <div class="bar-fill bar-green" style="width: 88%"></div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Carburant He³</div>
        <div class="sw-val warn">74.2%</div>
      </div>
      <div class="bar-wrap">
        <div class="bar-fill bar-amber" style="width: 74%"></div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Intégrité coque</div>
        <div class="sw-val ok">97.1%</div>
      </div>
      <div class="bar-wrap">
        <div class="bar-fill bar-green" style="width: 97%"></div>
      </div>
      <div class="sw-row">
        <div class="sw-key">Bouclier plasma</div>
        <div class="sw-val ok">ACTIF</div>
      </div>
      <div class="bar-wrap">
        <div class="bar-fill bar-cyan" style="width: 100%"></div>
      </div>
    </div>

    <div class="side-widget side-widget--signaux">
      <div class="sw-title">Signaux captés</div>
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
        <div class="signal-card__tooltip">
          <div class="signal-card__tooltip-title">Signal capté</div>
          <div class="signal-card__tooltip-row"><span>Fréquence</span><span>{{ s.frequency }}</span></div>
          <div class="signal-card__tooltip-row"><span>Direction</span><span>azimut {{ s.azimuth }}° · plan {{ s.elevation >= 0 ? '+' : '' }}{{ s.elevation }}°</span></div>
          <div class="signal-card__tooltip-row"><span>Distance est.</span><span>{{ s.distanceEst ?? '—' }}</span></div>
          <div class="signal-card__tooltip-row"><span>Reçu le</span><span>{{ s.receivedAt }}</span></div>
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
