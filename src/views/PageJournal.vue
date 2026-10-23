<script setup>
/**
 * Journal de bord — fil chronologique du vaisseau (LACUNA_UI.md, module Journal de bord).
 * Entrées écrites par le serveur (AUTO, GENERATIONNEL) et par le joueur (MANUEL), filtre par type.
 */
import '@/assets/components/journal.css'
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useJournalStore, JOURNAL_TITLE_MAX, JOURNAL_TEXT_MAX } from '@/stores/journal'
import { useObservationsStore } from '@/stores/observations'
import { useVerdictsStore } from '@/stores/verdicts'
import { ensureStoresLoaded } from '@/composables/useStoreReady'
import AppTextField from '@/components/AppTextField.vue'
import { NOTICE_TITLE, NOTICE_HEADER, NOTICE_SECTIONS } from '@/constants/notice'

const journalStore = useJournalStore()
const obsStore = useObservationsStore()
const verdictsStore = useVerdictsStore()

/** Verdicts par entrée de journal (lab_verdicts.logbook_entry_id) */
const verdictByEntry = computed(() => {
  const out = {}
  for (const list of Object.values(verdictsStore.byObs)) {
    for (const v of list) if (v.logbookEntryId) out[v.logbookEntryId] = v
  }
  return out
})

/**
 * Fil conducteur (LACUNA_VERDICT.md §8) : une entrée de verdict propose « Créer un artefact »
 * tant que ce verdict est le verdict courant et qu'aucun artefact n'en a été déposé.
 */
function artifactStep(entry) {
  const v = verdictByEntry.value[entry.id]
  if (!v) return null
  if (v.traceId) return { done: true }
  if (verdictsStore.getCurrent(v.observationId)?.id !== v.id) return null
  return { to: { path: '/laboratoire', query: { select: v.observationId, artefact: '1' } } }
}

const FILTERS = [
  { id: 'ALL', label: 'Tous' },
  { id: 'MANUEL', label: 'Manuel' },
  { id: 'AUTO', label: 'Auto' },
  { id: 'GENERATIONNEL', label: 'Générationnel' },
]
const filter = ref('ALL')
const visibleEntries = computed(() =>
  filter.value === 'ALL' ? journalStore.entries : journalStore.entries.filter((e) => e.type === filter.value)
)

/** En-tête d'une entrée : famille (ou type pour une entrée du joueur), date du vaisseau, contexte */
function entryHeader(entry) {
  return [entry.family ?? entry.type, entry.date, entry.context].filter(Boolean).join(' — ')
}

const title = ref('')
const text = ref('')
const saving = ref(false)
const saveError = ref('')
const canSave = computed(
  () =>
    !saving.value &&
    title.value.trim().length > 0 &&
    title.value.trim().length <= JOURNAL_TITLE_MAX &&
    text.value.trim().length > 0 &&
    text.value.trim().length <= JOURNAL_TEXT_MAX
)

async function save() {
  if (!canSave.value) return
  saving.value = true
  saveError.value = ''
  try {
    await journalStore.addManual({ title: title.value, text: text.value })
    title.value = ''
    text.value = ''
  } catch (e) {
    console.warn('[journal] addManual:', e?.message)
    saveError.value = 'Enregistrement impossible. Réessayez.'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await journalStore.fetch()
  await ensureStoresLoaded(obsStore)
  await verdictsStore.fetchForObservations(obsStore.list.map((o) => o.id))
})
</script>

<template>
  <div class="page-full">
    <div class="page-content journal-layout">
      <h1 class="page-title journal-layout__title">Journal de Bord</h1>

      <!-- Colonne 1 : nouvelle entrée -->
      <form class="journal-editor journal-editor--side" @submit.prevent="save">
        <AppTextField v-model="title" label="Titre" autocomplete="off" :hint="`${JOURNAL_TITLE_MAX} caractères au plus.`" />
        <label class="journal-editor__label" for="journal-text">Entrée</label>
        <textarea
          id="journal-text"
          v-model="text"
          class="journal-editor__textarea"
          :maxlength="JOURNAL_TEXT_MAX"
          rows="6"
        />
        <p v-if="saveError" class="journal-editor__error" role="alert">{{ saveError }}</p>
        <button type="submit" class="btn btn-primary" :disabled="!canSave">
          {{ saving ? 'Enregistrement…' : 'Ajouter au journal' }}
        </button>
      </form>

      <!-- Colonne 2 : filtre et fil -->
      <section class="journal-feed" aria-label="Entrées du journal">
        <!-- Notice de bord (LACUNA_LORE.md §5) : seul document de lore relisible à tout moment -->
        <details class="journal-notice">
          <summary class="journal-notice__summary">{{ NOTICE_TITLE }}</summary>
          <div class="journal-notice__body">
            <p v-for="(line, i) in NOTICE_HEADER" :key="`h${i}`" class="journal-notice__header">{{ line }}</p>
            <div v-for="(section, i) in NOTICE_SECTIONS" :key="i" class="journal-notice__section">
              <h3 v-if="section.title" class="journal-notice__title">{{ section.title }}</h3>
              <p v-for="(line, j) in section.lines" :key="j" class="journal-notice__line">{{ line }}</p>
            </div>
          </div>
        </details>
        <div class="journal-filters" role="group" aria-label="Filtrer par type">
          <button
            v-for="f in FILTERS"
            :key="f.id"
            type="button"
            class="journal-filter-btn"
            :class="{ active: filter === f.id }"
            :aria-pressed="filter === f.id"
            @click="filter = f.id"
          >
            {{ f.label }}
          </button>
        </div>

        <p v-if="journalStore.loaded && !visibleEntries.length" class="journal-empty">Aucune entrée.</p>
        <article
          v-for="entry in visibleEntries"
          :key="entry.id"
          class="journal-entry"
          :class="{ 'journal-entry--generational': entry.type === 'GENERATIONNEL' }"
        >
          <div class="journal-entry__date">{{ entryHeader(entry) }}</div>
          <div class="journal-entry__gen">Génération {{ entry.generation }}</div>
          <h2 class="journal-entry__title">{{ entry.title }}</h2>
          <div class="journal-entry__text">{{ entry.text }}</div>
          <template v-if="artifactStep(entry)">
            <p v-if="artifactStep(entry).done" class="journal-entry__next journal-entry__next--done">Artefact déposé.</p>
            <RouterLink v-else :to="artifactStep(entry).to" class="journal-entry__next">Créer un artefact →</RouterLink>
          </template>
        </article>
      </section>
    </div>
  </div>
</template>
