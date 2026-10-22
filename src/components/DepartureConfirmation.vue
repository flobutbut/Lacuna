<script setup>
/**
 * Vue de confirmation du départ — sépare « fixer un cap » et « allumer les moteurs ».
 * Design system : AppModal (thème ambre), sw-val, btn-ghost / btn-amber.
 * Données et phrases : useDepartureConfirmation.
 */
import { computed } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useTransitStore } from '@/stores/transit'
import { useObservatoireStore } from '@/stores/observatoire'
import { useShipStore } from '@/stores/ship'
import { formatDuration } from '@/lib/transit'
import AppModal from '@/components/AppModal.vue'
import { useDepartureConfirmation } from '@/composables/useDepartureConfirmation'

const notificationsStore = useNotificationsStore()
const transitStore = useTransitStore()
const observatoireStore = useObservatoireStore()
const shipStore = useShipStore()

const pending = computed(() => transitStore.pendingDeparture)

const { durationPlayerLabel, durationPhysLabel, generationsCount, generationPhrase, contextPhrase } =
  useDepartureConfirmation(pending, shipStore)

const modalTitle = computed(() =>
  pending.value ? `Cap fixé — ${pending.value.name} — ${pending.value.dist} al` : ''
)

function annuler() {
  observatoireStore.clearSearchedStarId()
  transitStore.clearPendingDeparture()
  transitStore.closeDepartureConfirmation()
}

async function allumerMoteurs() {
  const p = pending.value
  if (!p || !shipStore.ship) return
  const result = await shipStore.startTransit(p.id)
  observatoireStore.clearSearchedStarId()
  transitStore.clearPendingDeparture()
  transitStore.closeDepartureConfirmation()
  if (result) {
    const durationLabel = p.transitMeta?.tJoueurSec != null ? formatDuration(p.transitMeta.tJoueurSec) : '—'
    notificationsStore.showNotification(
      `Cap fixé — ${p.name} — ${p.dist} al / Durée estimée : ${durationLabel}. Phase d'accélération en cours. / Moteurs allumés.`,
      5000
    )
  } else {
    notificationsStore.showNotification('Impossible de lancer le transit — réessayez dans un instant', 5000)
  }
}
</script>

<template>
  <AppModal
    v-if="transitStore.departureConfirmationOpen && pending"
    class="departure-confirmation--amber"
    :title="modalTitle"
    @close="annuler"
  >
    <div class="departure-confirmation__content">
      <p class="departure-confirmation__data sw-val">
        {{ durationPlayerLabel }} estimée — {{ durationPhysLabel }} — {{ generationsCount }} génération{{ generationsCount > 1 ? 's' : '' }}
      </p>
      <p v-if="generationPhrase" class="departure-confirmation__phrase sw-val">
        {{ generationPhrase }}
      </p>
      <p v-if="contextPhrase" class="departure-confirmation__phrase sw-val">
        {{ contextPhrase }}
      </p>
    </div>
    <template #footer>
      <div class="departure-confirmation__actions">
        <button type="button" class="btn btn-ghost" @click="annuler">
          [ ANNULER ]
        </button>
        <button type="button" class="btn btn-amber" @click="allumerMoteurs">
          [ ALLUMER LES MOTEURS ]
        </button>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.departure-confirmation__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.departure-confirmation__data {
  margin: 0;
  font-size: var(--text-base);
  color: var(--color-muted);
}

.departure-confirmation__phrase {
  margin: 0;
  font-size: var(--text-md);
  color: var(--color-muted);
}

.departure-confirmation__actions {
  display: flex;
  gap: var(--space-6);
  align-items: center;
  justify-content: flex-end;
  width: 100%;
}

.departure-confirmation__actions .btn-ghost {
  flex: 0 0 auto;
  border-color: var(--color-amber-dim);
  background: transparent;
  color: var(--color-amber-dim);
}

.departure-confirmation__actions .btn-ghost:hover {
  border-color: var(--color-amber);
  background: var(--color-amber-glow);
  color: var(--color-amber);
}

.departure-confirmation__actions .btn-ghost:active {
  background: var(--color-amber-dim);
}

.departure-confirmation__actions .btn-amber {
  flex: 1;
}

/* Thème ambre : titre, bordure, bouton fermer */
.departure-confirmation--amber :deep(.app-modal__box) {
  border-color: var(--color-amber-dim);
}

.departure-confirmation--amber :deep(.app-modal__title) {
  color: var(--color-amber);
}

.departure-confirmation--amber :deep(.app-modal__close:hover) {
  color: var(--color-amber);
}

.departure-confirmation--amber :deep(.divider--solid) {
  border-top-color: var(--color-amber-dim);
  opacity: 0.5;
}
</style>
