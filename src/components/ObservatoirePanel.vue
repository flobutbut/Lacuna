<script setup>
import { computed, ref, watch } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useObservationsStore } from '@/stores/observations'
import { useSystemObjectsStore } from '@/stores/systemObjects'
import { OBJECT_TYPE_LABELS } from '@/constants/objectTypes'

const ui = useUIStore()
const obsStore = useObservationsStore()
const systemObjectsStore = useSystemObjectsStore()
const addedBodyIds = ref(new Set())

function getFallbackBodies(star) {
  if (!star) return []
  return [
    { id: 'a', name: `${star.name}-a`, type: 'ETOILE', anomaly: star.isAnomaly ? 78 : 8 },
    { id: 'b', name: `${star.name}-b`, type: 'PLANETE', anomaly: 45 },
    { id: 'c', name: `${star.name}-c`, type: 'ATMOSPHERE', anomaly: star.isAnomaly ? 72 : 22 },
    { id: 'd', name: `${star.name}-d`, type: 'MINEUR', anomaly: 12 },
  ]
}

const bodies = computed(() => {
  const star = ui.selectedStar
  if (!star) return []
  const systemId = star.id
  const dbObjects = systemId ? systemObjectsStore.getForSystem(systemId) : []
  if (dbObjects.length > 0) {
    return dbObjects.map((obj) => systemObjectsStore.toBodyFormat(obj, star.name))
  }
  return getFallbackBodies(star)
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

function addObservation(body) {
  const name = `${body.name} · ${OBJECT_TYPE_LABELS[body.type]}`
  return obsStore.addObservation({
    name,
    type: body.type,
    system: ui.selectedStar?.name ?? '—',
    system_id: ui.selectedStar?.id ?? null,
    distance: ui.selectedStar?.dist ?? '—',
    coords: '—',
    niveau: obsStore.NIVEAUX.SYSTEME,
  })
}

function analyser(body) {
  addObservation(body)
  ui.setLabHasNew(true)
  ui.closeObservatoire()
}

const animatingKey = ref(null)

function addOnly(body) {
  const key = `${ui.selectedStar?.name}-${body.id}`
  if (addedBodyIds.value.has(key)) return
  animatingKey.value = key
  setTimeout(() => {
    addObservation(body)
    addedBodyIds.value = new Set([...addedBodyIds.value, key])
    ui.setLabHasNew(true)
    animatingKey.value = null
  }, 350)
}

function isAdded(body) {
  const key = `${ui.selectedStar?.name}-${body.id}`
  return addedBodyIds.value.has(key)
}

function isAnimating(body) {
  const key = `${ui.selectedStar?.name}-${body.id}`
  return animatingKey.value === key
}

</script>

<template>
  <div v-if="ui.observatoireOpen && ui.selectedStar" class="observatoire-panel">
    <div class="observatoire-panel__backdrop" @click="ui.closeObservatoire" />
    <div class="observatoire-panel__box">
      <div class="observatoire-panel__header">
        <h2 class="observatoire-panel__title">Observatoire — {{ ui.selectedStar.name }}</h2>
        <button type="button" class="observatoire-panel__close" @click="ui.closeObservatoire">×</button>
      </div>
      <div class="observatoire-panel__body">
        <div class="observatoire-panel__section">
          <div class="observatoire-panel__section-title">Corps détectables</div>
          <div class="observatoire-panel__bodies">
            <div
              v-for="b in bodies"
              :key="b.id"
              class="observatoire-body"
            >
              <div class="observatoire-body__info">
                <span class="observatoire-body__name">{{ b.name }}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
