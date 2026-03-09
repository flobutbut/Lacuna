<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useObservationsStore } from '@/stores/observations'
import { useTracesStore } from '@/stores/traces'
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const obsStore = useObservationsStore()
const tracesStore = useTracesStore()
const { list: obsList } = storeToRefs(obsStore)
const ui = useUIStore()
const OBJECT_TYPES = {
  SIGNAL: 'Signal reçu',
  PLANETE: 'Corps planétaire',
  MINEUR: 'Corps mineur',
  OBJET: 'Objet récupéré',
  ATMOSPHERE: 'Atmosphère',
  ETOILE: 'Étoile',
}

const OBS_STATES = { PENDING: 'En attente', RUNNING: 'Analyse en cours', DONE: 'Analysé' }

const NIVEAUX = { PASSIF: 'Passif', SYSTEME: 'Système', ORBITE: 'Orbite proche', CONTACT: 'Contact' }

const INSTRUMENTS = [
  { id: 'recepteur-radio', name: 'Récepteur radio', niveau: 'PASSIF', delay: 'Court' },
  { id: 'detecteur-energie', name: 'Détecteur d\'événements énergétiques', niveau: 'PASSIF', delay: 'Court' },
  { id: 'detecteur-grav', name: 'Détecteur gravitationnel', niveau: 'PASSIF', delay: 'Moyen' },
  { id: 'spectro-stellaire', name: 'Spectromètre stellaire', niveau: 'PASSIF', delay: 'Moyen' },
  { id: 'analyseur-orbital', name: 'Analyseur orbital', niveau: 'SYSTEME', delay: 'Long' },
  { id: 'spectro-atmo', name: 'Spectromètre atmosphérique', niveau: 'ORBITE', delay: 'Moyen' },
  { id: 'analyseur-vol', name: 'Analyseur volumétrique', niveau: 'ORBITE', delay: 'Long' },
  { id: 'scanner-morpho', name: 'Scanner morphologique', niveau: 'ORBITE', delay: 'Moyen' },
  { id: 'magnetometre', name: 'Magnétomètre', niveau: 'ORBITE', delay: 'Court' },
  { id: 'spectro-contact', name: 'Spectromètre de contact', niveau: 'CONTACT', delay: 'Long' },
  { id: 'analyseur-echantillon', name: 'Analyseur d\'échantillon', niveau: 'CONTACT', delay: 'Très long' },
  { id: 'scanner-morpho-prec', name: 'Scanner morphologique précis', niveau: 'CONTACT', delay: 'Long' },
]

const NIVEAU_ORDER = { PASSIF: 0, SYSTEME: 1, ORBITE: 2, CONTACT: 3 }

function getRawDataExample(type) {
  const map = {
    SIGNAL: 'Fréquence, durée, polarisation, forme d\'onde brute',
    PLANETE: 'Masse estimée, demi-grand axe, type orbital, albédo',
    ATMOSPHERE: 'Pression estimée, température, spectre de réflexion grossier',
    MINEUR: 'Trajectoire, vitesse, dimensions estimées',
    OBJET: 'Dimensions, masse, température de surface',
    ETOILE: 'Type spectral, luminosité, variations de courbe',
  }
  return map[type] ?? 'Données brutes'
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
  if (selectedObs.value?.id === obs.id) selectedObs.value = null
  delete reports.value[obs.id]
  const next = { ...running.value }
  Object.keys(next).forEach((k) => {
    if (k.startsWith(obs.id + '-')) delete next[k]
  })
  running.value = next
}

function getObsNiveauKey(obs) {
  return Object.keys(NIVEAUX).find(k => NIVEAUX[k] === obs.niveau) || 'PASSIF'
}

function instrumentState(instr, obs) {
  if (!obs) return 'disabled'
  const key = `${obs.id}-${instr.id}`
  if (running.value[key]) return 'running'
  if (reports.value[obs.id]?.some(r => r.instrumentId === instr.id)) return 'done'
  const obsNiveau = NIVEAU_ORDER[getObsNiveauKey(obs)] ?? 0
  const instrNiveau = NIVEAU_ORDER[instr.niveau] ?? 0
  if (instrNiveau > obsNiveau) return 'disabled'
  return 'available'
}

function launchInstrument(instr, obs) {
  if (!obs || instrumentState(instr, obs) !== 'available') return
  const key = `${obs.id}-${instr.id}`
  running.value = { ...running.value, [key]: { progress: 0, instr, obs } }
  if (obs.state === OBS_STATES.PENDING) obs.state = OBS_STATES.RUNNING
  startSimulation()
}

function startSimulation() {
  if (animationFrame.value) return
  const tick = () => {
    let hasActive = false
    Object.keys(running.value).forEach(key => {
      const r = running.value[key]
      const step = r.instr.delay === 'Court' ? 0.08 : r.instr.delay === 'Moyen' ? 0.04 : r.instr.delay === 'Très long' ? 0.015 : 0.025
      r.progress = Math.min(100, r.progress + step)
      if (r.progress >= 100) {
        const fiability = 50 + Math.floor(Math.random() * 45)
        const newReports = reports.value[r.obs.id] || []
        newReports.push({
          instrumentId: r.instr.id,
          instrument: r.instr.name,
          fiability,
          date: new Date().toISOString().slice(0, 10),
          duration: '2h',
          results: `${r.instr.name} — Données produites. Fiabilité ${fiability}%.`,
        })
        reports.value = { ...reports.value, [r.obs.id]: newReports }
        const next = { ...running.value }
        delete next[key]
        running.value = next
        const obs = observations.value.find(o => o.id === r.obs.id)
        const hasAnyRunning = Object.keys(running.value).some(k => k.startsWith(r.obs.id))
        if (obs && !hasAnyRunning) obs.state = OBS_STATES.DONE
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
    systemId: obs.system,
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

onMounted(() => {
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
          <div class="lab-observation-item__name">{{ obs.name }}</div>
          <div class="lab-observation-item__meta">{{ OBJECT_TYPES[obs.type] }} · {{ obs.system }}</div>
          <div class="lab-observation-item__meta">{{ obs.date }}</div>
          <div
            class="lab-observation-item__state"
            :class="{ analysed: obs.state === OBS_STATES.DONE }"
          >
            {{ obs.state }}
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
              <div class="lab-selected__meta">Niveau d'observation : {{ selectedObs.niveau }}</div>
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
            <div class="lab-selected__section-title">Données brutes</div>
            <div class="lab-raw-data">{{ getRawDataExample(selectedObs.type) }}</div>
          </div>

          <div class="lab-selected__section">
            <div class="lab-selected__section-title">Rapports d'analyse</div>
            <div v-for="r in selectedReports" :key="r.instrumentId + r.date" class="lab-report">
              <div class="lab-report__header">
                <span class="lab-report__instrument">{{ r.instrument }}</span>
                <span class="lab-report__fiability">Fiab. {{ r.fiability }}%</span>
              </div>
              <div class="lab-report__meta">{{ r.date }} · {{ r.duration }}</div>
              <div class="lab-report__results">{{ r.results }}</div>
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
          v-for="instr in INSTRUMENTS"
          :key="instr.id"
          class="lab-instrument"
          :class="{
            'lab-instrument--disabled': instrumentState(instr, selectedObs) === 'disabled',
            'lab-instrument--running': instrumentState(instr, selectedObs) === 'running',
            'lab-instrument--done': instrumentState(instr, selectedObs) === 'done',
          }"
          @click="launchInstrument(instr, selectedObs)"
        >
          <div class="lab-instrument__row">
            <span class="lab-instrument__name">{{ instr.name }}</span>
            <span v-if="instrumentState(instr, selectedObs) === 'done'" class="lab-instrument__status">✓</span>
          </div>
          <div
            v-if="instrumentState(instr, selectedObs) === 'running' && runningForSelected[instr.id]"
            class="bar-wrap"
          >
            <div
              class="bar-fill bar-fill--cyan"
              :style="{ width: `${runningForSelected[instr.id].progress}%` }"
            />
          </div>
          <div v-else-if="instrumentState(instr, selectedObs) === 'disabled'" class="lab-instrument__status">
            Niveau insuffisant
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>
