<script setup>
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()

const artefacts = [
  { icon: '📡', name: 'WOW-1977', notif: 'WOW-1977-A — Signal radio 1420 MHz — 72s durée', unread: true },
  { icon: '◇', name: 'OUMUAMUA', notif: 'OUMUAMUA — Objet interstellaire — Accélération non-gravitationnelle', unread: true },
  { icon: '⬡', name: 'BENNU-NB', notif: 'BENNU-NB — Nucléobases ARN — Ryugu confirmé', unread: false },
]

function onArtefactClick(notif) {
  ui.showNotification(notif)
}
</script>

<template>
  <div class="panel-overlay" :class="{ open: ui.activePanel === 'art' }" style="top: 60px; right: 220px">
    <div class="panel-box">
      <div class="panel-header">
        <div class="panel-title">Collection d'Artefacts</div>
        <button type="button" class="panel-close btn-close" @click="ui.closePanel('art')">✕</button>
      </div>
      <div class="panel-body">
        <div
          class="panel-section-title"
          style="margin-bottom: 12px"
        >
          3 artefacts collectés — 2 non interprétés
        </div>
        <div class="artifact-grid">
          <div
            v-for="(art, i) in artefacts"
            :key="i"
            class="artifact-slot"
            @click="onArtefactClick(art.notif)"
          >
            <div class="art-icon">{{ art.icon }}</div>
            <div class="art-name">{{ art.name }}</div>
            <div v-if="art.unread" class="art-dot"></div>
          </div>
          <div v-for="i in 3" :key="'empty-' + i" class="artifact-slot empty">
            <div class="art-icon" style="opacity: 0.2">?</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
