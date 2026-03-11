<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()
const ORIGIN = { ra: 180, dec: 0 }

function formatRaDec(ra, dec) {
  const raH = (ra ?? 0) / 15
  const h = Math.floor(raH)
  const m = Math.floor((raH - h) * 60)
  const s = Math.floor(((raH - h) * 60 - m) * 60)
  const decSign = (dec ?? 0) >= 0 ? '+' : '−'
  const decAbs = Math.abs(dec ?? 0)
  const decDeg = Math.floor(decAbs)
  const decMin = Math.floor((decAbs - decDeg) * 60)
  return `α ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s  δ ${decSign}${decDeg}° ${String(decMin).padStart(2, '0')}′`
}

const display = computed(() => {
  const vd = ui.viewDirection?.value ?? ui.viewDirection ?? ORIGIN
  return formatRaDec(vd.ra, vd.dec)
})

function resetToOrigin() {
  // Ne modifie que la cible : SkyCanvas interpole viewDirection vers target (lerp)
  ui.setTargetViewDirectionValue({ ...ORIGIN })
}
</script>

<template>
  <button
    type="button"
    class="observatoire-azimuth"
    :title="'Direction de vue · Clic : revenir à la vue d\'origine'"
    @click="resetToOrigin"
  >
    {{ display }}
  </button>
</template>

<style scoped>
.observatoire-azimuth {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: auto;
  font-family: var(--font-mono, 'Share Tech Mono', monospace);
  font-size: 12px;
  color: rgba(204, 221, 232, 0.75);
  letter-spacing: 0.04em;
  background: none;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 0.2s;
}
.observatoire-azimuth:hover {
  color: rgba(204, 221, 232, 1);
}
</style>
