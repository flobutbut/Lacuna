<script setup>
import { useUIStore } from '@/stores/ui'
import ProgressBar from '@/components/ProgressBar.vue'

const ui = useUIStore()

const statuses = [
  { label: 'Éducation — fonctionnelle', ok: true },
  { label: 'Soins médicaux — nominal', ok: true },
  { label: 'Gouvernance — tension mineure', ok: false },
  { label: 'Culture — active', ok: true },
]
</script>

<template>
  <div class="panel-overlay" :class="{ open: ui.activePanel === 'pop' }" style="top: 60px; right: 220px">
    <div class="panel-box">
      <div class="panel-header">
        <div class="panel-title">Population — Génération I</div>
        <button type="button" class="panel-close btn-close" @click="ui.closePanel('pop')">✕</button>
      </div>
      <div class="panel-body">
        <div class="pop-bar-row">
          <div class="pop-bar-header">
            <span class="pop-bar-label">Effectif total</span>
            <span class="pop-bar-val">10 247</span>
          </div>
        </div>
        <div class="pop-bar-row">
          <div class="pop-bar-header">
            <span class="pop-bar-label">Volonté collective</span>
            <span class="pop-bar-val" style="color: var(--color-green)">HAUTE — 82%</span>
          </div>
          <ProgressBar :value="82" color="green" pct />
        </div>
        <div class="pop-bar-row">
          <div class="pop-bar-header">
            <span class="pop-bar-label">Ressources alimentaires</span>
            <span class="pop-bar-val" style="color: var(--color-green)">91%</span>
          </div>
          <ProgressBar :value="91" color="green" pct />
        </div>
        <div class="pop-bar-row">
          <div class="pop-bar-header">
            <span class="pop-bar-label">Cohésion sociale</span>
            <span class="pop-bar-val" style="color: var(--color-amber)">67%</span>
          </div>
          <ProgressBar :value="67" color="amber" pct />
        </div>
        <div style="margin-top: 12px; border-top: 1px solid var(--border-default); padding-top: 10px">
          <div class="panel-section-title" style="margin-bottom: 8px">État des systèmes sociaux</div>
          <div
            v-for="(s, i) in statuses"
            :key="i"
            class="status-row"
          >
            <div class="status-dot" :class="s.ok ? 'ok' : 'warn'"></div>
            <div class="status-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
