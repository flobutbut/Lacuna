<script setup>
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useTracesStore } from '@/stores/traces'
import { useUIStore } from '@/stores/ui'
import { formatDate } from '@/lib/formatUtils'
import { getTraceIcon } from '@/constants/menus'
import NavMenuItem from '@/components/NavMenuItem.vue'

const supabaseStore = useSupabaseStore()
const tracesStore = useTracesStore()
const { playerTraces } = storeToRefs(tracesStore)
const ui = useUIStore()

// Données de repli si Supabase non configuré
const FALLBACK_TRACES = [
  { id: '1', designation: 'WOW-1977-A', type: 'SIGNAL_RADIO', system_id: 'SOL', difficulty: '1', description: 'Signal radio de 72 secondes détecté à 1420 MHz, correspondant exactement à la raie de l\'hydrogène. Non reproduit depuis. Non expliqué.', discovered: '1977-08-15', unread: true },
  { id: '2', designation: 'OUMUAMUA-2017', type: 'INTERSTELLAR_OBJECT', system_id: 'SOL', difficulty: '1', description: 'Objet interstellaire détecté en 2017. Trajectoire hyperbolique. Accélération non-gravitationnelle observée. Forme allongée suggérée. Origine inconnue.', discovered: '2017-10-19', unread: true },
  { id: '3', designation: 'BENNU-NB-2023', type: 'CHEMICAL_ANOMALY', system_id: 'SOL', difficulty: '2', description: 'Nucléobases (uracile, niacine) découvertes dans les échantillons de Bennu et Ryugu. Composition suggérant une origine prébiotique.', discovered: '2023-03-21', unread: false },
]

const selectedTrace = ref(null)
const interpretations = ref([])
const playerInterpretations = ref({}) // { traceId: [{ text, ... }] }
const newInterpretation = ref('')
const loadingInterpretations = ref(false)
const submittingInterpretation = ref(false)
const deletingId = ref(null)

const selectedId = computed(() => selectedTrace.value?.id)

const immutableTraces = ref([])

async function fetchTraces() {
  if (!supabaseStore.isConfigured()) {
    immutableTraces.value = FALLBACK_TRACES
    return
  }
  try {
    const { data, error } = await supabase
      .from('traces')
      .select('id, designation, type, system_id, difficulty, description, discovered')
      .eq('origin', 'IMMUABLE')
      .order('discovered', { ascending: true })

    if (error) throw error
    immutableTraces.value = (data || []).map(t => ({ ...t, unread: false }))
  } catch (err) {
    console.warn('[Artefacts] Erreur fetch traces:', err)
    immutableTraces.value = FALLBACK_TRACES
  }
}

const artefacts = computed(() => [...playerTraces.value, ...immutableTraces.value])

async function fetchInterpretations(traceId) {
  if (!traceId) return
  loadingInterpretations.value = true
  interpretations.value = []
  try {
    if (traceId.startsWith('player-')) {
      interpretations.value = playerInterpretations.value[traceId] || []
    } else if (supabaseStore.isConfigured()) {
      const { data, error } = await supabase
        .from('interpretations')
        .select('id, text, confidence, generation, galactic_date, created_at')
        .eq('trace_id', traceId)
        .order('created_at', { ascending: true })

      if (!error) interpretations.value = data || []
    }
  } catch (err) {
    console.warn('[Artefacts] Erreur fetch interpretations:', err)
  } finally {
    loadingInterpretations.value = false
  }
}

async function submitInterpretation() {
  const text = newInterpretation.value?.trim()
  if (!text || !selectedTrace.value) return
  const traceId = selectedTrace.value.id
  if (traceId.startsWith('player-') || !supabaseStore.isConfigured()) {
    const interp = { id: 'local-' + Date.now(), text, confidence: 'HYPOTHÈSE', generation: null, galactic_date: null, created_at: new Date().toISOString() }
    const list = playerInterpretations.value[traceId] || []
    playerInterpretations.value = { ...playerInterpretations.value, [traceId]: [...list, interp] }
    interpretations.value = [...interpretations.value, interp]
    newInterpretation.value = ''
    return
  }
  submittingInterpretation.value = true
  try {
    const { data, error } = await supabase
      .from('interpretations')
      .insert({
        trace_id: selectedTrace.value.id,
        text,
        confidence: 'HYPOTHÈSE',
        ship_id: null,
        generation: null,
      })
      .select()
      .single()

    if (error) throw error
    if (data) interpretations.value = [...interpretations.value, data]
    newInterpretation.value = ''
  } catch (err) {
    console.warn('[Artefacts] Erreur ajout interprétation:', err)
  } finally {
    submittingInterpretation.value = false
  }
}

async function deleteInterpretation(interp) {
  if (!interp?.id) return
  const traceId = selectedTrace.value?.id
  const isPlayerTrace = traceId?.startsWith('player-')
  deletingId.value = interp.id
  try {
    if (isPlayerTrace) {
      const list = (playerInterpretations.value[traceId] || []).filter(i => i.id !== interp.id)
      playerInterpretations.value = { ...playerInterpretations.value, [traceId]: list }
      interpretations.value = interpretations.value.filter(i => i.id !== interp.id)
    } else if (supabaseStore.isConfigured()) {
      const { error } = await supabase.from('interpretations').delete().eq('id', interp.id)
      if (error) throw error
      interpretations.value = interpretations.value.filter(i => i.id !== interp.id)
    } else {
      interpretations.value = interpretations.value.filter(i => i.id !== interp.id)
    }
  } catch (err) {
    console.warn('[Artefacts] Erreur suppression interprétation:', err)
    ui.showNotification('Suppression impossible — migration RLS peut-être non appliquée', 5000)
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
  if (trace) fetchInterpretations(trace.id)
}, { immediate: true })

async function init() {
  await fetchTraces()
}

function ensureSelection() {
  if (artefacts.value.length > 0 && !selectedTrace.value) {
    selectTrace(artefacts.value[0])
  }
}

init()
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
