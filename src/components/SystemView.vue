<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useShipStore } from '@/stores/ship'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import StarSvgInline from '@/components/StarSvgInline.vue'
import PlanetSvgInline from '@/components/PlanetSvgInline.vue'
import {
  toPhysicalUnits,
  toVisualParams,
  toLuminosityAndHz,
} from '@/lib/systemObjectConverters'
import { ensureStoresLoaded } from '@/composables/useStoreReady'

/** Référence : diamètre de la plus petite planète du système */
const MIN_PLANET_DIAMETER_PX = 4
/** Largeur de la piste orbitale (px) — échelle logarithmique pour cohérence tailles/distances */
const ORBITAL_TRACK_WIDTH_PX = 1200
/** Distance min (UA) pour le log — évite log(0), ex. Mercure 0.39 ou systèmes compacts */
const MIN_DISTANCE_AU = 0.01
/** Anneaux : facteur × rayon planète (doit être > 1 pour dépasser la planète) */
const RING_FACTOR = 1.5
/** Anneaux : épaisseur minimale (px) pour visibilité */
const RING_STROKE_MIN_PX = 3

/** Dimensions des anneaux indexées sur la taille de la planète */
function ringSizeForPlanet(diameterPx) {
  const radius = diameterPx / 2
  const ringRadius = Math.max(10, radius * RING_FACTOR)
  const stroke = Math.max(RING_STROKE_MIN_PX, diameterPx * 0.15)
  return { radius: ringRadius, stroke, size: Math.ceil((ringRadius + stroke) * 2) }
}

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
  planets.value.some((p) => toPhysicalUnits(p).distanceAu != null)
)

const planetsWithDistance = computed(() => {
  return planets.value
    .map((p) => {
      const { distanceAu } = toPhysicalUnits(p)
      return { ...p, distanceAu }
    })
    .sort((a, b) => (a.distanceAu ?? 999) - (b.distanceAu ?? 999))
})

const luminosityAndHz = computed(() =>
  toLuminosityAndHz(star.value, stellarSystem.value)
)
const luminosity = computed(() => luminosityAndHz.value.luminosity)
const hzLimits = computed(() => ({
  inner: luminosityAndHz.value.hzInner,
  outer: luminosityAndHz.value.hzOuter,
}))

const maxDistance = computed(() => {
  const fromPlanets = Math.max(...planetsWithDistance.value.map((p) => p.distanceAu ?? 0), 0)
  return Math.max(fromPlanets, hzLimits.value.outer * 1.2, 1)
})

/** Rayon (R⊕) de la plus petite planète — référence pour l'échelle (fallback 0.3 si aucune planète) */
const minPlanetRadius = computed(() => {
  const radii = planets.value
    .map((p) => toPhysicalUnits(p).radiusEarth)
    .filter((r) => r != null && r > 0)
  return radii.length > 0 ? Math.min(...radii) : 0.3
})

/**
 * Échelle : px par rayon terrestre.
 * Plus petite planète : diamètre 4px → rayon 2px = minPlanetRadius * scale
 * → scale = 2 / minPlanetRadius
 */
const scalePxPerEarthRadius = computed(() =>
  minPlanetRadius.value > 0 ? MIN_PLANET_DIAMETER_PX / (2 * minPlanetRadius.value) : 2
)

/** Contexte d'échelle pour toVisualParams (distancePx non utilisé — on utilise distanceAuToPx) */
const visualCtx = computed(() => ({
  scalePxPerAu: 80,
  scalePxPerEarthRadius: scalePxPerEarthRadius.value,
}))

/** Distance planète la plus proche (UA) — pour borne inférieure du log */
const minDistanceAu = computed(() => {
  const dists = planetsWithDistance.value
    .map((p) => p.distanceAu)
    .filter((d) => d != null && d > 0)
  return dists.length > 0 ? Math.min(...dists, MIN_DISTANCE_AU) : MIN_DISTANCE_AU
})

/** Offset (px) depuis le centre du Soleil — première planète juste après le disque solaire */
const orbitStartPx = computed(() => starSizePx.value / 2 + 24)

/**
 * Convertit distance (UA) en position px depuis le centre du Soleil — échelle logarithmique.
 * Garantit que la planète la plus proche est au-delà du disque solaire.
 */
function distanceAuToPx(distanceAu) {
  if (distanceAu == null || distanceAu < 0) return orbitStartPx.value
  const d = Math.max(distanceAu, 0.001)
  const logD = Math.log10(1 + d)
  const logMin = Math.log10(1 + minDistanceAu.value)
  const logMax = Math.log10(1 + maxDistance.value)
  if (logMax <= logMin) return orbitStartPx.value
  const t = (logD - logMin) / (logMax - logMin)
  return orbitStartPx.value + t * ORBITAL_TRACK_WIDTH_PX
}


/** Diamètre de l'étoile en px — même échelle réelle que les planètes (R⊕ → px) */
const starSizePx = computed(() => {
  if (!star.value) return 80
  const v = toVisualParams(star.value, visualCtx.value, {
    minDiameterPx: MIN_PLANET_DIAMETER_PX,
  })
  return v.diameterPx ?? 80
})

const planetsWithSize = computed(() =>
  planetsWithDistance.value.map((p) => {
    const v = toVisualParams(p, visualCtx.value, {
      minDiameterPx: MIN_PLANET_DIAMETER_PX,
    })
    const diameterPx = Math.round(v.diameterPx)
    const hasRings = !!(v.ringAttrs || p.has_rings)
    const ringSize = hasRings ? ringSizeForPlanet(diameterPx) : null
    return {
      ...p,
      radiusEarth: v.radiusEarth,
      diameterPx,
      ringGeometry: v.ringGeometry,
      ringAttrs: v.ringAttrs,
      ringSize,
    }
  })
)

const planetsForGrid = computed(() =>
  planets.value.map((p) => {
    const v = toVisualParams(p, visualCtx.value, {
      minDiameterPx: MIN_PLANET_DIAMETER_PX,
    })
    return {
      ...p,
      radiusEarth: v.radiusEarth,
      diameterPx: Math.round(v.diameterPx),
    }
  })
)

/** Rayon max des orbites (px) — pour dimensionner la hauteur et éviter la troncature */
const maxOrbitRadiusPx = computed(() => {
  if (!hasOrbitalData.value || !planetsWithDistance.value.length) return 0
  return distanceAuToPx(maxDistance.value)
})

const SCALE_BAR_HEIGHT = 40
const orbitalHeightPx = computed(() => {
  const maxPlanet = Math.max(
    ...planetsWithSize.value.map((p) => p.diameterPx),
    MIN_PLANET_DIAMETER_PX
  )
  const maxRing = Math.max(
    ...planetsWithSize.value
      .filter((p) => p.ringSize)
      .map((p) => p.ringSize.size),
    0
  )
  const ideal = Math.max(
    80,
    maxPlanet + 28,
    maxRing + 16,
    2 * maxOrbitRadiusPx.value
  )
  const available = bodyHeight.value > 0
    ? bodyHeight.value - SCALE_BAR_HEIGHT - 24
    : ideal
  return Math.min(ideal, Math.max(available, 80))
})

const bodyRef = ref(null)
const bodyHeight = ref(0)

/** Largeur de la piste orbitale en px — orbitStart + zone logarithmique */
const orbitalTrackWidthPx = computed(() =>
  Math.ceil(orbitStartPx.value + ORBITAL_TRACK_WIDTH_PX)
)

/** Décalage de l'origine vers la gauche — 10 % de la taille de l'étoile */
const viewOriginOffsetPx = computed(() => Math.round(starSizePx.value * 0.1))

/** Largeur du contenu (sans l'offset) */
const contentInnerWidthPx = computed(() =>
  starSizePx.value +
  (hasOrbitalData.value && planetsWithDistance.value.length
    ? orbitalTrackWidthPx.value + 80
    : 400)
)

/** Largeur totale du contenu scrollable (inclut l'offset gauche) */
const scrollContentWidthPx = computed(() =>
  viewOriginOffsetPx.value + contentInnerWidthPx.value
)

/** Centre des orbites (Soleil) en px depuis la gauche du layout-inner */
const orbitCenterX = computed(() => starSizePx.value / 2)

/** Centre Y des orbites (milieu de la bande orbitale) */
const orbitCenterY = computed(() => orbitalHeightPx.value / 2)

/** Origine de l'échelle : surface du Soleil (bord droit du disque) — 1 UA = distance surface → Terre */
const scaleOriginPx = computed(() => orbitCenterX.value + starSizePx.value / 2)

/** Graduations pour l'échelle des distances (UA) — 0 à la surface du Soleil */
const scaleTicks = computed(() => {
  const min = minDistanceAu.value
  const max = maxDistance.value
  if (max <= min || !hasOrbitalData.value) return []
  const base = [0, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100]
  return base
    .filter((au) => au === 0 || (au >= min * 0.9 && au <= max * 1.1))
    .map((au) => {
      const pxFromCenter = au === 0 ? 0 : distanceAuToPx(au)
      const pxFromSurface = pxFromCenter - starSizePx.value / 2
      if (au > 0 && pxFromSurface < 0) return null
      return {
        au,
        label: au === 0 ? '0' : (au < 1 || !Number.isInteger(au) ? au.toFixed(1) : String(au)) + ' UA',
        px: au === 0 ? 0 : pxFromSurface,
      }
    })
    .filter(Boolean)
})


watch(currentSystemId, (id) => {
  if (id) systemObjectsStore.fetchForSystem(id)
}, { immediate: true })

let resizeObserver = null
onMounted(async () => {
  await ensureStoresLoaded(stellarStore)
  if (!systemObjectsStore.bySystem[currentSystemId.value]?.length) {
    await systemObjectsStore.fetchForSystem(currentSystemId.value)
  }
  resizeObserver = new ResizeObserver((entries) => {
    for (const e of entries) {
      bodyHeight.value = e.contentRect.height
    }
  })
  if (bodyRef.value) resizeObserver.observe(bodyRef.value)
})
onBeforeUnmount(() => {
  if (resizeObserver && bodyRef.value) resizeObserver.unobserve(bodyRef.value)
})

</script>

<template>
  <div class="system-view">
    <div v-if="!star" class="system-view__empty">
      Aucune donnée pour ce système.
    </div>
    <template v-else>
      <div ref="bodyRef" class="system-view__body">
        <div class="system-view__orbital-scroll">
          <div
            class="system-view__content"
            :style="{
              paddingLeft: viewOriginOffsetPx + 'px',
              width: contentInnerWidthPx + 'px',
              minWidth: '100%',
            }"
          >
            <div class="system-view__layout">
              <div
                class="system-view__layout-inner"
                :style="{
                  width: contentInnerWidthPx + 'px',
                  minWidth: contentInnerWidthPx + 'px',
                  minHeight: hasOrbitalData && planetsWithDistance.length ? orbitalHeightPx + 'px' : undefined,
                }"
              >
                <div class="system-view__orbital-row">
          <!-- Calque SVG : orbites et zone habitable (cercles centrés sur le Soleil) -->
          <svg
            v-if="hasOrbitalData && planetsWithDistance.length"
            class="system-view__orbits-svg"
            :width="contentInnerWidthPx"
            :height="orbitalHeightPx"
            :viewBox="`0 0 ${contentInnerWidthPx} ${orbitalHeightPx}`"
            overflow="visible"
          >
            <g :transform="`translate(${orbitCenterX}, ${orbitCenterY})`">
              <!-- Zone habitable : bande remplie entre inner et outer -->
              <path
                :d="`M ${distanceAuToPx(hzLimits.outer)} 0 A ${distanceAuToPx(hzLimits.outer)} ${distanceAuToPx(hzLimits.outer)} 0 1 1 ${-distanceAuToPx(hzLimits.outer)} 0 A ${distanceAuToPx(hzLimits.outer)} ${distanceAuToPx(hzLimits.outer)} 0 1 1 ${distanceAuToPx(hzLimits.outer)} 0 M ${distanceAuToPx(hzLimits.inner)} 0 A ${distanceAuToPx(hzLimits.inner)} ${distanceAuToPx(hzLimits.inner)} 0 1 0 ${-distanceAuToPx(hzLimits.inner)} 0 A ${distanceAuToPx(hzLimits.inner)} ${distanceAuToPx(hzLimits.inner)} 0 1 0 ${distanceAuToPx(hzLimits.inner)} 0`"
                fill-rule="evenodd"
                class="system-view__hz-band"
              />
              <!-- Orbite de chaque planète (échelle logarithmique) -->
              <circle
                v-for="p in planetsWithSize"
                :key="'orbit-' + p.id"
                cx="0"
                cy="0"
                :r="distanceAuToPx(p.distanceAu ?? 0)"
                class="system-view__orbit system-view__orbit--planet"
              />
            </g>
          </svg>
          <!-- Soleil : origine de l'échelle des distances (0 UA), taille à l'échelle comme les planètes -->
          <div
            class="system-view__star"
            :style="{
              width: starSizePx + 'px',
              minWidth: starSizePx + 'px',
              height: starSizePx + 'px',
            }"
          >
            <div class="system-view__star-wrapper">
              <StarSvgInline
                :spectral-type="star.type === 'PULSAR' ? 'PSR' : (star.spectral_type || 'G2V')"
                class="system-view__star-svg"
              />
            </div>
          </div>
          <div
            v-if="hasOrbitalData && planetsWithDistance.length"
            class="system-view__orbital-wrap"
            :style="{ width: orbitalTrackWidthPx + 'px' }"
          >
            <div
              class="system-view__orbital-track"
              :style="{
                marginLeft: -orbitCenterX + 'px',
                width: orbitalTrackWidthPx + 'px',
                height: orbitalHeightPx + 'px',
              }"
            >
              <div
                v-for="(p, i) in planetsWithSize"
                :key="p.id"
                class="system-view__planet-orbital"
                :style="{ left: distanceAuToPx(p.distanceAu ?? 0) + 'px' }"
                :title="`${p.name} ${p.distanceAu ? p.distanceAu.toFixed(2) + ' UA' : ''} — ${p.radiusEarth.toFixed(2)} R⊕${p.ringAttrs ? ' · Anneaux' : ''}`"
              >
                <div
                  class="system-view__planet-center"
                  :style="{
                    width: (p.ringSize ? Math.max(p.diameterPx, p.ringSize.size) : p.diameterPx) + 'px',
                    height: (p.ringSize ? Math.max(p.diameterPx, p.ringSize.size) : p.diameterPx) + 'px',
                  }"
                >
                  <span
                    class="system-view__planet-dot"
                    :class="{ 'in-hz': p.in_habitable_zone }"
                  >
                    <PlanetSvgInline :planet="p" :diameter="p.diameterPx" />
                  </span>
                  <svg
                    v-if="p.ringSize"
                    class="system-view__planet-rings"
                    :width="p.ringSize.size"
                    :height="p.ringSize.size"
                    :viewBox="`0 0 ${p.ringSize.size} ${p.ringSize.size}`"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <circle
                      :cx="p.ringSize.size / 2"
                      :cy="p.ringSize.size / 2"
                      :r="p.ringSize.radius - p.ringSize.stroke / 2"
                      stroke="rgba(220, 190, 140, 0.2)"
                      :stroke-width="p.ringSize.stroke"
                      fill="none"
                      class="system-view__ring"
                    />
                  </svg>
                </div>
                <span class="system-view__planet-label">{{ p.designation || p.name }}</span>
              </div>
            </div>
          </div>
          <div v-else class="system-view__grid">
            <div
              v-for="p in planetsForGrid"
              :key="p.id"
              class="system-view__planet-slot"
              :title="`${p.name} — ${p.radiusEarth.toFixed(2)} R⊕`"
            >
              <span
                class="system-view__planet-slot-dot"
                :class="{ 'in-hz': p.in_habitable_zone }"
              >
                <PlanetSvgInline :planet="p" :diameter="p.diameterPx" />
              </span>
              <span class="system-view__planet-slot-name">{{ p.designation || p.name }}</span>
            </div>
            </div>
          </div>
          </div>
            <!-- Échelle : position absolute, en bas, left = tangente droite du Soleil, suit le scroll -->
            <div
              v-if="hasOrbitalData && planetsWithDistance.length && scaleTicks.length"
              class="system-view__scale-bar"
              :style="{
                left: scaleOriginPx + 'px',
                width: Math.max(0, orbitalTrackWidthPx - starSizePx / 2) + 'px',
              }"
            >
              <div
                v-for="tick in scaleTicks"
                :key="tick.au"
                class="system-view__scale-tick"
                :style="{ left: tick.px + 'px' }"
              >
                <span class="system-view__scale-mark" />
                <span class="system-view__scale-label">{{ tick.label }}</span>
              </div>
            </div>
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
  box-sizing: border-box;
  padding: 0 var(--sidebar-offset);
  overflow: visible;
  z-index: 3;
}

/* Body : flex column, scroll horizontal uniquement */
.system-view__body {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.system-view__orbital-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}
.system-view__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.system-view__layout {
  flex-shrink: 0;
  position: relative;
  width: min-content;
  min-width: 100%;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  overflow: visible;
  margin-top: auto;
  margin-bottom: auto;
}
.system-view__layout-inner {
  flex-shrink: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  min-height: 120px;
  overflow: visible;
}

.system-view__empty,
.system-view__no-planets {
  font-size: var(--text-sm);
  color: var(--color-muted);
}

.system-view__orbital-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
}

/* Calque SVG des orbites : positionné pour aligner avec la bande orbitale */
.system-view__orbits-svg {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 0;
}

.system-view__orbits-svg {
  overflow: visible;
}
.system-view__orbit {
  fill: none;
  vector-effect: non-scaling-stroke;
}
.system-view__hz-band {
  fill: rgba(0, 180, 200, 0.12);
}
.system-view__orbit--planet {
  stroke: var(--color-muted);
  stroke-opacity: 0.25;
  stroke-width: 1;
}
/* Le star peut dépasser (taille à l'échelle) — pas d'overflow pour ne pas le tronquer */
.system-view__star {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 10;
}
.system-view__star-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: center;
}
.system-view__star-svg {
  height: 100%;
  width: auto;
  aspect-ratio: 1;
  flex-shrink: 0;
}
.system-view__star-svg :deep(svg) {
  height: 100%;
  width: auto;
  object-fit: contain;
  object-position: center;
}
.system-view__orbital-wrap {
  position: relative;
  overflow: visible !important;
}
.system-view__orbital-track {
  position: relative;
  overflow: visible !important;
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
.system-view__planet-center {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: visible !important;
}
.system-view__planet-rings {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 2;
}
.system-view__ring {
  pointer-events: none;
}
.system-view__planet-dot {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.system-view__planet-label {
  font-size: var(--text-xs);
  color: var(--color-muted);
}

/* Échelle : absolute, bottom, left = tangente droite du Soleil (0 UA), suit le scroll */
.system-view__scale-bar {
  position: absolute;
  bottom: 128px;
  height: 28px;
  padding: var(--space-2) 0;
  pointer-events: none;
  z-index: 5;
}
.system-view__scale-tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 1;
}
.system-view__scale-mark {
  width: 1px;
  height: 8px;
  background: var(--color-muted);
  opacity: 0.7;
}
.system-view__scale-label {
  font-size: 10px;
  color: var(--color-muted);
  font-family: var(--font-mono);
  margin-top: 2px;
  white-space: nowrap;
}
.system-view__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  overflow: hidden;
}
.system-view__planet-slot {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-4);
  position: relative;
}
.system-view__planet-slot-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.system-view__planet-slot-name {
  font-size: var(--text-sm);
  color: var(--color-muted);
  text-align: center;
}
</style>
