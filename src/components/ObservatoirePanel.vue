<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useObservationsStore } from '@/stores/observations'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { OBJECT_TYPE_LABELS } from '@/constants/objectTypes'
import { buildObservationPayload } from '@/lib/observationPayload'
import AppModal from '@/components/AppModal.vue'
import ModalCell from '@/components/ModalCell.vue'

const router = useRouter()
const ui = useUIStore()
const obsStore = useObservationsStore()
const systemObjectsStore = useSystemObjectsStore()

/** Nom d'affichage : nom propre prioritaire, sinon système + désignation */
function getBodyDisplayName(body) {
  const sysName = ui.selectedStar?.name ?? ''
  const fallback = body.designation ? `${sysName} ${body.designation}` : sysName || '—'
  return body.name || fallback
}

/** Corps synthétique pour l'étoile seule — utilisé quand le système n'a pas d'objets en base */
function getStarOnlyBody(star) {
  if (!star) return []
  return [{ id: 'star', name: star.name, type: 'ETOILE', anomaly: star.isAnomaly ? 78 : 8 }]
}

const bodies = computed(() => {
  if (ui.selectedBody) return [ui.selectedBody]
  const star = ui.selectedStar
  if (!star) return []
  const systemId = star.id
  const dbObjects = systemId ? systemObjectsStore.getForSystem(systemId) : []
  if (dbObjects.length > 0) {
    return dbObjects.map((obj) => systemObjectsStore.toBodyFormat(obj, star.name))
  }
  return getStarOnlyBody(star)
})

const panelTitle = computed(() => {
  if (ui.selectedBody) return `Observatoire — ${getBodyDisplayName(ui.selectedBody)}`
  return `Observatoire — ${ui.selectedStar?.name ?? '—'}`
})

watch(
  () => ui.selectedStar?.id,
  async (systemId) => {
    if (systemId && !systemObjectsStore.getForSystem(systemId)?.length) {
      await systemObjectsStore.fetchForSystem(systemId)
    }
  },
  { immediate: true }
)

function addObservationPayload(body) {
  return buildObservationPayload(
    body,
    {
      systemName: ui.selectedStar?.name ?? '—',
      systemId: ui.selectedStar?.id ?? null,
      distance: ui.selectedStar?.dist ?? '—',
      displayName: getBodyDisplayName(body),
    },
    obsStore.NIVEAUX
  )
}

function addObservation(body) {
  return obsStore.addObservation(addObservationPayload(body))
}

async function analyser(body) {
  const star = ui.selectedStar
  const existing = star ? obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type]) : null
  if (existing) {
    ui.closeObservatoire()
    router.push({ path: '/laboratoire', query: { select: existing.id } })
    return
  }
  const obsId = await obsStore.addObservation(addObservationPayload(body))
  ui.setLabHasNew(true)
  ui.closeObservatoire()
  router.push({ path: '/laboratoire', query: { select: obsId } })
}

const animatingKey = ref(null)

function addOnly(body) {
  const star = ui.selectedStar
  if (!star || obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type])) return
  const key = `${star.name}-${body.id}`
  animatingKey.value = key
  setTimeout(() => {
    addObservation(body)
    ui.setLabHasNew(true)
    animatingKey.value = null
  }, 350)
}

function isAdded(body) {
  const star = ui.selectedStar
  return star ? !!obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type]) : false
}

function isAnimating(body) {
  const key = `${ui.selectedStar?.name}-${body.id}`
  return animatingKey.value === key
}

</script>

<template>
  <AppModal
    v-if="ui.observatoireOpen && ui.selectedStar"
    :title="panelTitle"
    @close="ui.closeObservatoire"
  >
    <div class="observatoire-panel__section">
      <div class="observatoire-panel__section-title">{{ ui.selectedBody ? 'Corps sélectionné' : 'Corps détectables' }}</div>
      <div class="observatoire-panel__bodies">
        <ModalCell
          v-for="b in bodies"
          :key="b.id"
        >
          <div class="observatoire-body__info">
            <span class="observatoire-body__name">{{ getBodyDisplayName(b) }}</span>
            <span class="observatoire-body__type">{{ OBJECT_TYPE_LABELS[b.type] }}</span>
            <span class="observatoire-body__anomaly" :class="{ high: b.anomaly >= 40 }">
              Anomalie {{ b.anomaly }}%
            </span>
          </div>
          <div class="observatoire-body__actions">
            <button type="button" class="btn btn-secondary" @click="analyser(b)">
              Analyser
            </button>
            <button
              type="button"
              class="btn btn-secondary observatoire-body__add-btn"
              :class="{ 'observatoire-body__add-btn--animating': isAnimating(b), 'observatoire-body__add-btn--added': isAdded(b) }"
              :disabled="isAdded(b)"
              @click="addOnly(b)"
            >
              {{ isAdded(b) ? 'Ajouté' : 'Ajouter au laboratoire' }}
            </button>
          </div>
        </ModalCell>
      </div>
    </div>
  </AppModal>
</template>
