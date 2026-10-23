<script setup>
import '@/assets/components/lab.css'
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useObservationsStore } from '@/stores/observations'
import { useLabReportsStore } from '@/stores/labReports'
import { useVerdictsStore } from '@/stores/verdicts'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useShipStore } from '@/stores/ship'
import { useMapNodesStore } from '@/stores/mapNodes'
import { useNotificationsStore } from '@/stores/notifications'
import { OBJECT_TYPE_LABELS, getObsFilterType, getObservationIcon } from '@/constants/objectTypes'
import { getSupportLabel } from '@/constants/signaux'
import { getGraphName, getAnalysisConclusion, getInstrumentsForObservation, NIVEAU_ORDER, NIVEAU_LABELS } from '@/constants/lab'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { seededRandom } from '@/lib/random'
import { seedFromObsId } from '@/lib/spectrogramData'
import { DEVIATION_FAMILIES, getReportDeviations, countDeviationSightings } from '@/lib/deviations'
import {
  getObsNiveauKey,
  getEffectiveNiveau as effectiveNiveauOf,
  getDeviationsOf,
  getOpenDoubts,
  isInstrumentRelaunchable,
  distanceBetweenSystems,
} from '@/lib/doubts'
import { computeTransit } from '@/lib/transit'
import { getMainDeviationFamily, getReadingLabel } from '@/lib/verdicts'
import LabReportSpectrogram from '@/components/lab/LabReportSpectrogram.vue'
import LabReportStructureTemporelle from '@/components/lab/LabReportStructureTemporelle.vue'
import LabReportPolarisation from '@/components/lab/LabReportPolarisation.vue'
import LabReportLpt from '@/components/lab/LabReportLpt.vue'
import LabReportSpectreEnergetique from '@/components/lab/LabReportSpectreEnergetique.vue'
import LabReportGravimetrique from '@/components/lab/LabReportGravimetrique.vue'
import LabReportSpectreStellaire from '@/components/lab/LabReportSpectreStellaire.vue'
import LabReportOrbital from '@/components/lab/LabReportOrbital.vue'
import LabReportAtmosphere from '@/components/lab/LabReportAtmosphere.vue'
import LabReportVolumetrique from '@/components/lab/LabReportVolumetrique.vue'
import LabReportMorpho from '@/components/lab/LabReportMorpho.vue'
import LabReportMagneto from '@/components/lab/LabReportMagneto.vue'
import LabReportNeutrinos from '@/components/lab/LabReportNeutrinos.vue'
import InstrumentButton from '@/components/InstrumentButton.vue'
import LabVerdictPanel from '@/components/lab/LabVerdictPanel.vue'
import LabArtifactModal from '@/components/lab/LabArtifactModal.vue'
import LabDoubtPanel from '@/components/lab/LabDoubtPanel.vue'
import SignalTypeIcon from '@/components/icons/SignalTypeIcon.vue'
import ObservationCard from '@/components/ObservationCard.vue'

const route = useRoute()
const router = useRouter()
const obsStore = useObservationsStore()
const labReportsStore = useLabReportsStore()
const verdictsStore = useVerdictsStore()
const stellarStore = useStellarSystemsStore()
const shipStore = useShipStore()
const mapStore = useMapNodesStore()
const { list: obsList } = storeToRefs(obsStore)
const notificationsStore = useNotificationsStore()

const OBS_STATES = { PENDING: 'En attente', RUNNING: 'Analyse en cours', DONE: 'Analysé' }

const NIVEAUX = NIVEAU_LABELS

function hasRunningForObs(obs) {
  if (!obs) return false
  return Object.keys(running.value).some((k) => k.startsWith(obs.id + '-'))
}

const observations = computed(() =>
  [...obsList.value].sort((a, b) => Number(b.id) - Number(a.id))
)

const FILTER_OPTIONS = [
  { id: 'all', label: 'Tous' },
  { id: 'SIGNAL', label: 'Signaux' },
  { id: 'ETOILE', label: 'Étoiles' },
  { id: 'PLANETE', label: 'Corps planétaires' },
  { id: 'MINEUR', label: 'Corps mineurs' },
  { id: 'OBJET', label: 'Objets' },
  { id: 'ATMOSPHERE', label: 'Atmosphères' },
]

const filterType = ref('all')

const filterOptionsVisible = computed(() => {
  if (observations.value.length === 0) return []
  return FILTER_OPTIONS.filter((opt) => {
    if (opt.id === 'all') return true
    return observations.value.some((o) => getObsFilterType(o) === opt.id)
  })
})

const filteredObservations = computed(() => {
  const list = observations.value
  if (filterType.value === 'all') return list
  return list.filter((o) => getObsFilterType(o) === filterType.value)
})

const selectedObs = ref(null)
const reports = ref({})
const running = ref({})
const animationFrame = ref(null)

const selectedId = computed(() => selectedObs.value?.id)

function selectObservation(obs) {
  selectedObs.value = obs
}

function removeObservation(obs) {
  obsStore.removeObservation(obs.id)
  labReportsStore.clearForObs(obs.id)
  verdictsStore.clearForObs(obs.id)
  if (selectedObs.value?.id === obs.id) selectedObs.value = null
  const next = { ...reports.value }
  delete next[obs.id]
  reports.value = next
  const runNext = { ...running.value }
  Object.keys(runNext).forEach((k) => {
    if (k.startsWith(obs.id + '-')) delete runNext[k]
  })
  running.value = runNext
}

/** Une observation d'un corps du système où se trouve le vaisseau peut être approfondie jusqu'au contact */
function canDeepen(obs) {
  if (!obs || obs.type === 'SIGNAL' || !obs.system_id) return false
  if (obs.system_id !== shipStore.currentSystemId) return false
  return getObsNiveauKey(obs) !== 'CONTACT'
}

function getObservationStateText(obs) {
  if (!obs) return ''
  if (hasRunningForObs(obs)) return 'Analyse en cours…'
  const verdict = verdictsStore.getCurrent(obs.id)
  if (verdict) return `Verdict : ${getReadingLabel(verdict.reading).toLowerCase()}`
  const count = reports.value[obs.id]?.length ?? 0
  if (count > 0) return `${count} analyse${count > 1 ? 's' : ''} réalisée${count > 1 ? 's' : ''}`
  return 'En attente'
}

function getObservationState(obs) {
  if (!obs) return 'idle'
  if (hasRunningForObs(obs)) return 'running'
  if ((reports.value[obs.id]?.length ?? 0) > 0) return 'done'
  return 'idle'
}

/** Niveau effectif : si le vaisseau est dans le système de l'obs, on considère ORBITE atteint */
function getEffectiveNiveau(obs) {
  return effectiveNiveauOf(obs, shipStore.currentSystemId)
}

/** Doutes encore ouverts d'une observation (ombres qu'aucun rapport n'a mesurées) */
function getDoubtsFor(obs) {
  return getOpenDoubts(obs, reports.value[obs.id] || [], getEffectiveNiveau(obs))
}

function isInstrumentCompatible(instr, obs) {
  const available = getInstrumentsForObservation(obs)
  if (!available.some(i => i.id === instr.id)) return false
  if (obs.type === 'SIGNAL') return true
  const obsNiveau = getEffectiveNiveau(obs)
  const instrNiveau = NIVEAU_ORDER[instr.niveau] ?? 0
  return instrNiveau <= obsNiveau
}

function getDisabledReason(instr, obs) {
  if (!obs) return 'Sélectionnez une observation'
  const available = getInstrumentsForObservation(obs)
  if (!available.some(i => i.id === instr.id)) {
    return obs.type === 'SIGNAL' ? 'Support incompatible' : 'Type incompatible'
  }
  if (obs.type !== 'SIGNAL' && instr.niveau) {
    const obsNiveau = getEffectiveNiveau(obs)
    const instrNiveau = NIVEAU_ORDER[instr.niveau] ?? 0
    if (instrNiveau > obsNiveau) return 'Niveau insuffisant'
  }
  return null
}

function instrumentState(instr, obs) {
  if (!obs) return 'disabled'
  const key = `${obs.id}-${instr.id}`
  if (running.value[key]) return 'running'
  if (reports.value[obs.id]?.some(r => r.instrumentId === instr.id)) {
    // Niveau atteint pour un doute que l'instrument avait deviné : il peut être relancé
    const relaunch = isInstrumentCompatible(instr, obs) && isInstrumentRelaunchable(instr.id, getDoubtsFor(obs))
    return relaunch ? 'available' : 'done'
  }
  if (!isInstrumentCompatible(instr, obs)) return 'disabled'
  return 'available'
}

function launchInstrument(instr, obs) {
  if (!obs || instrumentState(instr, obs) !== 'available') return
  const key = `${obs.id}-${instr.id}`
  running.value = { ...running.value, [key]: { progress: 0, instr, obs } }
  if (obs.state === OBS_STATES.PENDING) {
    obs.state = OBS_STATES.RUNNING
    obsStore.updateObservationState(obs.id, 'RUNNING')
  }
  startSimulation()
}

function startSimulation() {
  if (animationFrame.value) return
  const tick = () => {
    let hasActive = false
    Object.keys(running.value).forEach(key => {
      const r = running.value[key]
      const step = 0.85 /* ~2s pour prototype — rétablir durées par delay plus tard */
      r.progress = Math.min(100, r.progress + step)
      if (r.progress >= 100) {
        // Déterministe : même observation + même instrument → même fiabilité
        const fiability = 50 + Math.floor(seededRandom(seedFromObsId(`${r.obs.id}:${r.instr.id}`))() * 45)
        const durationSec = r.obs.type === 'SIGNAL' ? (r.obs.durationSec ?? 72) : 72
        const deviations = getReportDeviations(r.obs, r.instr.id, { fiability, niveau: getEffectiveNiveau(r.obs) })
        // Les graphes montrent des résidus quand l'instrument mesure un écart
        const anomalous = deviations.some((d) => !d.requiresNiveau)
        const reportPayload = {
          instrumentId: r.instr.id,
          instrument: r.instr.name,
          fiability,
          date: new Date().toISOString().slice(0, 10),
          duration: '2h',
          durationSec,
          anomalous,
          deviations,
          results:
            r.instr.id === 'analyseur-spectral'
              ? `Spectrogramme — fréquence × temps. Bande passante, raies, stabilité. Fiabilité ${fiability}%.`
              : r.instr.id === 'analyseur-structure-temporelle'
                ? (r.obs.attributes?.lpt
                    ? `Train d'impulsions. Durées, intensités, période. Fiabilité ${fiability}%.`
                    : `Forme d'onde + autocorrélation. Périodicité, modulation, structure vs bruit. Fiabilité ${fiability}%.`)
                : r.instr.id === 'analyseur-polarisation'
                  ? `Ellipse de polarisation + Stokes (I/Q/U/V). Linéaire, circulaire, elliptique. Fiabilité ${fiability}%.`
                  : r.instr.id === 'analyseur-gravimetrique'
                    ? `Modèle de sources + résidus. Masses déduites, perturbations résiduelles. Fiabilité ${fiability}%.`
                    : r.instr.id === 'spectro-stellaire'
                      ? `Spectre + courbe de lumière. Type spectral, raies d'absorption, variations. Fiabilité ${fiability}%.`
                      : r.instr.id === 'analyseur-orbital'
                        ? `Diagramme orbital + paramètres (a, e, i, P). Résonances, anomalies de trajectoire. Fiabilité ${fiability}%.`
                        : r.instr.id === 'spectro-atmo'
                          ? `Profil moléculaire (H₂O, CO₂, CH₄, O₂…). Déséquilibres chimiques, biosignatures. Fiabilité ${fiability}%.`
                          : r.instr.id === 'analyseur-vol'
                            ? `Cartes de densité + coupes. Zones de surconcentration, déplétion, gradients. Fiabilité ${fiability}%.`
                            : r.instr.id === 'scanner-morpho'
                              ? `Modèle de surface + carte thermique. Forme, symétries, gradient. Fiabilité ${fiability}%.`
                              : r.instr.id === 'magnetometre'
                                ? `Carte du champ + profil. Intensité, orientation, anomalies. Fiabilité ${fiability}%.`
                                : r.instr.id === 'analyseur-neutrinos'
                                  ? `Chronologie des événements + spectre en énergie + cône de direction. Fiabilité ${fiability}%.`
                                  : `${r.instr.name} — Données produites. Fiabilité ${fiability}%.`,
        }
        // Nouveau tableau : celui du store (labReports.cache) est partagé et ne doit pas être modifié ici
        const newReports = [...(reports.value[r.obs.id] || []), reportPayload]
        reports.value = { ...reports.value, [r.obs.id]: newReports }
        labReportsStore.addReport(r.obs.id, reportPayload)
        const next = { ...running.value }
        delete next[key]
        running.value = next
        const obs = observations.value.find(o => o.id === r.obs.id)
        const hasAnyRunning = Object.keys(running.value).some(k => k.startsWith(r.obs.id))
        if (obs && !hasAnyRunning) {
          obs.state = OBS_STATES.DONE
          obsStore.updateObservationState(r.obs.id, 'DONE')
        }
      } else {
        hasActive = true
      }
    })
    if (hasActive) animationFrame.value = requestAnimationFrame(tick)
    else animationFrame.value = null
  }
  animationFrame.value = requestAnimationFrame(tick)
}

/** Verdict courant de l'observation sélectionnée */
const currentVerdict = computed(() => (selectedObs.value ? verdictsStore.getCurrent(selectedObs.value.id) : null))

/** « Créer un artefact » : après un verdict, un seul artefact par verdict (LACUNA_VERDICT.md §6.3) */
const canCreateArtifact = computed(() => !!currentVerdict.value && !currentVerdict.value.traceId)

const artifactButtonTitle = computed(() => {
  if (!currentVerdict.value) return 'Rendez d’abord un verdict sur cette observation.'
  if (currentVerdict.value.traceId) return 'Un artefact a déjà été déposé pour ce verdict ; révisez-le pour en déposer un autre.'
  return ''
})

const showArtifactModal = ref(false)

function onArtifactCreated(designation) {
  showArtifactModal.value = false
  notificationsStore.showNotification(`Trace « ${designation} » ajoutée aux Artefacts`)
}

const selectedReports = computed(() => {
  const obs = selectedObs.value
  if (!obs) return []
  return reports.value[obs.id] || []
})

/** Instruments de l'observation sélectionnée, les indisponibles en fin de barre */
const selectedInstruments = computed(() => {
  const obs = selectedObs.value
  if (!obs) return []
  const list = getInstrumentsForObservation(obs)
  return [
    ...list.filter(i => instrumentState(i, obs) !== 'disabled'),
    ...list.filter(i => instrumentState(i, obs) === 'disabled'),
  ]
})

/** Écarts d'un rapport ; recalculés depuis l'objet pour les rapports antérieurs aux écarts */
function getDeviationsForReport(r) {
  const obs = selectedObs.value
  if (!obs) return Array.isArray(r.deviations) ? r.deviations : []
  return getDeviationsOf(obs, r, getEffectiveNiveau(obs))
}

/** Nombre de rapports de l'observation sélectionnée qui mesurent chaque écart */
const deviationSightings = computed(() =>
  countDeviationSightings(selectedReports.value.map(getDeviationsForReport))
)

/** Doutes à lever de l'observation sélectionnée (LACUNA_VERDICT.md §6.1) */
const selectedDoubts = computed(() => (selectedObs.value ? getDoubtsFor(selectedObs.value) : []))

/** Système de l'observation, distance et générations depuis la position du vaisseau */
const selectedDestination = computed(() => {
  const obs = selectedObs.value
  if (!obs?.system_id) return null
  const target = stellarStore.list.find((s) => s.id === obs.system_id)
  const here = stellarStore.list.find((s) => s.id === shipStore.currentSystemId)
  const distanceLy = distanceBetweenSystems(here, target)
  return {
    systemId: obs.system_id,
    name: target?.name ?? obs.system ?? obs.system_id,
    inSystem: obs.system_id === shipStore.currentSystemId,
    distanceLy,
    generations: distanceLy ? computeTransit(distanceLy).generations : null,
  }
})

/** Ouvre la Carte sur le système de l'observation (le départ se confirme avec « Fixer le cap ») */
async function prepareVoyage() {
  const dest = selectedDestination.value
  if (!dest) return
  if (!mapStore.isOnMap(dest.systemId)) {
    await mapStore.addNode(dest.systemId, dest.name)
    notificationsStore.setCarteHasNew(true)
  }
  router.push({ path: '/carte', query: { select: dest.systemId } })
}

/** Famille de l'écart principal de l'observation sélectionnée (verdict) */
const mainDeviationFamily = computed(() =>
  getMainDeviationFamily(selectedReports.value.map(getDeviationsForReport))
)

/** Nombre de rapports qui mesurent l'écart principal */
const mainFamilySightings = computed(() => {
  const family = mainDeviationFamily.value
  if (!family) return 0
  return selectedReports.value.filter((r) =>
    getDeviationsForReport(r).some((d) => d.family === family && !d.requiresNiveau)
  ).length
})

/** Écarts mesurés de l'observation, un par écart — données déposées avec l'artefact */
const measuredDeviationLines = computed(() => {
  const seen = new Map()
  for (const r of selectedReports.value) {
    for (const d of getDeviationsForReport(r)) {
      if (d.requiresNiveau || seen.has(d.id)) continue
      seen.set(d.id, `${DEVIATION_FAMILIES[d.family]?.label ?? d.family} — ${d.label} : attendu ${d.expected}, mesuré ${d.measured}.`)
    }
  }
  return [...seen.values()]
})

const runningForSelected = computed(() => {
  const obs = selectedObs.value
  if (!obs) return {}
  const out = {}
  Object.entries(running.value).forEach(([key, r]) => {
    if (key.startsWith(obs.id + '-')) out[r.instr.id] = r
  })
  return out
})

watch(filterOptionsVisible, (opts) => {
  const ids = opts.map((o) => o.id)
  if (filterType.value !== 'all' && !ids.includes(filterType.value)) {
    filterType.value = 'all'
  }
}, { immediate: true })

const isSelectedSystemOnMap = computed(() => {
  const sid = selectedObs.value?.system_id
  return sid ? mapStore.isOnMap(sid) : false
})

async function addSelectedSystemToCarte() {
  const obs = selectedObs.value
  if (!obs?.system_id) return
  const stellar = stellarStore.list.find((s) => s.id === obs.system_id)
  const name = stellar?.name ?? obs.system ?? obs.system_id
  await mapStore.addNode(obs.system_id, name)
  notificationsStore.setCarteHasNew(true)
  notificationsStore.showNotification(`Système ${name} ajouté à la carte`)
}

onMounted(async () => {
  await ensureStoresLoaded(obsStore, stellarStore, mapStore)
  const obsIds = observations.value.map((o) => o.id)
  await Promise.all([labReportsStore.fetchForObservations(obsIds), verdictsStore.fetchForObservations(obsIds)])
  reports.value = { ...labReportsStore.cache }
  notificationsStore.clearLabHasNew()
  const selectId = route.query.select
  if (selectId && typeof selectId === 'string') {
    const obs = obsStore.list.find((o) => o.id === selectId)
    if (obs) selectedObs.value = obs
  }
})

onUnmounted(() => {
  if (animationFrame.value) cancelAnimationFrame(animationFrame.value)
})
</script>

<template>
  <div class="page-full page-full--spread">
    <div class="lab-layout">
      <!-- Colonne gauche : file d'observations -->
      <div class="lab-observations-col">
        <h1 class="page-title">Laboratoire</h1>
        <div class="panel-section-title">File d'observations</div>
        <div v-if="observations.length === 0" class="lab-empty-observations">
          Aucune observation. Ajoutez-en depuis l'Observatoire ou une notification.
        </div>
        <template v-else>
          <div class="lab-observations-filter">
            <button
              v-for="opt in filterOptionsVisible"
              :key="opt.id"
              type="button"
              class="btn btn-secondary"
              :class="{ 'is-active': filterType === opt.id }"
              @click="filterType = opt.id"
            >
              {{ opt.label }}
            </button>
          </div>
          <div class="card-list">
            <ObservationCard
              v-for="obs in filteredObservations"
              :key="obs.id"
              :icon-type="getObservationIcon(obs).type"
              :icon-value="getObservationIcon(obs).value"
              :title="obs.name"
              :title-variant="obs.type === 'SIGNAL' ? 'signal' : 'default'"
              :rows="[
                `${OBJECT_TYPE_LABELS[obs.type === 'STAR' ? 'ETOILE' : obs.type === 'PLANET' ? 'PLANETE' : obs.type] ?? obs.type}${obs.type === 'SIGNAL' && obs.support ? ` (${getSupportLabel(obs.support, 'long')})` : ''} · ${obs.system}`,
                obs.date,
              ]"
              :state="selectedId === obs.id ? 'selected' : getObservationState(obs)"
              :state-text="getObservationStateText(obs)"
              dismiss-label="Supprimer"
              @click="selectObservation(obs)"
              @dismiss="() => removeObservation(obs)"
            />
          </div>
        </template>
      </div>

      <!-- Colonne centrale : observation sélectionnée -->
      <div class="lab-selected-col">
        <div v-if="!selectedObs" class="lab-selected-empty">
          Sélectionnez une observation.
        </div>
        <template v-else>
          <div class="lab-selected__header">
            <div class="lab-selected__header-info">
              <div class="lab-selected__name" :class="{ 'lab-selected__name--signal': selectedObs.type === 'SIGNAL' }">{{ selectedObs.name }}</div>
              <div class="lab-selected__meta-row">
                <span class="sw-key">Système</span>
                <span class="sw-val">{{ selectedObs.system }} — {{ selectedObs.distance }}</span>
              </div>
              <div class="lab-selected__meta-row">
                <span class="sw-key">Coordonnées</span>
                <span class="sw-val">{{ selectedObs.coords }}</span>
              </div>
              <div class="lab-selected__meta-row">
                <span class="sw-key">Date de détection</span>
                <span class="sw-val">{{ selectedObs.date }}</span>
              </div>
              <template v-if="selectedObs.type === 'SIGNAL'">
                <div class="lab-selected__meta-row">
                  <span class="sw-key">Support</span>
                  <span class="sw-val">{{ getSupportLabel(selectedObs.support, 'long') }}</span>
                </div>
                <div class="lab-selected__meta-row lab-selected__meta-row--type">
                  <span class="sw-key">Type</span>
                  <span class="sw-val">
                    <SignalTypeIcon :structure="selectedObs.structure" :size="12" />
                    {{ selectedObs.structure ?? 'non uniforme' }}
                  </span>
                </div>
              </template>
              <div v-else class="lab-selected__meta-row">
                <span class="sw-key">Niveau d'observation</span>
                <span class="sw-val">{{ selectedObs.niveau }}</span>
              </div>
            </div>
            <div class="lab-selected__header-action">
              <button
                v-if="selectedObs.system_id"
                type="button"
                class="btn btn-primary"
                :disabled="isSelectedSystemOnMap"
                @click="addSelectedSystemToCarte"
              >
                {{ isSelectedSystemOnMap ? 'Sur la carte' : 'Ajouter à la carte' }}
              </button>
              <button
                v-if="canDeepen(selectedObs)"
                type="button"
                class="btn btn-primary"
                @click="obsStore.deepenObservation(selectedObs.id)"
              >
                Approfondir
              </button>
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!canCreateArtifact"
                :title="artifactButtonTitle"
                @click="showArtifactModal = true"
              >
                {{ currentVerdict?.traceId ? 'Artefact déposé' : 'Créer un artefact' }}
              </button>
            </div>
          </div>

          <div class="lab-selected__section">
            <div class="lab-selected__section-title">Instruments</div>
            <div class="lab-instruments-grid">
              <InstrumentButton
                v-for="instr in selectedInstruments"
                :key="instr.id"
                :instrument="instr"
                :state="instrumentState(instr, selectedObs)"
                :progress="runningForSelected[instr.id]?.progress ?? 0"
                :disabled-reason="getDisabledReason(instr, selectedObs)"
                :note="instrumentState(instr, selectedObs) === 'available' && selectedReports.some((r) => r.instrumentId === instr.id) ? 'Niveau atteint — relancer' : ''"
                @click="launchInstrument(instr, selectedObs)"
              />
            </div>
          </div>

          <div class="lab-selected__section">
            <div class="lab-selected__section-title">
              Rapports d'analyse
              <span v-if="getAnalysisConclusion(selectedObs, selectedReports.length)" class="lab-selected__conclusion">
                — modèle de référence : {{ getAnalysisConclusion(selectedObs, selectedReports.length) }}
              </span>
            </div>
            <div v-for="(r, i) in selectedReports" :key="r.id ?? `${r.instrumentId}-${i}`" class="lab-report">
              <div class="lab-report__header">
                <div class="lab-report__header-left">
                  <div class="lab-report__instrument sw-val">{{ r.instrument }}</div>
                  <div class="lab-report__meta-row">
                    <span class="sw-key">Date</span>
                    <span class="sw-val">{{ r.date }} · {{ r.duration }}</span>
                  </div>
                </div>
                <div class="lab-report__header-right">
                  <div class="lab-report__meta-row lab-report__meta-row--right">
                    <span class="sw-key">Fiabilité</span>
                    <span class="sw-val">{{ r.fiability }}%</span>
                  </div>
                </div>
              </div>
              <div v-if="getGraphName(r.instrumentId) && !selectedObs?.attributes?.lpt" class="lab-report__graph-label">{{ getGraphName(r.instrumentId) }}</div>
              <LabReportSpectrogram
                v-if="r.instrumentId === 'analyseur-spectral'"
                :obs-id="selectedObs?.id ?? ''"
                :fiability="r.fiability"
                :duration-sec="r.durationSec ?? 72"
                :anomalous="r.anomalous ?? false"
                :structure="selectedObs?.type === 'SIGNAL' ? (selectedObs?.structure ?? 'non uniforme') : 'non uniforme'"
                class="lab-report__output"
              />
              <LabReportLpt
                v-else-if="selectedObs?.attributes?.lpt && (r.instrumentId === 'analyseur-structure-temporelle' || r.instrumentId === 'analyseur-polarisation')"
                :lpt="selectedObs.attributes.lpt"
                :mode="r.instrumentId === 'analyseur-polarisation' ? 'polarisation' : 'temporel'"
                class="lab-report__output"
              />
              <LabReportStructureTemporelle
                v-else-if="r.instrumentId === 'analyseur-structure-temporelle'"
                :obs-id="selectedObs?.id ?? ''"
                :fiability="r.fiability"
                :duration-sec="r.durationSec ?? 72"
                :anomalous="r.anomalous ?? false"
                :structure="selectedObs?.type === 'SIGNAL' ? (selectedObs?.structure ?? 'non uniforme') : 'non uniforme'"
                :pulse-period-sec="selectedObs?.attributes?.pulse_period_s ?? 0"
                class="lab-report__output"
              />
              <LabReportPolarisation
                v-else-if="r.instrumentId === 'analyseur-polarisation'"
                :obs-id="selectedObs?.id ?? ''"
                :fiability="r.fiability"
                :anomalous="r.anomalous ?? false"
                :polarization="selectedObs?.attributes?.polarization ?? ''"
                class="lab-report__output"
              />
              <LabReportSpectreEnergetique
                v-else-if="r.instrumentId === 'analyseur-spectre-energetique'"
                :obs-id="selectedObs?.id ?? ''"
                :fiability="r.fiability"
                :duration-sec="r.durationSec ?? 72"
                :anomalous="r.anomalous ?? false"
                :structure="selectedObs?.type === 'SIGNAL' ? (selectedObs?.structure ?? 'non uniforme') : 'non uniforme'"
                class="lab-report__output"
              />
              <LabReportGravimetrique
                v-else-if="r.instrumentId === 'analyseur-gravimetrique'"
                :obs-id="selectedObs?.id ?? ''"
                :fiability="r.fiability"
                :duration-sec="r.durationSec ?? 72"
                :anomalous="r.anomalous ?? false"
                :structure="selectedObs?.type === 'SIGNAL' ? (selectedObs?.structure ?? 'non uniforme') : 'non uniforme'"
                :obs-type="selectedObs?.type ?? 'SIGNAL'"
                class="lab-report__output"
              />
              <LabReportSpectreStellaire
                v-else-if="r.instrumentId === 'spectro-stellaire'"
                :obs-id="selectedObs?.id ?? ''"
                :system-id="selectedObs?.system_id ?? ''"
                :fiability="r.fiability"
                :anomalous="r.anomalous ?? false"
                class="lab-report__output"
              />
              <LabReportOrbital
                v-else-if="r.instrumentId === 'analyseur-orbital'"
                :obs-id="selectedObs?.id ?? ''"
                :system-id="selectedObs?.system_id ?? ''"
                :fiability="r.fiability"
                :anomalous="r.anomalous ?? false"
                class="lab-report__output"
              />
              <LabReportAtmosphere
                v-else-if="r.instrumentId === 'spectro-atmo'"
                :obs-id="selectedObs?.id ?? ''"
                :system-id="selectedObs?.system_id ?? ''"
                :obs-name="selectedObs?.name ?? ''"
                :fiability="r.fiability"
                :anomalous="r.anomalous ?? false"
                class="lab-report__output"
              />
              <LabReportVolumetrique
                v-else-if="r.instrumentId === 'analyseur-vol'"
                :obs-id="selectedObs?.id ?? ''"
                :system-id="selectedObs?.system_id ?? ''"
                :fiability="r.fiability"
                :anomalous="r.anomalous ?? false"
                class="lab-report__output"
              />
              <LabReportMorpho
                v-else-if="r.instrumentId === 'scanner-morpho'"
                :obs-id="selectedObs?.id ?? ''"
                :system-id="selectedObs?.system_id ?? ''"
                :fiability="r.fiability"
                :anomalous="r.anomalous ?? false"
                class="lab-report__output"
              />
              <LabReportNeutrinos
                v-else-if="r.instrumentId === 'analyseur-neutrinos'"
                :obs-id="selectedObs?.id ?? ''"
                :fiability="r.fiability"
                :attributes="selectedObs?.attributes ?? {}"
                class="lab-report__output"
              />
              <LabReportMagneto
                v-else-if="r.instrumentId === 'magnetometre'"
                :obs-id="selectedObs?.id ?? ''"
                :system-id="selectedObs?.system_id ?? ''"
                :fiability="r.fiability"
                :anomalous="r.anomalous ?? false"
                class="lab-report__output"
              />
              <div class="lab-report__deviations">
                <div class="lab-report__deviations-title">Écarts</div>
                <ul v-if="getDeviationsForReport(r).length" class="lab-deviations">
                  <li
                    v-for="d in getDeviationsForReport(r)"
                    :key="d.id"
                    class="lab-deviation"
                    :class="{ 'lab-deviation--shadow': d.requiresNiveau }"
                  >
                    <div class="lab-deviation__head">
                      <span class="lab-deviation__family">{{ DEVIATION_FAMILIES[d.family]?.label ?? d.family }}</span>
                      <span class="lab-deviation__label">— {{ d.requiresNiveau ? 'écart au-delà de la résolution' : d.label }}</span>
                      <span v-if="!d.requiresNiveau && (deviationSightings.get(d.id) ?? 0) >= 2" class="lab-deviation__tag">corroboré</span>
                    </div>
                    <div v-if="d.requiresNiveau" class="lab-deviation__values">
                      Niveau {{ NIVEAUX[d.requiresNiveau] }} requis pour le caractériser.
                    </div>
                    <div v-else class="lab-deviation__values">
                      <span class="sw-key">attendu</span> <span class="sw-val">{{ d.expected }}</span>
                      <span class="lab-deviation__sep">·</span>
                      <span class="sw-key">mesuré</span> <span class="sw-val">{{ d.measured }}</span>
                    </div>
                  </li>
                </ul>
                <div v-else class="lab-deviation lab-deviation--none">
                  Aucun écart au-delà du bruit (fiabilité {{ r.fiability }} %).
                </div>
              </div>
            </div>
            <div v-if="selectedReports.length === 0 && !Object.keys(runningForSelected).length" class="lab-report" style="opacity: 0.7">
              Lancez un instrument ci-dessus.
            </div>
            <LabDoubtPanel
              v-if="selectedDoubts.length > 0"
              :doubts="selectedDoubts"
              :destination="selectedDestination"
              :can-deepen="canDeepen(selectedObs)"
              :in-transit="shipStore.isInTransit"
              @prepare="prepareVoyage"
              @deepen="obsStore.deepenObservation(selectedObs.id)"
            />
            <LabVerdictPanel
              v-if="selectedReports.length > 0"
              :observation-id="selectedObs.id"
              :observation-name="selectedObs.name"
              :family="mainDeviationFamily"
              :family-sightings="mainFamilySightings"
            />
          </div>
        </template>
      </div>
    </div>
    <LabArtifactModal
      v-if="showArtifactModal && selectedObs && currentVerdict"
      :observation="selectedObs"
      :verdict="currentVerdict"
      :deviation-lines="measuredDeviationLines"
      @close="showArtifactModal = false"
      @created="onArtifactCreated"
    />
  </div>
</template>
