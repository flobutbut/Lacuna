<script setup>
import '@/assets/components/artifact.css'
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useTracesStore } from '@/stores/traces'
import { useNotificationsStore } from '@/stores/notifications'
import { formatDate } from '@/lib/formatUtils'
import { getTraceIcon } from '@/constants/menus'
import NavMenuItem from '@/components/NavMenuItem.vue'

const tracesStore = useTracesStore()
const { artefacts } = storeToRefs(tracesStore)
const notificationsStore = useNotificationsStore()

const selectedTrace = ref(null)
const interpretations = ref([])
const newInterpretation = ref('')
const loadingInterpretations = ref(false)
const submittingInterpretation = ref(false)
const deletingId = ref(null)

const selectedId = computed(() => selectedTrace.value?.id)

async function loadInterpretations(traceId) {
  if (!traceId) return
  loadingInterpretations.value = true
  interpretations.value = []
  const list = await tracesStore.fetchInterpretations(traceId)
  // Ignore une réponse arrivée après un changement de trace
  if (selectedTrace.value?.id !== traceId) return
  interpretations.value = list
  loadingInterpretations.value = false
}

async function submitInterpretation() {
  const text = newInterpretation.value?.trim()
  if (!text || !selectedTrace.value) return
  submittingInterpretation.value = true
  try {
    const interp = await tracesStore.addInterpretation(selectedTrace.value.id, text)
    if (interp) interpretations.value = [...interpretations.value, interp]
    newInterpretation.value = ''
  } catch (err) {
    console.warn('[Artefacts] Erreur ajout interprétation:', err?.message)
    notificationsStore.showNotification('Ajout de l\'interprétation impossible', 5000, 'error')
  } finally {
    submittingInterpretation.value = false
  }
}

async function deleteInterpretation(interp) {
  if (!interp?.id || !selectedTrace.value) return
  deletingId.value = interp.id
  try {
    await tracesStore.deleteInterpretation(selectedTrace.value.id, interp.id)
    interpretations.value = interpretations.value.filter(i => i.id !== interp.id)
  } catch (err) {
    console.warn('[Artefacts] Erreur suppression interprétation:', err?.message)
    notificationsStore.showNotification('Suppression impossible — migration RLS peut-être non appliquée', 5000)
  } finally {
    deletingId.value = null
  }
}

function selectTrace(trace) {
  selectedTrace.value = trace
  if (trace?.id?.startsWith('player-')) {
    tracesStore.markAsRead(trace.id)
  }
}

watch(selectedTrace, (trace) => {
  if (trace) loadInterpretations(trace.id)
}, { immediate: true })

function ensureSelection() {
  if (artefacts.value.length > 0 && !selectedTrace.value) {
    selectTrace(artefacts.value[0])
  }
}

tracesStore.fetchImmutableTraces()
watch(artefacts, ensureSelection, { immediate: true })
</script>

<template>
  <div class="page-full page-full--spread">
    <div class="artifacts-layout">
      <!-- Colonne gauche : grille -->
      <div class="artifacts-grid-col">
        <h1 class="page-title">Artefacts</h1>
        <div class="panel-section-title mb-6">
          {{ artefacts.length }} trace{{ artefacts.length > 1 ? 's' : '' }} collectée{{ artefacts.length > 1 ? 's' : '' }}
        </div>
        <div class="artifact-grid">
          <NavMenuItem
            v-for="art in artefacts"
            :key="art.id"
            variant="slot"
            :icon="getTraceIcon(art.type)"
            :label="art.designation"
            :selected="selectedId === art.id"
            :badge="!!art.unread"
            @click="selectTrace(art)"
          />
        </div>
      </div>

      <!-- Colonne droite : détail -->
      <div class="artifacts-detail-col">
        <div v-if="selectedTrace" class="artifact-detail">
          <div class="artifact-detail__header">
            <div class="artifact-detail__icon">{{ getTraceIcon(selectedTrace.type) }}</div>
            <div class="artifact-detail__info">
              <div class="artifact-detail__name">{{ selectedTrace.designation }}</div>
              <div class="artifact-detail__type">{{ selectedTrace.type }} · {{ selectedTrace.system_id }}</div>
            </div>
          </div>

          <p class="artifact-detail__description">{{ selectedTrace.description }}</p>
          <p v-if="selectedTrace.discovered" class="artifact-detail__meta">
            Découvert le {{ selectedTrace.discovered }}
          </p>

          <div class="artifact-interpretations">
            <div class="artifact-interpretations__title">Interprétations</div>
            <div v-if="loadingInterpretations" class="artifact-interpretation text-muted">
              Chargement…
            </div>
            <div
              v-for="interp in interpretations"
              :key="interp.id"
              class="artifact-interpretation"
            >
              <div class="artifact-interpretation__row">
                <div class="artifact-interpretation__content">
                  <div class="artifact-interpretation__meta">
                    {{ interp.generation ? `Génération ${interp.generation}` : 'Vaisseau inconnu' }}
                    {{ interp.galactic_date ? ` · ${interp.galactic_date}` : '' }}
                    {{ interp.confidence ? ` · ${interp.confidence}` : '' }}
                    · {{ formatDate(interp.created_at) }}
                  </div>
                  <div class="artifact-interpretation__text">{{ interp.text }}</div>
                </div>
                <button
                  type="button"
                  class="artifact-interpretation__delete"
                  title="Supprimer"
                  :disabled="deletingId === interp.id"
                  @click="deleteInterpretation(interp)"
                >
                  {{ deletingId === interp.id ? '…' : '×' }}
                </button>
              </div>
            </div>
            <div v-if="!loadingInterpretations && interpretations.length === 0" class="artifact-interpretation text-muted">
              Aucune interprétation pour l’instant.
            </div>

            <div class="artifact-interpret-form">
              <textarea
                v-model="newInterpretation"
                placeholder="Écrire une interprétation…"
                :disabled="submittingInterpretation"
              />
              <button
                type="button"
                class="btn btn-primary"
                :disabled="!newInterpretation?.trim() || submittingInterpretation"
                @click="submitInterpretation"
              >
                {{ submittingInterpretation ? 'Envoi…' : 'Déposer' }}
              </button>
            </div>
          </div>
        </div>
        <div v-else class="artifact-detail artifact-detail--empty">
          <p class="artifact-detail__placeholder">Sélectionnez une trace</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.artifact-detail__description {
  font-size: var(--text-base);
  color: var(--color-white);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-4);
}

.artifact-detail__meta {
  font-size: var(--text-base);
  color: var(--color-muted);
}

.artifact-detail--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.artifact-detail__placeholder {
  color: var(--color-muted);
  font-size: var(--text-base);
}
</style>
