<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { radiusToDiameterPx as radiusToDiameterPxFromLib } from '@/lib/bodyRadius'
import { toPhysicalUnits, toLuminosityAndHz } from '@/lib/systemObjectConverters'
import { orbitEase } from '@/lib/animationUtils'
import { distanceAuToPx as distanceAuToPxFromLib } from '@/lib/orbitalUtils'
import { getPlanetSvgPathForObject } from '@/assets/illustrations/planets'
import { getStarSvgPath } from '@/assets/illustrations/stars'

const props = defineProps({
  systemId: { type: String, default: '' },
  systemName: { type: String, default: '' },
  spectralType: { type: String, default: 'G2V' },
  /** true quand l’étoile est sélectionnée (détails dans la colonne droite) */
  starSelected: { type: Boolean, default: false },
  /** id ou designation de la planète sélectionnée (pour bordure de sélection) */
  selectedPlanetId: { type: String, default: null },
  /** true pendant le chargement des objets du système (évite vue vide) */
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['select-planet', 'select-star'])

const systemObjectsStore = useSystemObjectsStore()
const stellarStore = useStellarSystemsStore()
const containerRef = ref(null)

const MIN_BODY_DIAMETER_PX = 16
const MAX_BODY_DIAMETER_PX = 128
const MIN_DISTANCE_AU = 0.001

const size = ref(320)
/** true une fois la taille du container lue après passage à la vue orbitale — évite le clignotement (viewBox 320 → taille réelle) */
const orbitViewReady = ref(false)

/** Progression eased de l'animation one-shot (0 à 1) */
const orbitProgressEased = ref(0)
const ORBIT_ANIM_DURATION_MS = 4800
/** 5 tours pour la planète la plus rapide (référence) en one-shot */
const ORBIT_ANIM_MAX_TURNS = 5
let orbitRafId = null

/** Mode lecture continue (bouton Play) : la phase augmente sans s'arrêter */
const isPlaying = ref(false)
const orbitPhaseContinuous = ref(0)
/** true une fois que l'utilisateur a cliqué Play : en pause on garde orbitPhaseContinuous pour ne pas reprendre la position one-shot */
const continuousPhaseHolds = ref(false)
let continuousRafId = null
/** Vitesse angulaire de référence (rad/ms) — planète la plus rapide : ~1 tour / 1,5 s */
const CONTINUOUS_RAD_PER_MS = (2 * Math.PI) / 1500

/** Période orbitale min (jours) — référence : la planète la plus rapide fait 3/4 de tour */
const minOrbitalPeriodDays = computed(() => {
  const periods = planetsWithSize.value
    .map((p) => p.orbital_period_days)
    .filter((x) => x != null && x > 0)
  return periods.length > 0 ? Math.min(...periods) : 1
})

function runOrbitAnimation() {
  const startTime = performance.now()
  function tick(now) {
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / ORBIT_ANIM_DURATION_MS)
    orbitProgressEased.value = orbitEase(progress)
    if (progress < 1) {
      orbitRafId = requestAnimationFrame(tick)
    } else {
      orbitRafId = null
    }
  }
  orbitRafId = requestAnimationFrame(tick)
}

function stopOrbitAnimation() {
  if (orbitRafId != null) {
    cancelAnimationFrame(orbitRafId)
    orbitRafId = null
  }
}

function runContinuousOrbitAnimation() {
  let lastTime = performance.now()
  function tick(now) {
    if (!continuousRafId) return
    const delta = now - lastTime
    lastTime = now
    orbitPhaseContinuous.value += delta * CONTINUOUS_RAD_PER_MS
    continuousRafId = requestAnimationFrame(tick)
  }
  continuousRafId = requestAnimationFrame(tick)
}

function stopContinuousOrbitAnimation() {
  if (continuousRafId != null) {
    cancelAnimationFrame(continuousRafId)
    continuousRafId = null
  }
}

function togglePlayPause() {
  if (isPlaying.value) {
    isPlaying.value = false
    stopContinuousOrbitAnimation()
    /* orbitPhaseContinuous garde sa valeur : les astres restent en place en pause */
  } else {
    stopOrbitAnimation()
    if (!continuousPhaseHolds.value) {
      orbitPhaseContinuous.value = orbitProgressEased.value * ORBIT_ANIM_MAX_TURNS * 2 * Math.PI
      continuousPhaseHolds.value = true
    }
    isPlaying.value = true
    runContinuousOrbitAnimation()
  }
}

const stellarSystem = computed(() =>
  stellarStore.list.find((s) => s.id === props.systemId)
)

const objects = computed(() =>
  systemObjectsStore.getForSystem(props.systemId) ?? []
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

/** Diamètre corps (px) — délègue à lib/bodyRadius */
function radiusToDiameterPx(radiusEarth) {
  return radiusToDiameterPxFromLib(
    radiusEarth,
    minBodyRadius.value,
    maxBodyRadius.value,
    MIN_BODY_DIAMETER_PX,
    MAX_BODY_DIAMETER_PX
  )
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

/** Distance (UA) → rayon px — délègue à lib/orbitalUtils */
function distanceAuToPx(distanceAu) {
  return distanceAuToPxFromLib(
    distanceAu,
    orbitStartPx.value,
    minDistanceAu.value,
    maxDistanceAu.value,
    orbitTrackWidth.value
  )
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

/** Position planète — angle de base + phase (one-shot eased ou continue selon isPlaying) */
function getPlanetPosition(p, index = 0) {
  const rPx = distanceAuToPx(p.a ?? 0)
  const n = planetsWithSize.value.length
  const baseAngle = n > 0 ? (2 * Math.PI * index) / n : 0
  const minP = minOrbitalPeriodDays.value
  const periodDays = p.orbital_period_days != null && p.orbital_period_days > 0 ? p.orbital_period_days : minP
  const ratio = minP / periodDays
  const phaseRad = (isPlaying.value || continuousPhaseHolds.value)
    ? orbitPhaseContinuous.value * ratio
    : orbitProgressEased.value * (ORBIT_ANIM_MAX_TURNS * 2 * Math.PI) * ratio
  const angle = baseAngle + phaseRad
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

function isPlanetSelected(p) {
  if (!props.selectedPlanetId) return false
  return (p.designation && p.designation === props.selectedPlanetId) || (p.id && String(p.id) === props.selectedPlanetId)
}

function onStarClick() {
  const s = star.value
  if (s) {
    emit('select-star', s)
  } else if (props.systemId && props.systemName) {
    emit('select-star', { id: 'star', type: 'STAR', name: props.systemName, designation: props.systemId })
  } else {
    emit('select-star')
  }
}

function onBackgroundClick() {
  emit('select-star', null)
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

// One-shot au changement de système ; arrêter le mode continu si actif
watch(
  () => [props.systemId, props.loading, planetsWithSize.value.length],
  async ([systemId, loading, planetCount]) => {
    if (loading) orbitViewReady.value = false
    stopOrbitAnimation()
    stopContinuousOrbitAnimation()
    isPlaying.value = false
    continuousPhaseHolds.value = false
    orbitProgressEased.value = 0
    orbitPhaseContinuous.value = 0

    // Si aucun système sélectionné ou en cours de chargement, on reste en état "vide/chargement".
    if (!systemId || loading) {
      orbitViewReady.value = false
      return
    }

    // Calculer la taille du conteneur une fois les données prêtes, même sans planètes.
    orbitViewReady.value = false
    await nextTick()
    if (containerRef.value) {
      const rect = containerRef.value.getBoundingClientRect()
      const w = rect.width || 320
      const h = rect.height || 280
      const s = Math.min(w, h) || 320
      size.value = Math.max(2 * MAX_BODY_DIAMETER_PX, s)
    }
    orbitViewReady.value = true

    // Lancer l'animation orbitale uniquement s'il y a au moins une planète à animer.
    if (planetCount > 0) {
      requestAnimationFrame(() => {
        runOrbitAnimation()
      })
    }
  },
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

onBeforeUnmount(() => {
  stopOrbitAnimation()
  stopContinuousOrbitAnimation()
})
</script>

<template>
  <div ref="containerRef" class="carte-orbital">
    <div v-if="!systemId" class="carte-orbital__empty">
      Sélectionnez un système.
    </div>
    <div v-else-if="loading || !orbitViewReady" class="carte-orbital__empty">
      Chargement…
    </div>
    <template v-else>
      <div v-if="planetsWithSize.length > 0" class="carte-orbital__play-bar">
        <button
          type="button"
          class="btn btn-ghost carte-orbital__play-btn"
          :aria-label="isPlaying ? 'Pause' : 'Lancer l’animation'"
          @click="togglePlayPause"
        >
          {{ isPlaying ? '⏸ Pause' : '▶ Lecture' }}
        </button>
      </div>
      <svg
        class="carte-orbital__svg"
        :viewBox="viewBox"
        preserveAspectRatio="xMidYMid meet"
        overflow="visible"
      >
        <g>
          <!-- Clic dans le vide : déselectionne l'astre (en premier dans le SVG pour être en arrière-plan) -->
          <rect
            class="carte-orbital__bg-hit"
            x="0"
            y="0"
            :width="size"
            :height="size"
            fill="transparent"
            @click="onBackgroundClick"
          />
          <!-- Zone habitable + orbites : pointer-events none pour ne pas bloquer les clics sur l'étoile -->
          <g v-if="planetsWithDistance.length && hzBandPath" :transform="`translate(${center}, ${center})`" class="carte-orbital__decor">
            <path
              :d="hzBandPath"
              fill-rule="evenodd"
              class="carte-orbital__hz-band"
            />
          </g>
          <g class="carte-orbital__decor">
            <circle
              v-for="(p, i) in planetsWithSize"
              :key="'orbit-' + i"
              :cx="center"
              :cy="center"
              :r="getOrbitR(p)"
              fill="none"
              :stroke="isPlanetSelected(p) ? 'var(--color-cyan)' : (p.in_habitable_zone ? 'var(--color-cyan)' : 'var(--color-muted)')"
              :stroke-opacity="isPlanetSelected(p) ? 1 : (p.in_habitable_zone ? 0.6 : 0.35)"
              stroke-width="1"
            />
          </g>
          <!-- Étoile au centre : cercle invisible étendu pour faciliter le clic + image -->
          <g
            class="carte-orbital__star"
            :class="{ 'carte-orbital__star--selected': starSelected }"
            @click="onStarClick"
          >
            <!-- Bordure sélection : 1px d'épaisseur, 4px en dehors de l'astre -->
            <circle
              v-if="starSelected"
              :cx="center"
              :cy="center"
              :r="starDiameterPx / 2 + 4.5"
              fill="none"
              stroke="var(--color-cyan)"
              stroke-width="1"
              class="carte-orbital__body-selection-ring"
            />
            <circle
              :cx="center"
              :cy="center"
              :r="Math.max(starDiameterPx / 2 + 8, 24)"
              fill="transparent"
              class="carte-orbital__star-hit"
            />
            <image
              :href="starSvgPath"
              :x="center - starDiameterPx / 2"
              :y="center - starDiameterPx / 2"
              :width="starDiameterPx"
              :height="starDiameterPx"
              class="carte-orbital__body-img"
            />
          </g>
          <!-- Zones cliquables sur les orbites (sous l'étoile et les planètes) : clic sur la trajectoire = sélection planète -->
          <g class="carte-orbital__orbit-hits">
            <circle
              v-for="(p, i) in planetsWithSize"
              :key="'orbit-hit-' + i"
              :cx="center"
              :cy="center"
              :r="getOrbitR(p)"
              fill="none"
              stroke="transparent"
              stroke-width="16"
              class="carte-orbital__orbit-hit"
              @click="onPlanetClick(p, $event)"
            />
          </g>
          <!-- Planètes (tailles via toVisualParams) -->
          <g
            v-for="(p, i) in planetsWithSize"
            :key="'planet-' + i"
            class="carte-orbital__planet"
            :class="{ 'carte-orbital__planet--selected': isPlanetSelected(p) }"
            :transform="`translate(${getPlanetPosition(p, i).x}, ${getPlanetPosition(p, i).y})`"
            @click="onPlanetClick(p, $event)"
          >
            <!-- Bordure sélection : 1px d'épaisseur, 4px en dehors de l'astre -->
            <circle
              v-if="isPlanetSelected(p)"
              cx="0"
              cy="0"
              :r="p.diameterPx / 2 + 4.5"
              fill="none"
              stroke="var(--color-cyan)"
              stroke-width="1"
              class="carte-orbital__body-selection-ring"
            />
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
    </template>
  </div>
</template>

<style scoped>
/* Pas de marge gauche/droite pour que le schéma utilise toute la largeur (scale 1) */
.carte-orbital {
  flex: 1;
  min-width: 200px;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  position: relative;
  padding-inline: 0;
}

/* Barre sticky : marge uniquement en haut et à droite pour le bouton */
.carte-orbital__play-bar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
  width: 100%;
  padding-block: var(--space-2);
  padding-inline: 0 var(--space-2);
  flex-shrink: 0;
  background: linear-gradient(180deg, var(--color-bg) 0%, transparent 100%);
}

/* Remonte de la hauteur barre (bouton + padding) pour récupérer la place */
.carte-orbital__svg {
  flex: 1;
  min-height: 0;
  display: block;
  width: 100%;
  min-width: 0;
  aspect-ratio: 1;
  margin-top: calc(-1 * (2.25rem + 2 * var(--space-2)));
}

/* Fixe la hauteur : les glyphes ▶ / ⏸ n'ont pas les mêmes métriques, sans height le bouton varie */
.carte-orbital__play-btn {
  height: 2.25rem;
  box-sizing: border-box;
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

.carte-orbital__star,
.carte-orbital__planet {
  cursor: pointer;
  transition: opacity var(--transition-base);
}

.carte-orbital__star:hover,
.carte-orbital__planet:hover {
  opacity: 1;
}

.carte-orbital__body-selection-ring {
  pointer-events: none;
}

.carte-orbital__planet {
  opacity: 0.9;
}

.carte-orbital__decor {
  pointer-events: none;
}

.carte-orbital__orbit-hit {
  cursor: pointer;
  pointer-events: auto;
}

.carte-orbital__bg-hit {
  cursor: default;
  pointer-events: auto;
}

.carte-orbital__hz-band {
  fill: var(--color-cyan-subtle);
}

.carte-orbital__body-img {
  pointer-events: none;
}

.carte-orbital__star-hit {
  pointer-events: auto;
}

.carte-orbital__body-img--planet {
  cursor: pointer;
  pointer-events: auto;
}
</style>
