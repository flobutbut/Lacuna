<script setup>
/**
 * AdminInterpretations — interprétations de traces, seul texte de joueur visible par les autres joueurs
 * (anonyme pour eux). L'admin voit l'auteur et peut supprimer.
 */
import { ref } from 'vue'
import { useAdminStore, adminErrorMessage } from '@/stores/admin'
import { formatAdminDate } from '@/lib/adminPlayers'

const adminStore = useAdminStore()

const busyId = ref(null)
const confirmId = ref(null)
const error = ref('')

async function remove(item) {
  busyId.value = item.id
  error.value = ''
  try {
    await adminStore.deleteInterpretation(item.id)
    confirmId.value = null
  } catch (err) {
    console.warn('[admin] suppression interprétation:', err?.message)
    error.value = adminErrorMessage(err)
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <section class="admin-interpretations" aria-label="Interprétations">
    <p class="admin-hint">Les autres joueurs voient ces textes sans connaître leur auteur. Les 100 plus récentes.</p>
    <p v-if="error" class="admin-message admin-message--error" role="alert">{{ error }}</p>
    <p v-if="adminStore.interpretationsLoaded && !adminStore.interpretations.length" class="admin-empty">Aucune interprétation.</p>

    <article v-for="item in adminStore.interpretations" :key="item.id" class="admin-interpretation">
      <div class="admin-interpretation__meta">
        {{ item.trace_designation || 'Trace inconnue' }} · {{ item.confidence }} · génération {{ item.generation ?? '—' }} ·
        {{ formatAdminDate(item.created_at) }}
      </div>
      <p class="admin-interpretation__text">{{ item.text }}</p>
      <div class="admin-interpretation__foot">
        <span class="admin-table__sub">Auteur : {{ item.author_pseudo || 'inconnu' }}</span>
        <span class="admin-interpretation__actions">
          <template v-if="confirmId === item.id">
            <button type="button" class="btn btn-ghost btn-secondary" :disabled="busyId === item.id" @click="confirmId = null">
              Annuler
            </button>
            <button type="button" class="btn btn-danger btn-secondary" :disabled="busyId === item.id" @click="remove(item)">
              Supprimer définitivement
            </button>
          </template>
          <button v-else type="button" class="btn btn-danger btn-secondary" @click="confirmId = item.id">Supprimer</button>
        </span>
      </div>
    </article>
  </section>
</template>
