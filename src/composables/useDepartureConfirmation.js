/**
 * Données pour la vue de confirmation du départ (durée, générations, phrases).
 * Réf. Design-system.md (sw-row, sw-key, sw-val), LACUNA_TRANSIT / spécification vue confirmation.
 */
import { computed, watch, onMounted } from 'vue'
import { formatDuration } from '@/lib/transit'

const YEARS_PER_GENERATION = 25

/**
 * @param {import('vue').ComputedRef<object|null>} pendingRef - ui.pendingDeparture (computed)
 * @param {import('pinia').Store} shipStore - useShipStore()
 * @returns {{
 *   durationPlayerLabel: import('vue').ComputedRef<string>,
 *   durationPhysLabel: import('vue').ComputedRef<string>,
 *   generationsCount: import('vue').ComputedRef<number>,
 *   generationPhrase: import('vue').ComputedRef<string|null>,
 *   contextPhrase: import('vue').ComputedRef<string|null>,
 *   ensureTravelsLoaded: () => Promise<void>
 * }}
 */
export function useDepartureConfirmation(pendingRef, shipStore) {
  const simulatedYears = computed(() => {
    const t = pendingRef.value?.transitMeta?.tPhysTotal
    return t != null ? Number(t) : 0
  })

  const generationsCount = computed(() => Math.floor(simulatedYears.value / YEARS_PER_GENERATION))

  const durationPlayerLabel = computed(() => {
    const sec = pendingRef.value?.transitMeta?.tJoueurSec
    return sec != null ? formatDuration(sec) : '—'
  })

  const durationPhysLabel = computed(() => {
    const y = simulatedYears.value
    if (y >= 1000) return `${(y / 1000).toFixed(1)} ka`
    if (y >= 1) return `${Math.round(y)} ans simulés`
    return `${Math.round(y * 12)} mois simulés`
  })

  /** Phrase générationnelle — règle d'affichage par tranche de générations */
  const generationPhrase = computed(() => {
    const n = generationsCount.value
    if (n < 1) return null
    if (n <= 2) return "La génération actuelle ne verra pas l'arrivée."
    if (n <= 10) return "Personne vivant à bord aujourd'hui ne sera en vie à l'arrivée."
    if (n < 1000) return `${n} générations naîtront et mourront avant l'arrivée.`
    return "L'arrivée est une abstraction pour les personnes qui partent aujourd'hui."
  })

  /** Phrase contextuelle — une seule par priorité décroissante */
  const contextPhrase = computed(() => {
    const p = pendingRef.value
    const systems = shipStore.systems
    const fuel = shipStore.fuel
    const voyage = shipStore.voyage ?? 1
    const travels = shipStore.travels ?? []

    if (!p) return null

    const distanceLy = p.distanceLy ?? parseFloat(p.dist) ?? 0
    const spectralType = (p.spectral_type ?? '').trim().toUpperCase()
    const carburantPct = p.transitMeta?.carburantPct ?? 0
    const fuelPct = Math.min((fuel?.he3 ?? 0) * 100, (fuel?.deuterium ?? 0) * 100)

    if (voyage === 1 && distanceLy <= 10) return 'Sol restera visible depuis la destination.'

    const neverVisited = !travels.some((t) => t.destination_system_id === p.id)
    if (neverVisited) return "Aucun vaisseau n'a encore atteint ce système."

    const plasmaShield = systems?.plasmaShield ?? 1
    if (plasmaShield < 0.7) {
      return 'Bouclier plasma dégradé. Vitesse de croisière réduite à 3,1% c.'
    }

    if (carburantPct > 0 && fuelPct < 2 * carburantPct) return 'Carburant disponible : aller simple.'

    if (spectralType.startsWith('O') || spectralType.startsWith('B')) {
      return `Type ${p.spectral_type ?? '—'}. Statut à l'arrivée : inconnu.`
    }

    return null
  })

  function ensureTravelsLoaded() {
    if (pendingRef.value && shipStore.ship?.id) shipStore.fetchTravels()
  }

  onMounted(ensureTravelsLoaded)
  watch(pendingRef, () => ensureTravelsLoaded())

  return {
    durationPlayerLabel,
    durationPhysLabel,
    generationsCount,
    generationPhrase,
    contextPhrase,
    ensureTravelsLoaded,
  }
}
