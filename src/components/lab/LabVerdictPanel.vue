<script setup>
import { ref, computed, watch } from 'vue'
import { useVerdictsStore } from '@/stores/verdicts'
import { DEVIATION_FAMILIES } from '@/lib/deviations'
import { computeShipDrake, FAMILY_TERM, formatTerm } from '@/lib/drake'
import {
  VERDICT_READINGS,
  CONFIDENCE_LEVELS,
  VERDICT_NOTE_MAX,
  getReadingLabel,
  getConfidenceLabel,
  formatVerdict,
} from '@/lib/verdicts'

/**
 * LabVerdictPanel — Verdict du joueur sur l'observation sélectionnée (LACUNA_VERDICT.md §5).
 * Formulaire (lecture, confiance, note) tant qu'il n'y a pas de verdict ou pendant une révision ;
 * sinon une ligne avec le verdict courant, « Réviser », et l'historique des verdicts précédents.
 */
const props = defineProps({
  observationId: { type: String, required: true },
  /** Nom de l'observation (titre de l'entrée de journal) */
  observationName: { type: String, default: '' },
  /** Famille de l'écart principal (getMainDeviationFamily), null si aucun écart mesuré */
  family: { type: String, default: null },
  /** Nombre de rapports qui mesurent l'écart principal */
  familySightings: { type: Number, default: 0 },
})

const verdictsStore = useVerdictsStore()

const current = computed(() => verdictsStore.getCurrent(props.observationId))
const previous = computed(() => verdictsStore.getHistory(props.observationId).slice(1))

const editing = ref(false)
const reading = ref(null)
const confidence = ref('HYPOTHÈSE')
const note = ref('')
const logToJournal = ref(true)
const saving = ref(false)
const error = ref('')
/** Variation du Drake de bord due au dernier verdict rendu ici : { term, from, to } */
const drakeChange = ref(null)

const TERM_LABELS = { fl: 'fl', fi: 'fi', fc: 'fc', l_val: 'L' }

function resetForm() {
  reading.value = current.value?.reading ?? null
  confidence.value = current.value?.confidence ?? 'HYPOTHÈSE'
  note.value = current.value?.note ?? ''
  logToJournal.value = true
  error.value = ''
}

watch(() => props.observationId, () => {
  editing.value = false
  drakeChange.value = null
  resetForm()
}, { immediate: true })

const showForm = computed(() => !current.value || editing.value)
const canSubmit = computed(() => !!reading.value && !!confidence.value && !saving.value)

function startRevision() {
  resetForm()
  editing.value = true
}

function cancelRevision() {
  editing.value = false
  resetForm()
}

async function submit() {
  if (!canSubmit.value) return
  saving.value = true
  error.value = ''
  const before = computeShipDrake(verdictsStore.currentVerdicts).terms
  const res = await verdictsStore.record(props.observationId, {
    reading: reading.value,
    confidence: confidence.value,
    note: note.value,
    family: props.family,
    logToJournal: logToJournal.value,
    observationName: props.observationName,
    sightings: props.familySightings,
  })
  saving.value = false
  if (res.error) {
    error.value = 'Le verdict n’a pas pu être enregistré.'
    return
  }
  editing.value = false
  const term = FAMILY_TERM[props.family]
  const after = computeShipDrake(verdictsStore.currentVerdicts).terms
  drakeChange.value = term && Math.abs(after[term] - before[term]) > 1e-9
    ? { term, from: before[term], to: after[term] }
    : null
}

function familyLabel(family) {
  return family ? (DEVIATION_FAMILIES[family]?.label ?? family) : null
}
</script>

<template>
  <div class="lab-verdict" :class="{ 'lab-verdict--highlight': family && !current }">
    <div class="lab-verdict__title">
      Verdict
      <span v-if="family" class="lab-verdict__family">— écart principal : {{ familyLabel(family) }}</span>
    </div>

    <form v-if="showForm" class="lab-verdict__form" @submit.prevent="submit">
      <fieldset class="lab-verdict__field">
        <legend class="sw-key">Lecture</legend>
        <div class="lab-verdict__choices">
          <button
            v-for="r in VERDICT_READINGS"
            :key="r.id"
            type="button"
            class="btn btn-secondary"
            :class="{ 'is-active': reading === r.id }"
            :aria-pressed="reading === r.id"
            :title="r.hint"
            @click="reading = r.id"
          >
            {{ r.label }}
          </button>
        </div>
      </fieldset>

      <fieldset class="lab-verdict__field">
        <legend class="sw-key">Confiance</legend>
        <div class="lab-verdict__choices">
          <button
            v-for="c in CONFIDENCE_LEVELS"
            :key="c.id"
            type="button"
            class="btn btn-secondary"
            :class="{ 'is-active': confidence === c.id }"
            :aria-pressed="confidence === c.id"
            @click="confidence = c.id"
          >
            {{ c.label }}
          </button>
        </div>
      </fieldset>

      <label class="lab-verdict__field">
        <span class="sw-key">Note <span class="lab-verdict__optional">(facultative)</span></span>
        <textarea
          v-model="note"
          class="lab-verdict__note"
          rows="2"
          :maxlength="VERDICT_NOTE_MAX"
          placeholder="Une phrase sur ce que vous en pensez."
        />
        <span class="lab-verdict__count">{{ note.length }} / {{ VERDICT_NOTE_MAX }}</span>
      </label>

      <label class="lab-verdict__journal">
        <input v-model="logToJournal" type="checkbox" />
        <span>Consigner au journal</span>
      </label>

      <div v-if="error" class="lab-verdict__error" role="alert">{{ error }}</div>

      <div class="lab-verdict__actions">
        <button v-if="editing" type="button" class="btn btn-secondary" @click="cancelRevision">Annuler</button>
        <button type="submit" class="btn btn-primary" :disabled="!canSubmit">
          {{ saving ? 'Enregistrement…' : (editing ? 'Réviser le verdict' : 'Rendre le verdict') }}
        </button>
      </div>
    </form>

    <div v-else class="lab-verdict__current">
      <div class="lab-verdict__summary">
        <span class="lab-verdict__reading">{{ getReadingLabel(current.reading) }}</span>
        <span class="lab-verdict__meta">{{ getConfidenceLabel(current.confidence).toLowerCase() }} · génération {{ current.generation }} · {{ current.shipDate }}</span>
        <button type="button" class="btn btn-secondary lab-verdict__revise" @click="startRevision">Réviser</button>
      </div>
      <p v-if="current.note" class="lab-verdict__quote">« {{ current.note }} »</p>
      <p v-if="current.logbookEntryId" class="lab-verdict__logged">Consigné au journal.</p>
      <p v-if="drakeChange" class="lab-verdict__logged">
        {{ TERM_LABELS[drakeChange.term] }} de bord : {{ formatTerm(drakeChange.term, drakeChange.from) }}
        → {{ formatTerm(drakeChange.term, drakeChange.to) }}
      </p>
    </div>

    <div v-if="previous.length" class="lab-verdict__history">
      <div class="lab-verdict__history-title">Verdicts précédents</div>
      <ul class="lab-verdict__history-list">
        <li v-for="v in previous" :key="v.id">
          <span class="sw-key">Génération {{ v.generation }} · {{ v.shipDate }}</span>
          <span class="sw-val">{{ formatVerdict(v) }}</span>
          <span v-if="v.note" class="lab-verdict__history-note">« {{ v.note }} »</span>
        </li>
      </ul>
    </div>
  </div>
</template>
