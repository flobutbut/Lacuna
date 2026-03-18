<script setup>
import { computed } from 'vue'
import { useUIStore } from '@/stores/ui'
import { formatRaDec } from '@/lib/formatUtils'

const ui = useUIStore()
const ORIGIN = { ra: 180, dec: 0 }

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
  font-family: var(--font-mono);
  font-size: 12px;
  color: rgba(204, 221, 232, 0.75);
  letter-spacing: 0.04em;
  background: none;
  border: none;
  padding: var(--space-3) var(--space-6);
  cursor: pointer;
  transition: color 0.2s;
}
.observatoire-azimuth:hover {
  color: var(--color-white);
}
</style>
