<script setup>
/**
 * AdminPlayerDetail — fiche d'un compte et actions de modération :
 * suspendre / réactiver (motif obligatoire), renommer (pseudo, vaisseau), réinitialiser la partie
 * (le joueur refait l'onboarding), supprimer le compte.
 * Les comptes admin sont en lecture seule (rôles attribués à la main en SQL).
 */
import { ref, computed, watch } from 'vue'
import { useAdminStore, adminErrorMessage } from '@/stores/admin'
import { isSuspended, playerStatus, playerStatusLabel, formatAdminDate } from '@/lib/adminPlayers'
import AppTextField from '@/components/AppTextField.vue'
import Divider from '@/components/Divider.vue'

const CONFIRM_WORD = 'SUPPRIMER'
const RESET_WORD = 'RÉINITIALISER'
const REASON_MAX = 300

const props = defineProps({
  player: { type: Object, required: true },
})
const emit = defineEmits(['deleted'])

const adminStore = useAdminStore()

const isAdminAccount = computed(() => props.player.role === 'admin')
const suspended = computed(() => isSuspended(props.player))
const status = computed(() => playerStatus(props.player))
const hasGame = computed(() => !!props.player.ship_id)
/** Une partie à effacer : vaisseau, ou profil d'une création de partie interrompue */
const canBeReset = computed(() => hasGame.value || !!props.player.pseudo)

const reason = ref('')
const pseudo = ref('')
const shipName = ref('')
const confirming = ref(false)
const confirmText = ref('')
const resetConfirming = ref(false)
const resetText = ref('')
const busy = ref(false)
const error = ref('')
const notice = ref('')

// Une autre fiche : on repart de zéro
watch(
  () => props.player.user_id,
  () => {
    reason.value = ''
    pseudo.value = ''
    shipName.value = ''
    confirming.value = false
    confirmText.value = ''
    resetConfirming.value = false
    resetText.value = ''
    error.value = ''
    notice.value = ''
  },
)

const canSuspend = computed(() => !busy.value && reason.value.trim().length > 0 && reason.value.length <= REASON_MAX)
const canRename = computed(() => !busy.value && (pseudo.value.trim() || shipName.value.trim()))
const canDelete = computed(() => !busy.value && confirmText.value.trim().toUpperCase() === CONFIRM_WORD)
/** Accents facultatifs : « reinitialiser » vaut « RÉINITIALISER » */
const fold = (value) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase()
const canReset = computed(() => !busy.value && fold(resetText.value) === fold(RESET_WORD))

/** Exécute une action : verrouille les boutons, affiche l'erreur ou la confirmation */
async function run(action, successMessage) {
  busy.value = true
  error.value = ''
  notice.value = ''
  try {
    await action()
    notice.value = successMessage
    return true
  } catch (err) {
    console.warn('[admin]', err?.message)
    error.value = adminErrorMessage(err)
    return false
  } finally {
    busy.value = false
  }
}

async function suspend() {
  if (!canSuspend.value) return
  if (await run(() => adminStore.setSuspension(props.player.user_id, true, reason.value.trim()), 'Compte suspendu.')) {
    reason.value = ''
  }
}

function reactivate() {
  return run(() => adminStore.setSuspension(props.player.user_id, false), 'Compte réactivé.')
}

async function rename() {
  if (!canRename.value) return
  const ok = await run(
    () => adminStore.renamePlayer(props.player.user_id, { pseudo: pseudo.value, shipName: shipName.value }),
    'Nom modifié.',
  )
  if (ok) {
    pseudo.value = ''
    shipName.value = ''
  }
}

function cancelReset() {
  resetConfirming.value = false
  resetText.value = ''
}

async function resetGame() {
  if (!canReset.value) return
  if (await run(() => adminStore.resetPlayer(props.player.user_id), 'Partie réinitialisée.')) cancelReset()
}

function cancelDelete() {
  confirming.value = false
  confirmText.value = ''
}

async function deletePlayer() {
  if (!canDelete.value) return
  if (await run(() => adminStore.deletePlayer(props.player.user_id), 'Compte supprimé.')) {
    emit('deleted')
  }
}
</script>

<template>
  <aside class="admin-detail" aria-label="Fiche du compte">
    <header class="admin-detail__head">
      <h2 class="admin-detail__name">{{ player.pseudo || 'Sans pseudo' }}</h2>
      <span class="admin-badge" :class="`admin-badge--${status}`">{{ playerStatusLabel(player) }}</span>
    </header>

    <dl class="admin-facts">
      <dt>Email</dt>
      <dd>{{ player.email }}</dd>
      <dt>Rôle</dt>
      <dd>{{ player.role === 'admin' ? 'Admin' : player.role === 'player' ? 'Joueur' : '—' }}</dd>
      <dt>Vaisseau</dt>
      <dd>{{ player.ship_name || '—' }}</dd>
      <dt>Position</dt>
      <dd>{{ player.current_system_id || '—' }}</dd>
      <dt>Inscrit le</dt>
      <dd>{{ formatAdminDate(player.created_at) }}</dd>
      <dt>Dernière connexion</dt>
      <dd>{{ formatAdminDate(player.last_sign_in_at) }}</dd>
      <dt>Données</dt>
      <dd>
        {{ player.signals_count }} signaux · {{ player.observations_count }} observations ·
        {{ player.interpretations_count }} interprétations · {{ player.logbook_count }} entrées de journal
      </dd>
    </dl>

    <p v-if="suspended && player.suspension_reason" class="admin-reason">Motif de suspension : {{ player.suspension_reason }}</p>

    <p v-if="isAdminAccount" class="admin-hint">Compte admin : non modifiable ici. Les rôles s'attribuent dans la base de données.</p>

    <template v-else>
      <Divider variant="solid" tight />

      <!-- Suspension -->
      <section class="admin-section">
        <h3 class="admin-section__title">Accès</h3>
        <template v-if="suspended">
          <p class="admin-hint">Le joueur ne peut plus se connecter. Sa partie est conservée.</p>
          <button type="button" class="btn btn-primary admin-section__action" :disabled="busy" @click="reactivate">
            Réactiver le compte
          </button>
        </template>
        <form v-else class="admin-form" novalidate @submit.prevent="suspend">
          <AppTextField
            v-model="reason"
            label="Motif de la suspension"
            autocomplete="off"
            :hint="`Conservé au journal. ${REASON_MAX} caractères au plus.`"
            :disabled="busy"
          />
          <p class="admin-hint">Les sessions ouvertes sont fermées ; un jeton déjà émis peut rester valable jusqu'à une heure.</p>
          <button type="submit" class="btn btn-amber admin-section__action" :disabled="!canSuspend">Suspendre le compte</button>
        </form>
      </section>

      <Divider variant="solid" tight />

      <!-- Renommage -->
      <section class="admin-section">
        <h3 class="admin-section__title">Noms</h3>
        <p v-if="!hasGame" class="admin-hint">Pas de partie : rien à renommer.</p>
        <form v-else class="admin-form" novalidate @submit.prevent="rename">
          <AppTextField
            v-model="pseudo"
            label="Nouveau pseudo"
            autocomplete="off"
            :placeholder="player.pseudo"
            :disabled="busy"
            hint="2 à 24 caractères. Vide : inchangé."
          />
          <AppTextField
            v-model="shipName"
            label="Nouveau nom du vaisseau"
            autocomplete="off"
            :placeholder="player.ship_name"
            :disabled="busy"
            hint="2 à 32 caractères. Vide : inchangé."
          />
          <button type="submit" class="btn btn-secondary admin-section__action" :disabled="!canRename">Renommer</button>
        </form>
      </section>

      <!-- Réinitialisation de la partie -->
      <section v-if="canBeReset" class="admin-danger">
        <h3 class="admin-danger__title">Réinitialiser la partie</h3>
        <p class="admin-hint">
          Efface le vaisseau, toute la progression et le pseudo. Le compte, l’email confirmé et le mot de passe restent : au prochain
          chargement, le joueur revoit « Bienvenue à bord » et tout l’onboarding. Cette action ne peut pas être annulée.
        </p>
        <button
          v-if="!resetConfirming"
          type="button"
          class="btn btn-danger admin-section__action"
          :disabled="busy"
          @click="resetConfirming = true"
        >
          Réinitialiser la partie
        </button>
        <form v-else class="admin-form" novalidate @submit.prevent="resetGame">
          <AppTextField v-model="resetText" :label="`Saisissez ${RESET_WORD} pour confirmer`" autocomplete="off" :disabled="busy" />
          <div class="admin-form__buttons">
            <button type="button" class="btn btn-ghost" :disabled="busy" @click="cancelReset">Annuler</button>
            <button type="submit" class="btn btn-danger" :disabled="!canReset">Réinitialiser définitivement</button>
          </div>
        </form>
      </section>

      <!-- Suppression -->
      <section class="admin-danger">
        <h3 class="admin-danger__title">Supprimer le compte</h3>
        <p class="admin-hint">Efface le compte, la partie et les interprétations. Cette action ne peut pas être annulée.</p>
        <button v-if="!confirming" type="button" class="btn btn-danger admin-section__action" :disabled="busy" @click="confirming = true">
          Supprimer le compte
        </button>
        <form v-else class="admin-form" novalidate @submit.prevent="deletePlayer">
          <AppTextField v-model="confirmText" :label="`Saisissez ${CONFIRM_WORD} pour confirmer`" autocomplete="off" :disabled="busy" />
          <div class="admin-form__buttons">
            <button type="button" class="btn btn-ghost" :disabled="busy" @click="cancelDelete">Annuler</button>
            <button type="submit" class="btn btn-danger" :disabled="!canDelete">Supprimer définitivement</button>
          </div>
        </form>
      </section>
    </template>

    <p v-if="error" class="admin-message admin-message--error" role="alert">{{ error }}</p>
    <p v-else-if="notice" class="admin-message" role="status">{{ notice }}</p>
  </aside>
</template>
