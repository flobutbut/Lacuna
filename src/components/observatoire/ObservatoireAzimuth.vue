<script setup>
import { computed } from 'vue'
import { useObservatoireStore } from '@/stores/observatoire'
import { formatRaDec } from '@/lib/formatUtils'

const observatoireStore = useObservatoireStore()
const ORIGIN = { ra: 180, dec: 0 }

const display = computed(() => {
  const vd = observatoireStore.viewDirection?.value ?? observatoireStore.viewDirection ?? ORIGIN
  return formatRaDec(vd.ra, vd.dec)
})

function resetToOrigin() {
  // Ne modifie que la cible : SkyCanvas interpole viewDirection vers target (lerp)
  observatoireStore.setTargetViewDirectionValue({ ...ORIGIN })
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
  font-size: var(--text-sm);
  color: color-mix(in srgb, var(--color-white) 75%, transparent);
  letter-spacing: var(--tracking-normal);
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
