<script setup>
/**
 * AdminActions — journal des actions de modération (qui a fait quoi, sur quel compte).
 */
import { useAdminStore } from '@/stores/admin'
import { describeAction, formatAdminDate } from '@/lib/adminPlayers'

const adminStore = useAdminStore()
</script>

<template>
  <section class="admin-actions" aria-label="Journal des actions">
    <p v-if="adminStore.actionsLoaded && !adminStore.actions.length" class="admin-empty">Aucune action pour l'instant.</p>
    <article v-for="entry in adminStore.actions" :key="entry.id" class="journal-entry">
      <div class="journal-entry__date">{{ formatAdminDate(entry.created_at) }} — {{ entry.admin_pseudo || 'Admin' }}</div>
      <h2 class="journal-entry__title">{{ describeAction(entry).label }} · {{ entry.target_pseudo || 'compte sans pseudo' }}</h2>
      <div v-if="describeAction(entry).detail" class="journal-entry__text">{{ describeAction(entry).detail }}</div>
    </article>
  </section>
</template>
