<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'
import { useObservatoireStore } from '@/stores/observatoire'
import { useObservationsStore } from '@/stores/observations'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { OBJECT_TYPE_LABELS } from '@/constants/objectTypes'
import { buildObservationPayload, getBodyDisplayName as getBodyDisplayNameFromLib, getStarOnlyBody } from '@/lib/observationPayload'
import AppModal from '@/components/AppModal.vue'
import AppCard from '@/components/AppCard.vue'
import ObservationTypeIcon from '@/components/icons/ObservationTypeIcon.vue'

const router = useRouter()
const notificationsStore = useNotificationsStore()
const observatoireStore = useObservatoireStore()
const obsStore = useObservationsStore()
const systemObjectsStore = useSystemObjectsStore()

/** Nom d'affichage — délègue à lib/observationPayload */
function getBodyDisplayName(body) {
  return getBodyDisplayNameFromLib(body, observatoireStore.selectedStar?.name ?? '')
}

const bodies = computed(() => {
  if (observatoireStore.selectedBody) return [observatoireStore.selectedBody]
  const star = observatoireStore.selectedStar
  if (!star) return []
  const systemId = star.id
  const dbObjects = systemId ? systemObjectsStore.getForSystem(systemId) : []
  if (dbObjects.length > 0) {
    const formatted = dbObjects.map((obj) => systemObjectsStore.toBodyFormat(obj, star.name))
    // Déduplication par id (évite exoplanètes en double si la source renvoie des doublons)
    const seen = new Set()
    return formatted.filter((b) => {
      if (seen.has(b.id)) return false
      seen.add(b.id)
      return true
    })
  }
  return getStarOnlyBody(star)
})

const panelTitle = computed(() => {
  if (observatoireStore.selectedBody) return `Observatoire — ${getBodyDisplayName(observatoireStore.selectedBody)}`
  return `Observatoire — ${observatoireStore.selectedStar?.name ?? '—'}`
})

watch(
  () => observatoireStore.selectedStar?.id,
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
      systemName: observatoireStore.selectedStar?.name ?? '—',
      systemId: observatoireStore.selectedStar?.id ?? null,
      distance: observatoireStore.selectedStar?.dist ?? '—',
      displayName: getBodyDisplayName(body),
    },
    obsStore.NIVEAUX
  )
}

function addObservation(body) {
  return obsStore.addObservation(addObservationPayload(body))
}

async function analyser(body) {
  const star = observatoireStore.selectedStar
  const existing = star ? obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type]) : null
  if (existing) {
    observatoireStore.closeObservatoire()
    router.push({ path: '/laboratoire', query: { select: existing.id } })
    return
  }
  const obsId = await obsStore.addObservation(addObservationPayload(body))
  notificationsStore.setLabHasNew(true)
  observatoireStore.closeObservatoire()
  router.push({ path: '/laboratoire', query: { select: obsId } })
}

const animatingKey = ref(null)

function addOnly(body) {
  const star = observatoireStore.selectedStar
  if (!star || obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type])) return
  const key = `${star.name}-${body.id}`
  animatingKey.value = key
  setTimeout(() => {
    addObservation(body)
    notificationsStore.setLabHasNew(true)
    animatingKey.value = null
  }, 350)
}

function isAdded(body) {
  const star = observatoireStore.selectedStar
  return star ? !!obsStore.findObservationForBody(body, star, OBJECT_TYPE_LABELS[body.type]) : false
}

function isAnimating(body) {
  const key = `${observatoireStore.selectedStar?.name}-${body.id}`
  return animatingKey.value === key
}

</script>

<template>
  <AppModal
    v-if="observatoireStore.observatoireOpen && observatoireStore.selectedStar"
    :title="panelTitle"
    @close="observatoireStore.closeObservatoire"
  >
    <div class="observatoire-panel__section">
      <div class="observatoire-panel__section-title">{{ observatoireStore.selectedBody ? 'Corps sélectionné' : 'Corps détectables' }}</div>
      <!-- Même carte que les astres de la Carte -->
      <div class="card-list">
        <AppCard
          v-for="b in bodies"
          :key="b.id"
          :title="getBodyDisplayName(b)"
        >
          <template #icon>
            <ObservationTypeIcon :type="b.type" :size="16" />
          </template>
          <template #subtitle>
            <span>{{ OBJECT_TYPE_LABELS[b.type] }}</span>
            <span class="observatoire-body__anomaly" :class="{ high: b.anomaly >= 40 }">Anomalie {{ b.anomaly }}%</span>
          </template>
          <template #actions>
            <button type="button" class="btn btn-secondary" @click="analyser(b)">
              Analyser
            </button>
            <button
              type="button"
              class="btn btn-secondary observatoire-body__add-btn"
              :class="{ 'observatoire-body__add-btn--animating': isAnimating(b), 'is-done': isAdded(b) }"
              :disabled="isAdded(b)"
              @click="addOnly(b)"
            >
              {{ isAdded(b) ? 'Ajouté' : 'Ajouter au laboratoire' }}
            </button>
          </template>
        </AppCard>
      </div>
    </div>
  </AppModal>
</template>
