<script setup>
import { computed, watch, onMounted } from 'vue'
import { useShipStore } from '@/stores/ship'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { getStarSvgPath } from '@/assets/stars'
import {
  habitableZoneLimits,
  luminosityFromMass,
  luminosityFromSpectralType,
} from '@/lib/habitableZone'
import { semiMajorAxisFromPeriod } from '@/lib/orbitalUtils'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

const shipStore = useShipStore()
const stellarStore = useStellarSystemsStore()
const systemObjectsStore = useSystemObjectsStore()

const currentSystemId = computed(() => shipStore.currentSystemId ?? 'SOL')

const stellarSystem = computed(() =>
  stellarStore.list.find((s) => s.id === currentSystemId.value)
)

const objects = computed(() =>
  systemObjectsStore.getForSystem(currentSystemId.value)
)

const star = computed(() =>
  objects.value.find((o) => o.type === 'STAR' || o.type === 'PULSAR')
)

const planets = computed(() =>
  objects.value.filter((o) =>
    ['PLANET', 'MOON', 'MINOR_BODY'].includes(o.type)
  )
)

const hasOrbitalData = computed(() =>
  planets.value.some((p) => p.orbital_period_days ?? p.orbital_semi_major_axis_au)
)

const planetsWithDistance = computed(() => {
  return planets.value
    .map((p) => {
      const au =
        p.orbital_semi_major_axis_au ??
        semiMajorAxisFromPeriod(p.orbital_period_days)
      return { ...p, distanceAu: au }
    })
    .sort((a, b) => (a.distanceAu ?? 999) - (b.distanceAu ?? 999))
})

const luminosity = computed(() => {
  if (star.value?.mass_stellar) return luminosityFromMass(star.value.mass_stellar)
  const st = star.value?.spectral_type ?? stellarSystem.value?.spectral_type
  return luminosityFromSpectralType(st)
})

const hzLimits = computed(() => habitableZoneLimits(luminosity.value))

const maxDistance = computed(() => {
  const fromPlanets = Math.max(...planetsWithDistance.value.map((p) => p.distanceAu ?? 0), 0)
  return Math.max(fromPlanets, hzLimits.value.outer * 1.2, 1)
})

watch(currentSystemId, (id) => {
  if (id) systemObjectsStore.fetchForSystem(id)
}, { immediate: true })

onMounted(async () => {
  await ensureStoresLoaded(stellarStore)
  if (!systemObjectsStore.bySystem[currentSystemId.value]?.length) {
    await systemObjectsStore.fetchForSystem(currentSystemId.value)
  }
})
</script>

<template>
  <div class="system-view">
    <div v-if="!star" class="system-view__empty">
      Aucune donnée pour ce système.
    </div>
    <template v-else>
      <div class="system-view__layout">
        <div class="system-view__star">
          <img
            :src="star.type === 'PULSAR' ? getStarSvgPath('PSR') : getStarSvgPath(star.spectral_type)"
            :alt="star.name"
            class="system-view__star-img"
          />
          <span class="system-view__star-name">{{ star.name }}</span>
        </div>
        <div class="system-view__planets">
          <div
            v-if="hasOrbitalData && planetsWithDistance.length"
            class="system-view__orbital"
          >
            <div
              class="system-view__hz-band"
              :style="{
                left: `${(hzLimits.inner / maxDistance) * 100}%`,
                width: `${((hzLimits.outer - hzLimits.inner) / maxDistance) * 100}%`,
              }"
            />
            <div
              v-for="(p, i) in planetsWithDistance"
              :key="p.id"
              class="system-view__planet-orbital"
              :style="{
                left: p.distanceAu ? `${(p.distanceAu / maxDistance) * 100}%` : '50%',
              }"
              :title="`${p.name} ${p.distanceAu ? p.distanceAu.toFixed(2) + ' UA' : ''}`"
            >
              <span class="system-view__planet-dot" :class="{ 'in-hz': p.in_habitable_zone }" />
              <span class="system-view__planet-label">{{ p.designation || p.name }}</span>
            </div>
          </div>
          <div v-else class="system-view__grid">
            <div
              v-for="p in planets"
              :key="p.id"
              class="system-view__planet-slot"
              :title="p.name"
            >
              <span class="system-view__planet-slot-dot" :class="{ 'in-hz': p.in_habitable_zone }" />
              <span class="system-view__planet-slot-name">{{ p.designation || p.name }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!planets.length" class="system-view__no-planets">
        Aucune planète connue dans ce système.
      </div>
    </template>
  </div>
</template>

<style scoped>
.system-view {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sidebar-offset);
  z-index: 1;
}
.system-view__empty,
.system-view__no-planets {
  font-size: var(--text-sm);
  color: var(--color-muted);
}
.system-view__layout {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  max-width: 90%;
  width: 100%;
}
.system-view__star {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}
.system-view__star-img {
  width: 80px;
  height: 80px;
}
.system-view__star-name {
  font-size: var(--text-md);
  color: var(--color-cyan);
  font-family: var(--font-mono);
}
.system-view__planets {
  flex: 1;
  min-width: 0;
}
.system-view__orbital {
  position: relative;
  height: 80px;
  background: rgba(0, 0, 0, 0.3);
  border: var(--border-width) solid var(--border-default);
  border-radius: var(--border-radius-md);
}
.system-view__hz-band {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(0, 180, 200, 0.15);
  border-radius: 2px;
  pointer-events: none;
}
.system-view__planet-orbital {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.system-view__planet-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-muted);
  border: 1px solid var(--border-default);
}
.system-view__planet-dot.in-hz {
  background: var(--color-cyan);
  border-color: var(--color-cyan);
}
.system-view__planet-label {
  font-size: var(--text-xs);
  color: var(--color-muted);
}
.system-view__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}
.system-view__planet-slot {
  aspect-ratio: 1;
  border: var(--border-width) solid var(--border-default);
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  position: relative;
}
.system-view__planet-slot-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-muted);
  border: 1px solid var(--border-default);
}
.system-view__planet-slot-dot.in-hz {
  background: var(--color-cyan);
  border-color: var(--color-cyan);
}
.system-view__planet-slot-name {
  font-size: var(--text-sm);
  color: var(--color-muted);
  text-align: center;
}
</style>
