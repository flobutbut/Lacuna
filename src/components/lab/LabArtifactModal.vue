<script setup>
import { ref, computed } from 'vue'
import AppModal from '@/components/AppModal.vue'
import { useTracesStore } from '@/stores/traces'
import { useVerdictsStore } from '@/stores/verdicts'
import {
  PLAYER_TRACE_SUBTYPES,
  ARTIFACT_DESIGNATION_MAX,
  ARTIFACT_INTERPRETATION_MAX,
  suggestSubtype,
  suggestDesignation,
  getConfidenceLabel,
  formatVerdict,
} from '@/lib/verdicts'

/**
 * LabArtifactModal — « Créer un artefact » depuis le verdict courant (LACUNA_VERDICT.md §6.3).
 * Prérempli : désignation, sous-type suggéré, interprétation (note du verdict), écarts mesurés.
 * La trace est permanente et visible des autres vaisseaux : le formulaire le rappelle avant dépôt.
 */
const props = defineProps({
  observation: { type: Object, required: true },
  verdict: { type: Object, required: true },
  /** Écarts mesurés, une ligne par écart (« Orbitale — Résonance quasi exacte : attendu …, mesuré … ») */
  deviationLines: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'created'])

const tracesStore = useTracesStore()
const verdictsStore = useVerdictsStore()

const designation = ref(suggestDesignation(props.observation.name))
const subtype = ref(suggestSubtype(props.verdict.reading))
const interpretation = ref(props.verdict.note ?? '')
const saving = ref(false)
const error = ref('')

const canSubmit = computed(() => designation.value.trim().length >= 2 && !!subtype.value && !saving.value)

async function submit() {
  if (!canSubmit.value) return
  saving.value = true
  error.value = ''
  try {
    const { traceId, designation: final } = await tracesStore.createArtifact({
      verdict: props.verdict,
      observation: props.observation,
      designation: designation.value,
      subtype: subtype.value,
      interpretation: interpretation.value,
      deviationLines: props.deviationLines,
    })
    verdictsStore.setTrace(props.observation.id, props.verdict.id, traceId)
    emit('created', final)
  } catch (e) {
    console.warn('[artefact] create_artifact:', e?.message ?? e)
    error.value = 'L’artefact n’a pas pu être déposé.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppModal title="Créer un artefact" size="large" @close="emit('close')">
    <form id="lab-artifact-form" class="lab-verdict__form" @submit.prevent="submit">
      <p class="lab-artifact__verdict">
        <span class="sw-key">Verdict</span>
        <span class="sw-val">{{ formatVerdict(verdict) }}</span>
        <span class="sw-key">· génération {{ verdict.generation }}</span>
      </p>

      <label class="lab-verdict__field">
        <span class="sw-key">Désignation</span>
        <input v-model="designation" class="lab-verdict__note lab-artifact__designation" type="text" :maxlength="ARTIFACT_DESIGNATION_MAX" />
      </label>

      <fieldset class="lab-verdict__field">
        <legend class="sw-key">Sous-type</legend>
        <div class="lab-verdict__choices">
          <button
            v-for="t in PLAYER_TRACE_SUBTYPES"
            :key="t.id"
            type="button"
            class="btn btn-secondary"
            :class="{ 'is-active': subtype === t.id }"
            :aria-pressed="subtype === t.id"
            :title="t.hint"
            @click="subtype = t.id"
          >
            {{ t.label }}
          </button>
        </div>
      </fieldset>

      <label class="lab-verdict__field">
        <span class="sw-key">Interprétation <span class="lab-verdict__optional">({{ getConfidenceLabel(verdict.confidence).toLowerCase() }})</span></span>
        <textarea
          v-model="interpretation"
          class="lab-verdict__note"
          rows="3"
          :maxlength="ARTIFACT_INTERPRETATION_MAX"
          placeholder="Ce que les vaisseaux suivants liront de votre lecture."
        />
      </label>

      <div class="lab-verdict__field">
        <span class="sw-key">Données déposées</span>
        <ul v-if="deviationLines.length" class="lab-artifact__data">
          <li v-for="(line, i) in deviationLines" :key="i">{{ line }}</li>
        </ul>
        <p v-else class="lab-artifact__data">Aucun écart mesuré au-delà du bruit.</p>
      </div>

      <p class="lab-artifact__warning">
        Cette trace sera visible des autres vaisseaux et ne pourra pas être retirée.
      </p>

      <div v-if="error" class="lab-verdict__error" role="alert">{{ error }}</div>
    </form>

    <template #footer>
      <button type="button" class="btn btn-secondary" @click="emit('close')">Annuler</button>
      <button type="submit" form="lab-artifact-form" class="btn btn-primary" :disabled="!canSubmit">
        {{ saving ? 'Dépôt…' : 'Déposer l’artefact' }}
      </button>
    </template>
  </AppModal>
</template>
