<script setup>
import '@/assets/components/lab.css'
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useObservationsStore } from '@/stores/observations'
import { useLabReportsStore } from '@/stores/labReports'
import { useTracesStore } from '@/stores/traces'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useShipStore } from '@/stores/ship'
import { useMapNodesStore } from '@/stores/mapNodes'
import { useNotificationsStore } from '@/stores/notifications'
import { OBJECT_TYPE_LABELS, getObsFilterType, getObservationIcon } from '@/constants/objectTypes'
import { getSupportLabel } from '@/constants/signaux'
import { getGraphName, getAnalysisConclusion } from '@/constants/lab'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import { seededRandom } from '@/lib/random'
import { seedFromObsId } from '@/lib/spectrogramData'
import LabReportSpectrogram from '@/components/lab/LabReportSpectrogram.vue'
import LabReportStructureTemporelle from '@/components/lab/LabReportStructureTemporelle.vue'
import LabReportPolarisation from '@/components/lab/LabReportPolarisation.vue'
import LabReportSpectreEnergetique from '@/components/lab/LabReportSpectreEnergetique.vue'
import LabReportGravimetrique from '@/components/lab/LabReportGravimetrique.vue'
import LabReportSpectreStellaire from '@/components/lab/LabReportSpectreStellaire.vue'
import LabReportOrbital from '@/components/lab/LabReportOrbital.vue'
import LabReportAtmosphere from '@/components/lab/LabReportAtmosphere.vue'
import LabReportVolumetrique from '@/components/lab/LabReportVolumetrique.vue'
import LabReportMorpho from '@/components/lab/LabReportMorpho.vue'
import LabReportMagneto from '@/components/lab/LabReportMagneto.vue'
import InstrumentButton from '@/components/InstrumentButton.vue'
import SignalTypeIcon from '@/components/icons/SignalTypeIcon.vue'
import ObservationCard from '@/components/ObservationCard.vue'

const route = useRoute()
const obsStore = useObservationsStore()
const labReportsStore = useLabReportsStore()
const tracesStore = useTracesStore()
const stellarStore = useStellarSystemsStore()
const shipStore = useShipStore()
const mapStore = useMapNodesStore()
const { list: obsList } = storeToRefs(obsStore)
const notificationsStore = useNotificationsStore()

const OBS_STATES = { PENDING: 'En attente', RUNNING: 'Analyse en cours', DONE: 'Analysé' }

const NIVEAUX = { PASSIF: 'Passif', SYSTEME: 'Système', ORBITE: 'Orbite proche', CONTACT: 'Contact' }

/**
 * Instruments du Laboratoire — Réf. LACUNA_LABORATOIRE_INSTRUMENTS.md
 * signalSupports = pour observations SIGNAL (support du signal)
 * niveau + objectTypes = pour observations actives (corps, étoile, etc.)
 */
const INSTRUMENTS = [
  { id: 'analyseur-spectral', name: 'Analyseur spectral', signalSupports: ['EM_RADIO'], delay: 'Court' },
  { id: 'analyseur-structure-temporelle', name: 'Analyseur de structure temporelle', signalSupports: ['EM_RADIO', 'GAMMA_X', 'GRAVITATIONNEL'], delay: 'Court' },
  { id: 'analyseur-polarisation', name: 'Analyseur de polarisation', signalSupports: ['EM_RADIO'], delay: 'Moyen' },
  { id: 'analyseur-spectre-energetique', name: 'Analyseur de spectre énergétique', signalSupports: ['GAMMA_X'], delay: 'Moyen' },
  { id: 'analyseur-gravimetrique', name: 'Analyseur gravimétrique', signalSupports: ['GRAVITATIONNEL'], niveau: 'SYSTEME', objectTypes: ['ETOILE', 'PLANETE', 'MINEUR', 'OBJET'], delay: 'Long' },
  { id: 'spectro-stellaire', name: 'Spectromètre stellaire', niveau: 'SYSTEME', objectTypes: ['ETOILE', 'PLANETE'], delay: 'Moyen' },
  { id: 'analyseur-orbital', name: 'Analyseur orbital', niveau: 'SYSTEME', objectTypes: ['ETOILE', 'PLANETE', 'MINEUR', 'OBJET'], delay: 'Long' },
  { id: 'spectro-atmo', name: 'Spectromètre atmosphérique', niveau: 'ORBITE', objectTypes: ['PLANETE', 'ATMOSPHERE'], delay: 'Moyen' },
  { id: 'analyseur-vol', name: 'Analyseur volumétrique', niveau: 'ORBITE', objectTypes: ['ETOILE', 'PLANETE', 'MINEUR', 'OBJET'], delay: 'Long' },
  { id: 'scanner-morpho', name: 'Scanner morphologique', niveau: 'ORBITE', objectTypes: ['PLANETE', 'MINEUR', 'OBJET'], delay: 'Moyen' },
  { id: 'magnetometre', name: 'Magnétomètre', niveau: 'ORBITE', objectTypes: ['PLANETE', 'MINEUR'], delay: 'Court' },
  { id: 'spectro-contact', name: 'Spectromètre de contact', niveau: 'CONTACT', objectTypes: ['OBJET'], delay: 'Long' },
  { id: 'analyseur-echantillon', name: 'Analyseur d\'échantillon', niveau: 'CONTACT', objectTypes: ['OBJET'], delay: 'Très long' },
]

const NIVEAU_ORDER = { PASSIF: 0, SYSTEME: 1, ORBITE: 2, CONTACT: 3 }

function getInstrumentsForObservation(obs) {
  if (!obs) return []
  if (obs.type === 'SIGNAL') {
    const support = obs.support ?? 'EM_RADIO'
    return INSTRUMENTS.filter(i => i.signalSupports?.includes(support))
  }
  const bodyType = obs.type === 'STAR' ? 'ETOILE' : obs.type === 'PLANET' ? 'PLANETE' : obs.type
  return INSTRUMENTS.filter(i => i.objectTypes?.includes(bodyType))
}

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

function getObsNiveauKey(obs) {
  return Object.keys(NIVEAUX).find(k => NIVEAUX[k] === obs.niveau) || 'PASSIF'
}

function getObservationStateText(obs) {
  if (!obs) return ''
  if (hasRunningForObs(obs)) return 'Analyse en cours…'
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
  const base = NIVEAU_ORDER[getObsNiveauKey(obs)] ?? 0
  const inSystem = obs.system_id && shipStore.currentSystemId && obs.system_id === shipStore.currentSystemId
  if (inSystem && obs.type !== 'SIGNAL') {
    return Math.max(base, NIVEAU_ORDER.ORBITE)
  }
  return base
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
  if (reports.value[obs.id]?.some(r => r.instrumentId === instr.id)) return 'done'
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
        const newReports = reports.value[r.obs.id] || []
        const durationSec = r.obs.type === 'SIGNAL' ? (r.obs.durationSec ?? 72) : 72
        const anomalous = r.obs.type === 'SIGNAL' ? (r.obs.anomalous ?? false) : false
        const reportPayload = {
          instrumentId: r.instr.id,
          instrument: r.instr.name,
          fiability,
          date: new Date().toISOString().slice(0, 10),
          duration: '2h',
          durationSec,
          anomalous,
          results:
            r.instr.id === 'analyseur-spectral'
              ? `Spectrogramme — fréquence × temps. Bande passante, raies, stabilité. Fiabilité ${fiability}%.`
              : r.instr.id === 'analyseur-structure-temporelle'
                ? `Forme d'onde + autocorrélation. Périodicité, modulation, structure vs bruit. Fiabilité ${fiability}%.`
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
                                : `${r.instr.name} — Données produites. Fiabilité ${fiability}%.`,
        }
        newReports.push(reportPayload)
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

function canFormalize() {
  const obs = selectedObs.value
  if (!obs) return false
  const list = reports.value[obs.id] || []
  return list.length > 0
}

function formalize() {
  const obs = selectedObs.value
  if (!obs || !canFormalize()) return
  const reportList = reports.value[obs.id] || []
  const description = reportList
    .map((r) => `${r.instrument} (Fiab. ${r.fiability}%) — ${r.results}`)
    .join('\n\n')
  tracesStore.addTrace({
    designation: obs.name,
    type: obs.type,
    systemId: obs.system_id ?? obs.system,
    description,
    discovered: obs.date,
  })
  notificationsStore.showNotification(`Trace « ${obs.name} » ajoutée aux Artefacts`)
}

const selectedReports = computed(() => {
  const obs = selectedObs.value
  if (!obs) return []
  return reports.value[obs.id] || []
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
  await labReportsStore.fetchForObservations(obsIds)
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
                type="button"
                class="btn btn-primary"
                :disabled="!canFormalize()"
                @click="formalize"
              >
                [GARDER UNE TRACE]
              </button>
            </div>
          </div>

          <div class="lab-selected__section">
            <div class="lab-selected__section-title">
              Rapports d'analyse
              <span v-if="getAnalysisConclusion(selectedObs, selectedReports.length)" class="lab-selected__conclusion">
                — {{ getAnalysisConclusion(selectedObs, selectedReports.length) }}
              </span>
            </div>
            <div v-for="r in selectedReports" :key="r.instrumentId + r.date" class="lab-report">
              <div class="lab-report__header">
                <div class="lab-report__header-left">
                  <div class="lab-report__instrument sw-val">{{ r.instrument }}</div>
                  <div class="lab-report__meta-row">
                    <span class="sw-key">Date</span>
                    <span class="sw-val">{{ r.date }} · {{ r.duration }}</span>
                  </div>
                </div>
                <div class="lab-report__header-right">
                  <div v-if="r.anomalous" class="lab-report__badge">Signal atypique</div>
                  <div class="lab-report__meta-row lab-report__meta-row--right">
                    <span class="sw-key">Fiabilité</span>
                    <span class="sw-val">{{ r.fiability }}%</span>
                  </div>
                </div>
              </div>
              <div v-if="getGraphName(r.instrumentId)" class="lab-report__graph-label">{{ getGraphName(r.instrumentId) }}</div>
              <LabReportSpectrogram
                v-if="r.instrumentId === 'analyseur-spectral'"
                :obs-id="selectedObs?.id ?? ''"
                :fiability="r.fiability"
                :duration-sec="r.durationSec ?? 72"
                :anomalous="r.anomalous ?? false"
                :structure="selectedObs?.type === 'SIGNAL' ? (selectedObs?.structure ?? 'non uniforme') : 'non uniforme'"
                class="lab-report__output"
              />
              <LabReportStructureTemporelle
                v-else-if="r.instrumentId === 'analyseur-structure-temporelle'"
                :obs-id="selectedObs?.id ?? ''"
                :fiability="r.fiability"
                :duration-sec="r.durationSec ?? 72"
                :anomalous="r.anomalous ?? false"
                :structure="selectedObs?.type === 'SIGNAL' ? (selectedObs?.structure ?? 'non uniforme') : 'non uniforme'"
                class="lab-report__output"
              />
              <LabReportPolarisation
                v-else-if="r.instrumentId === 'analyseur-polarisation'"
                :obs-id="selectedObs?.id ?? ''"
                :fiability="r.fiability"
                :anomalous="r.anomalous ?? false"
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
              <LabReportMagneto
                v-else-if="r.instrumentId === 'magnetometre'"
                :obs-id="selectedObs?.id ?? ''"
                :system-id="selectedObs?.system_id ?? ''"
                :fiability="r.fiability"
                :anomalous="r.anomalous ?? false"
                class="lab-report__output"
              />
            </div>
            <div v-if="selectedReports.length === 0 && !Object.keys(runningForSelected).length" class="lab-report" style="opacity: 0.7">
              Lancez un instrument depuis la colonne droite.
            </div>
          </div>
        </template>
      </div>

      <!-- Colonne droite : instruments -->
      <div class="lab-instruments-col">
        <div class="lab-instruments__title">Instruments</div>
        <div v-if="!selectedObs" class="lab-no-selection">
          Sélectionnez une observation pour lancer des analyses.
        </div>
        <div v-else class="lab-instruments-grid">
          <InstrumentButton
            v-for="instr in getInstrumentsForObservation(selectedObs)"
            :key="instr.id"
            :instrument="instr"
            :state="instrumentState(instr, selectedObs)"
            :progress="runningForSelected[instr.id]?.progress ?? 0"
            :disabled-reason="getDisabledReason(instr, selectedObs)"
            @click="launchInstrument(instr, selectedObs)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
