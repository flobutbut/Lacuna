<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useObservationsStore } from '@/stores/observations'
import { useLabReportsStore } from '@/stores/labReports'
import { useTracesStore } from '@/stores/traces'
import { useStellarSystemsStore } from '@/stores/stellarSystems'
import { useShipStore } from '@/stores/ship'
import { useUIStore } from '@/stores/ui'
import { OBJECT_TYPE_LABELS } from '@/constants/objectTypes'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import LabReportSpectrogram from '@/components/lab/LabReportSpectrogram.vue'
import LabReportStructureTemporelle from '@/components/lab/LabReportStructureTemporelle.vue'
import LabReportPolarisation from '@/components/lab/LabReportPolarisation.vue'
import LabReportSpectreEnergetique from '@/components/lab/LabReportSpectreEnergetique.vue'
import LabReportGravimetrique from '@/components/lab/LabReportGravimetrique.vue'
import LabReportSpectreStellaire from '@/components/lab/LabReportSpectreStellaire.vue'
import LabReportOrbital from '@/components/lab/LabReportOrbital.vue'
import LabReportAtmosphere from '@/components/lab/LabReportAtmosphere.vue'
import LabInstrumentIcon from '@/components/lab/LabInstrumentIcon.vue'
import SignalTypeIcon from '@/components/SignalTypeIcon.vue'
import ObservationTypeIcon from '@/components/ObservationTypeIcon.vue'

const route = useRoute()
const obsStore = useObservationsStore()
const labReportsStore = useLabReportsStore()
const tracesStore = useTracesStore()
const stellarStore = useStellarSystemsStore()
const shipStore = useShipStore()
const { list: obsList } = storeToRefs(obsStore)
const ui = useUIStore()

const OBS_STATES = { PENDING: 'En attente', RUNNING: 'Analyse en cours', DONE: 'Analysé' }

const NIVEAUX = { PASSIF: 'Passif', SYSTEME: 'Système', ORBITE: 'Orbite proche', CONTACT: 'Contact' }
const SIGNAL_SUPPORTS = { EM_RADIO: 'EM radio', GAMMA_X: 'Gamma/X', GRAVITATIONNEL: 'Gravitationnel' }

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

const GRAPH_NAMES = {
  'analyseur-spectral': 'spectrogramme',
  'analyseur-structure-temporelle': '',
  'analyseur-polarisation': 'ellipse de polarisation',
  'analyseur-spectre-energetique': 'spectre énergétique',
  'analyseur-gravimetrique': 'modèle sources + résidus',
  'spectro-stellaire': 'spectre + courbe de lumière',
  'analyseur-orbital': 'diagramme orbital',
  'spectro-atmo': 'profil moléculaire',
}

function getGraphName(instrumentId) {
  return GRAPH_NAMES[instrumentId] ?? 'données'
}

function hasRunningForObs(obs) {
  if (!obs) return false
  return Object.keys(running.value).some((k) => k.startsWith(obs.id + '-'))
}

const MIN_REPORTS_FOR_CONCLUSION = 2

function getAnalysisConclusion(obs, reportCount) {
  if (!obs || reportCount < MIN_REPORTS_FOR_CONCLUSION) return null
  if (obs.type !== 'SIGNAL') return null
  const struct = (obs.structure ?? '').toLowerCase()
  const support = obs.support ?? ''
  if (/sursaut|burst/.test(struct)) {
    if (support === 'GAMMA_X') return 'Probablement un sursaut gamma'
    if (support === 'EM_RADIO') return 'Probablement un sursaut radio (FRB)'
    if (support === 'GRAVITATIONNEL') return 'Probablement une onde gravitationnelle'
  }
  if (/pulsé régulier|pulse regulier/.test(struct) && support === 'EM_RADIO') {
    return 'Probablement un pulsar'
  }
  if (/continu décroissant|decroissant/.test(struct) && support === 'EM_RADIO') {
    return 'Probablement une émission post-supernova'
  }
  if (/^continu$/.test(struct) && support === 'EM_RADIO') {
    return 'Probablement une émission synchrotron'
  }
  if (/non uniforme/.test(struct) && support === 'EM_RADIO') {
    return 'Signal ponctuel — origine non identifiée'
  }
  return null
}

const observations = computed(() =>
  [...obsList.value].sort((a, b) => Number(b.id) - Number(a.id))
)

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
        const fiability = 50 + Math.floor(Math.random() * 45)
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
  ui.showNotification(`Trace « ${obs.name} » ajoutée aux Artefacts`)
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

onMounted(async () => {
  await ensureStoresLoaded(obsStore, stellarStore)
  const obsIds = observations.value.map((o) => o.id)
  await labReportsStore.fetchForObservations(obsIds)
  reports.value = { ...labReportsStore.cache }
  ui.clearLabHasNew()
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
        <div class="lab-observations__title">File d'observations</div>
        <div v-if="observations.length === 0" class="lab-empty-observations">
          Aucune observation. Ajoutez-en depuis l'Observatoire ou une notification.
        </div>
        <div
          v-for="obs in observations"
          v-else
          :key="obs.id"
          class="lab-observation-item"
          :class="{ selected: selectedId === obs.id, 'lab-observation-item--signal': obs.type === 'SIGNAL' }"
          @click="selectObservation(obs)"
        >
          <button type="button" class="lab-observation-item__dismiss" aria-label="Supprimer" @click.prevent.stop="removeObservation(obs)">×</button>
          <SignalTypeIcon v-if="obs.type === 'SIGNAL'" :structure="obs.structure" :size="12" class="lab-observation-item__type-icon" />
          <ObservationTypeIcon v-else :type="obs.type" :size="12" class="lab-observation-item__type-icon" />
          <div class="lab-observation-item__name">{{ obs.name }}</div>
          <div class="lab-observation-item__meta">{{ OBJECT_TYPE_LABELS[obs.type] }}{{ obs.type === 'SIGNAL' && obs.support ? ` (${SIGNAL_SUPPORTS[obs.support] ?? obs.support})` : '' }} · {{ obs.system }}</div>
          <div class="lab-observation-item__meta">{{ obs.date }}</div>
          <div
            class="lab-observation-item__state"
            :class="{
              'lab-observation-item__state--has-reports': (reports[obs.id]?.length ?? 0) > 0 && !hasRunningForObs(obs),
              'lab-observation-item__state--running': hasRunningForObs(obs),
            }"
          >
            {{ hasRunningForObs(obs) ? 'Analyse en cours…' : (reports[obs.id] || []).length > 0 ? `${(reports[obs.id] || []).length} analyse${(reports[obs.id] || []).length > 1 ? 's' : ''} réalisée${(reports[obs.id] || []).length > 1 ? 's' : ''}` : 'En attente' }}
          </div>
        </div>
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
              <div class="lab-selected__meta">Système : {{ selectedObs.system }} — {{ selectedObs.distance }}</div>
              <div class="lab-selected__meta">Coordonnées : {{ selectedObs.coords }}</div>
              <div class="lab-selected__meta">Date de détection : {{ selectedObs.date }}</div>
              <template v-if="selectedObs.type === 'SIGNAL'">
                <div class="lab-selected__meta">Support : {{ SIGNAL_SUPPORTS[selectedObs.support] ?? selectedObs.support ?? 'EM radio' }}</div>
                <div class="lab-selected__meta lab-selected__meta--type">
                  <span class="lab-selected__meta-label">Type :</span>
                  <span class="lab-selected__meta-val">
                    <SignalTypeIcon :structure="selectedObs.structure" :size="12" />
                    {{ selectedObs.structure ?? 'non uniforme' }}
                  </span>
                </div>
              </template>
              <div v-else class="lab-selected__meta">Niveau d'observation : {{ selectedObs.niveau }}</div>
            </div>
            <div class="lab-selected__header-action">
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
                  <div class="lab-report__instrument">{{ r.instrument }}</div>
                  <div class="lab-report__meta">{{ r.date }} · {{ r.duration }}</div>
                </div>
                <div class="lab-report__header-right">
                  <span v-if="r.anomalous" class="lab-report__badge">Signal atypique</span>
                  <span class="lab-report__fiability">Fiab. {{ r.fiability }}%</span>
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
          <div
            v-for="instr in getInstrumentsForObservation(selectedObs)"
            :key="instr.id"
            class="artifact-slot lab-instrument"
            :class="{
              'lab-instrument--disabled': instrumentState(instr, selectedObs) === 'disabled',
              'lab-instrument--running': instrumentState(instr, selectedObs) === 'running',
              'lab-instrument--done': instrumentState(instr, selectedObs) === 'done',
            }"
            role="button"
            tabindex="0"
            @click="instrumentState(instr, selectedObs) !== 'disabled' && launchInstrument(instr, selectedObs)"
            @keydown.enter.space.prevent="instrumentState(instr, selectedObs) !== 'disabled' && launchInstrument(instr, selectedObs)"
          >
            <div
              v-if="instrumentState(instr, selectedObs) === 'running' && runningForSelected[instr.id]"
              class="lab-instrument__progress-bg"
            >
              <div
                class="lab-instrument__progress-fill"
                :style="{ width: `${runningForSelected[instr.id].progress}%` }"
              />
            </div>
            <div class="lab-instrument__content">
              <div class="lab-instrument__icon-wrap art-icon">
                <LabInstrumentIcon :instrument-id="instr.id" :size="36" />
                <span v-if="instrumentState(instr, selectedObs) === 'done'" class="lab-instrument__check">✓</span>
              </div>
              <div class="lab-instrument__name art-name">{{ instr.name }}</div>
              <span
                v-if="instrumentState(instr, selectedObs) === 'disabled'"
                class="lab-instrument__reason"
              >
                {{ getDisabledReason(instr, selectedObs) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
