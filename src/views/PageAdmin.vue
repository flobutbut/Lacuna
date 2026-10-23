<script setup>
/**
 * Administration — modération du jeu (comptes admin seulement, route requiresAdmin) :
 * liste des joueurs et actions, interprétations des traces, journal des actions.
 * Les données viennent de RPC réservées aux admins (migration 00070).
 */
import '@/assets/components/journal.css'
import '@/assets/components/admin.css'
import { ref, watch, onMounted } from 'vue'
import { useAdminStore, adminErrorMessage } from '@/stores/admin'
import { useSupabaseStore } from '@/stores/supabase'
import AdminPlayers from '@/components/admin/AdminPlayers.vue'
import AdminInterpretations from '@/components/admin/AdminInterpretations.vue'
import AdminActions from '@/components/admin/AdminActions.vue'

const adminStore = useAdminStore()
const configured = useSupabaseStore().isConfigured()

const TABS = [
  { id: 'players', label: 'Joueurs' },
  { id: 'interpretations', label: 'Interprétations' },
  { id: 'actions', label: 'Journal des actions' },
]
const tab = ref('players')
const error = ref('')

const LOADERS = {
  players: () => adminStore.fetchPlayers(),
  interpretations: () => adminStore.fetchInterpretations(),
  actions: () => adminStore.fetchActions(),
}

/** Charge l'onglet affiché (rechargé à chaque ouverture : les données bougent hors de cette page) */
async function load() {
  error.value = ''
  try {
    await LOADERS[tab.value]()
  } catch (err) {
    console.warn('[admin] chargement:', err?.message)
    error.value = adminErrorMessage(err)
  }
}

watch(tab, load)
onMounted(() => {
  if (configured) load()
})
</script>

<template>
  <div class="page-full">
    <div class="page-content admin-layout">
      <h1 class="page-title">Administration</h1>

      <p v-if="!configured" class="admin-message admin-message--error" role="status">
        Supabase n'est pas configuré : la modération nécessite la base de données.
      </p>

      <div class="journal-filters" role="tablist" aria-label="Sections de l'administration">
        <button
          v-for="t in TABS"
          :id="`admin-tab-${t.id}`"
          :key="t.id"
          type="button"
          role="tab"
          class="journal-filter-btn"
          :class="{ active: tab === t.id }"
          :aria-selected="tab === t.id"
          :aria-controls="`admin-panel-${t.id}`"
          @click="tab = t.id"
        >
          {{ t.label }}
        </button>
      </div>

      <p v-if="error" class="admin-message admin-message--error" role="alert">{{ error }}</p>

      <div :id="`admin-panel-${tab}`" role="tabpanel" :aria-labelledby="`admin-tab-${tab}`">
        <AdminPlayers v-if="tab === 'players'" />
        <AdminInterpretations v-else-if="tab === 'interpretations'" />
        <AdminActions v-else />
      </div>
    </div>
  </div>
</template>
