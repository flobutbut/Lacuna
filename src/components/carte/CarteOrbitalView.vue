<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { toPhysicalUnits, toLuminosityAndHz } from '@/lib/systemObjectConverters'
import { getPlanetSvgPathForObject } from '@/assets/illustrations/planets'
import { getStarSvgPath } from '@/assets/illustrations/stars'

const props = defineProps({
  systemId: { type: String, default: '' },
  systemName: { type: String, default: '' },
  spectralType: { type: String, default: 'G2V' },
})

const emit = defineEmits(['select-planet', 'select-star'])

const systemObjectsStore = useSystemObjectsStore()
const stellarStore = useStellarSystemsStore()
const containerRef = ref(null)

const MIN_BODY_DIAMETER_PX = 16
const MAX_BODY_DIAMETER_PX = 128
const MIN_DISTANCE_AU = 0.001

const size = ref(320)

const stellarSystem = computed(() =>
  stellarStore.list.find((s) => s.id === props.systemId)
)

const objects = computed(() =>
  systemObjectsStore.getForSystem(props.systemId)
)

const star = computed(() =>
  objects.value?.find((o) => o.type === 'STAR' || o.type === 'PULSAR')
)

const planets = computed(() =>
  (objects.value || []).filter((o) =>
    ['PLANET', 'MOON', 'MINOR_BODY'].includes(o.type)
  )
)

const planetsWithDistance = computed(() => {
  return planets.value
    .map((p) => {
      const { distanceAu } = toPhysicalUnits(p)
      return { ...p, distanceAu }
    })
    .filter((p) => p.distanceAu != null && p.distanceAu > 0)
    .sort((a, b) => (a.distanceAu ?? 999) - (b.distanceAu ?? 999))
})

/** Règle de base : plus petit astre = 16px, plus gros = 128px. Le reste en découle (échelle log). */

/** Rayons (R⊕) des corps affichés : étoile + planètes */
const allBodyRadii = computed(() => {
  const radii = []
  const s = star.value
  if (s) {
    const r = toPhysicalUnits(s).radiusEarth
    if (r != null && Number(r) > 0) radii.push(Number(r))
  }
  planetsWithDistance.value.forEach((p) => {
    const r = toPhysicalUnits(p).radiusEarth
    if (r != null && Number(r) > 0) radii.push(Number(r))
  })
  return radii
})

const minBodyRadius = computed(() =>
  allBodyRadii.value.length > 0 ? Math.min(...allBodyRadii.value) : 0.3
)
const maxBodyRadius = computed(() =>
  allBodyRadii.value.length > 0 ? Math.max(...allBodyRadii.value) : 11
)

/** Diamètre corps : astre le plus petit → 16px, le plus gros → 128px, échelle log10(1+x) */
function radiusToDiameterPx(radiusEarth) {
  const r = Number(radiusEarth)
  if (!Number.isFinite(r) || r <= 0) return MIN_BODY_DIAMETER_PX
  const minR = minBodyRadius.value
  const maxR = maxBodyRadius.value
  if (maxR <= minR) return (MIN_BODY_DIAMETER_PX + MAX_BODY_DIAMETER_PX) / 2
  const logMin = Math.log10(1 + minR)
  const logMax = Math.log10(1 + maxR)
  const logRange = Math.max(0.001, logMax - logMin)
  const t = Math.max(0, Math.min(1, (Math.log10(1 + r) - logMin) / logRange))
  const px = Math.round(MIN_BODY_DIAMETER_PX + t * (MAX_BODY_DIAMETER_PX - MIN_BODY_DIAMETER_PX))
  return Math.max(MIN_BODY_DIAMETER_PX, Math.min(MAX_BODY_DIAMETER_PX, px))
}

const center = computed(() => size.value / 2)

const starDiameterPx = computed(() => {
  const s = star.value
  if (!s) return MIN_BODY_DIAMETER_PX
  const r = toPhysicalUnits(s).radiusEarth
  return radiusToDiameterPx(r != null ? Number(r) : 109)
})

/** Échelle distances : min = bord extérieur de l'étoile + marge, max = limites du conteneur */
const ORBIT_MARGIN_PX = 12
const ORBIT_EDGE_MARGIN_PX = 16
/** Rayon de la 1ère orbite (px) = rayon étoile + marge — garantit que l'orbite ne coupe pas l'étoile */
const orbitStartPx = computed(() => {
  const starRadius = starDiameterPx.value / 2
  return starRadius + ORBIT_MARGIN_PX
})
const orbitEndPx = computed(() =>
  Math.max(orbitStartPx.value + 20, size.value / 2 - ORBIT_EDGE_MARGIN_PX - MAX_BODY_DIAMETER_PX / 2)
)
const orbitTrackWidth = computed(() =>
  Math.max(10, orbitEndPx.value - orbitStartPx.value)
)

const minDistanceAu = computed(() => {
  const d = planetsWithDistance.value.map((p) => p.distanceAu).filter((x) => x != null && x > 0)
  return d.length > 0 ? Math.min(...d, MIN_DISTANCE_AU) : MIN_DISTANCE_AU
})
const maxDistanceAu = computed(() => {
  const d = planetsWithDistance.value.map((p) => p.distanceAu ?? 0).filter((x) => x > 0)
  return d.length > 0 ? Math.max(...d, 1) : 1
})

/** Distance orbitale (AU) → rayon px. Échelle log. Min = au-delà de l'étoile, max = 128px */
function distanceAuToPx(distanceAu) {
  if (distanceAu == null || distanceAu < 0) return orbitStartPx.value
  const d = Math.max(distanceAu, MIN_DISTANCE_AU)
  const minD = minDistanceAu.value
  const maxD = maxDistanceAu.value
  if (maxD <= minD) return orbitStartPx.value
  const logMin = Math.log10(1 + minD)
  const logMax = Math.log10(1 + maxD)
  const logRange = Math.max(0.001, logMax - logMin)
  const t = Math.max(0, Math.min(1, (Math.log10(1 + d) - logMin) / logRange))
  return orbitStartPx.value + t * orbitTrackWidth.value
}

const starSvgPath = computed(() =>
  getStarSvgPath(props.spectralType || star.value?.spectral_type || 'G2V')
)

/** Zone habitable (AU) — Kopparapu et al., dérivée de la luminosité stellaire */
const hzLimits = computed(() => {
  const { hzInner, hzOuter } = toLuminosityAndHz(star.value, stellarSystem.value)
  return { inner: hzInner, outer: hzOuter }
})

/** Path SVG pour la bande zone habitable (anneau entre inner et outer) */
const hzBandPath = computed(() => {
  const rOuter = distanceAuToPx(hzLimits.value.outer)
  const rInner = distanceAuToPx(hzLimits.value.inner)
  if (rInner >= rOuter) return ''
  // Anneau : cercle externe (sens horaire) + cercle interne (sens anti-horaire), fill-rule evenodd
  return `M ${rOuter} 0 A ${rOuter} ${rOuter} 0 1 1 ${-rOuter} 0 A ${rOuter} ${rOuter} 0 1 1 ${rOuter} 0 M ${rInner} 0 A ${rInner} ${rInner} 0 1 0 ${-rInner} 0 A ${rInner} ${rInner} 0 1 0 ${rInner} 0`
})

const planetsWithSize = computed(() =>
  planetsWithDistance.value.map((p) => {
    const r = toPhysicalUnits(p).radiusEarth
    const diameterPx = radiusToDiameterPx(r != null ? Number(r) : 0.3)
    return {
      ...p,
      diameterPx,
      a: p.distanceAu,
      e: Math.min(0.99, Math.max(0, Number(p.orbital_eccentricity) ?? 0)),
    }
  })
)

const viewBox = computed(() => {
  const s = size.value
  return `0 0 ${s} ${s}`
})

/** Position planète sur son orbite (cercle) — planète toujours sur le cercle */
function getPlanetPosition(p, index = 0) {
  const rPx = distanceAuToPx(p.a ?? 0)
  const n = planetsWithSize.value.length
  const angle = n > 0 ? (2 * Math.PI * index) / n : 0
  return {
    x: center.value + rPx * Math.cos(angle),
    y: center.value - rPx * Math.sin(angle),
  }
}

/** Orbite en cercle (planète toujours sur l'orbite) */
function getOrbitR(p) {
  return distanceAuToPx(p.a ?? 0)
}

function onPlanetClick(p, e) {
  e.stopPropagation()
  emit('select-planet', p)
}

function onStarClick() {
  emit('select-star')
}

async function load() {
  if (!props.systemId) return
  // Toujours recharger : le cache peut être partiel (fetchAll limité à 1000 lignes Supabase)
  await systemObjectsStore.fetchForSystem(props.systemId)
}

watch(
  () => props.systemId,
  () => load(),
  { immediate: true }
)

onMounted(() => {
  if (containerRef.value) {
    const updateSize = () => {
      if (!containerRef.value) return
      const rect = containerRef.value.getBoundingClientRect()
      const w = rect.width || 320
      const h = rect.height || 280
      const s = Math.min(w, h) || 320
      // Vue au moins 256px pour contenir les orbites (rayon max 128px)
      size.value = Math.max(2 * MAX_BODY_DIAMETER_PX, s)
    }
    updateSize()
    requestAnimationFrame(updateSize)
    const ro = new ResizeObserver(updateSize)
    ro.observe(containerRef.value)
  }
})
</script>

<template>
  <div ref="containerRef" class="carte-orbital">
    <div v-if="!systemId" class="carte-orbital__empty">
      Sélectionnez un système.
    </div>
    <template v-else>
      <svg
        class="carte-orbital__svg"
        :viewBox="viewBox"
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
      >
        <g>
          <!-- Zone habitable (bande entre hzInner et hzOuter) — comme SystemView Observatoire -->
          <g v-if="planetsWithDistance.length && hzBandPath" :transform="`translate(${center}, ${center})`">
            <path
              :d="hzBandPath"
              fill-rule="evenodd"
              class="carte-orbital__hz-band"
            />
          </g>
          <!-- Orbites en cercles (échelle logarithmique) -->
          <circle
            v-for="(p, i) in planetsWithSize"
            :key="'orbit-' + i"
            :cx="center"
            :cy="center"
            :r="getOrbitR(p)"
            fill="none"
            :stroke="p.in_habitable_zone ? 'var(--color-cyan)' : 'var(--color-muted)'"
            :stroke-opacity="p.in_habitable_zone ? 0.6 : 0.35"
            stroke-width="1"
          />
          <!-- Étoile au centre -->
          <g
            class="carte-orbital__star"
            @click="onStarClick"
          >
            <image
              :href="starSvgPath"
              :x="center - starDiameterPx / 2"
              :y="center - starDiameterPx / 2"
              :width="starDiameterPx"
              :height="starDiameterPx"
              class="carte-orbital__body-img"
            />
          </g>
          <!-- Planètes (tailles via toVisualParams) -->
          <g
            v-for="(p, i) in planetsWithSize"
            :key="'planet-' + i"
            class="carte-orbital__planet"
            :transform="`translate(${getPlanetPosition(p, i).x}, ${getPlanetPosition(p, i).y})`"
            @click="onPlanetClick(p, $event)"
          >
            <image
              v-if="getPlanetSvgPathForObject(p)"
              :href="getPlanetSvgPathForObject(p)"
              :x="-p.diameterPx / 2"
              :y="-p.diameterPx / 2"
              :width="p.diameterPx"
              :height="p.diameterPx"
              class="carte-orbital__body-img carte-orbital__body-img--planet"
            />
            <circle
              v-else
              cx="0"
              cy="0"
              :r="p.diameterPx / 2"
              fill="var(--color-cyan-muted)"
            />
          </g>
        </g>
      </svg>
      <div v-if="planetsWithDistance.length === 0 && systemId" class="carte-orbital__no-planets">
        Aucune planète connue.
      </div>
    </template>
  </div>
</template>

<style scoped>
.carte-orbital {
  flex: 1;
  min-width: 200px;
  min-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.carte-orbital__empty,
.carte-orbital__no-planets {
  color: var(--color-muted);
  font-size: var(--text-base);
  position: absolute;
}

.carte-orbital__no-planets {
  pointer-events: none;
}

.carte-orbital__svg {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 200px;
  min-height: 200px;
  aspect-ratio: 1;
}

.carte-orbital__star,
.carte-orbital__planet {
  cursor: pointer;
  transition: opacity var(--transition-base);
}

.carte-orbital__star:hover,
.carte-orbital__planet:hover {
  opacity: 1;
}

.carte-orbital__planet {
  opacity: 0.9;
}

.carte-orbital__hz-band {
  fill: rgba(0, 180, 200, 0.12);
}

.carte-orbital__body-img {
  pointer-events: none;
}

.carte-orbital__body-img--planet {
  cursor: pointer;
  pointer-events: auto;
}
</style>
