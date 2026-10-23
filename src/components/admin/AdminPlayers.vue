<script setup>
/**
 * AdminPlayers — liste des comptes (recherche, filtre par statut) et fiche du compte sélectionné.
 */
import { ref, computed } from 'vue'
import { useAdminStore } from '@/stores/admin'
import { PLAYER_FILTERS, filterPlayers, playerStatus, playerStatusLabel, formatAdminDate } from '@/lib/adminPlayers'
import AppTextField from '@/components/AppTextField.vue'
import AdminPlayerDetail from '@/components/admin/AdminPlayerDetail.vue'

const adminStore = useAdminStore()

const query = ref('')
const filter = ref('all')
const selectedId = ref(null)

const visible = computed(() => filterPlayers(adminStore.players, { query: query.value, filter: filter.value }))
/** Relu dans la liste à chaque rechargement : la fiche reflète toujours l'état du serveur */
const selected = computed(() => adminStore.players.find((p) => p.user_id === selectedId.value) ?? null)
const total = computed(() => adminStore.players.length)
</script>

<template>
  <div class="admin-players">
    <div class="admin-players__list">
      <div class="admin-toolbar">
        <AppTextField v-model="query" label="Rechercher" autocomplete="off" placeholder="Pseudo, email ou vaisseau" />
        <div class="journal-filters admin-toolbar__filters" role="group" aria-label="Filtrer par statut">
          <button
            v-for="f in PLAYER_FILTERS"
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
      </div>

      <p class="admin-count">{{ visible.length }} / {{ total }} compte{{ total > 1 ? 's' : '' }}</p>
      <p v-if="adminStore.playersLoaded && !visible.length" class="admin-empty">Aucun compte.</p>

      <table v-else-if="visible.length" class="admin-table">
        <thead>
          <tr>
            <th scope="col">Joueur</th>
            <th scope="col">Vaisseau</th>
            <th scope="col">Statut</th>
            <th scope="col">Dernière connexion</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in visible" :key="p.user_id" :class="{ 'is-selected': p.user_id === selectedId }" @click="selectedId = p.user_id">
            <td>
              <button
                type="button"
                class="admin-table__select"
                :aria-pressed="p.user_id === selectedId"
                @click.stop="selectedId = p.user_id"
              >
                <span class="admin-table__name">{{ p.pseudo || 'Sans pseudo' }}</span>
                <span class="admin-table__sub">{{ p.email }}</span>
              </button>
            </td>
            <td>{{ p.ship_name || '—' }}</td>
            <td>
              <span class="admin-badge" :class="`admin-badge--${playerStatus(p)}`">{{ playerStatusLabel(p) }}</span>
            </td>
            <td>{{ formatAdminDate(p.last_sign_in_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPlayerDetail v-if="selected" :player="selected" @deleted="selectedId = null" />
    <p v-else class="admin-empty admin-players__placeholder">Sélectionnez un compte pour le modérer.</p>
  </div>
</template>
