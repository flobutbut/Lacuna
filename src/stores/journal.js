/**
 * Store Journal — journal de bord du vaisseau (table logbook_entries, migration 00068)
 * Le serveur écrit seul les entrées AUTO et GENERATIONNEL ; le joueur ajoute des entrées MANUEL.
 * Date du vaisseau, contexte et génération sont fixés par le serveur (LACUNA_GDD.md §2, Calendrier).
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'
import { useShipStore } from '@/stores/ship'

const COLUMNS = 'id, type, family, date, context, generation, title, text, created_at'

/** Longueurs maximales d'une entrée du joueur (contrainte logbook_entries_lengths) */
export const JOURNAL_TITLE_MAX = 120
export const JOURNAL_TEXT_MAX = 4000

export const useJournalStore = defineStore('journal', () => {
  const entries = ref([])
  const loaded = ref(false)

  /** Charge le journal du vaisseau, du plus récent au plus ancien */
  async function fetch() {
    const supabaseStore = useSupabaseStore()
    const shipStore = useShipStore()
    if (!supabaseStore.isConfigured()) {
      loaded.value = true
      return entries.value
    }
    if (!shipStore.loaded) await shipStore.fetch()
    const shipId = shipStore.ship?.id
    if (!shipId) {
      entries.value = []
      loaded.value = true
      return entries.value
    }
    const { data, error } = await supabase
      .from('logbook_entries')
      .select(COLUMNS)
      .eq('ship_id', shipId)
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('[journal] fetch:', error.message)
    } else {
      entries.value = data ?? []
    }
    loaded.value = true
    return entries.value
  }

  /**
   * Ajoute une entrée du joueur. Lève l'erreur Supabase en cas d'échec.
   * @param {{ title: string, text: string }} entry
   */
  async function addManual({ title, text }) {
    const shipId = useShipStore().ship?.id
    if (!shipId) throw new Error('Aucun vaisseau chargé')
    const { data, error } = await supabase
      .from('logbook_entries')
      .insert({ ship_id: shipId, type: 'MANUEL', title: title.trim(), text: text.trim() })
      .select(COLUMNS)
      .single()
    if (error) throw error
    entries.value = [data, ...entries.value]
    return data
  }

  /** Entrée MANUEL gardée en mémoire (mode démo, sans Supabase) ; renvoie l'entrée */
  function addLocal({ title, text, date, generation }) {
    const entry = {
      id: `local-${Date.now()}`,
      type: 'MANUEL',
      family: null,
      date,
      context: null,
      generation,
      title,
      text,
      created_at: new Date().toISOString(),
    }
    entries.value = [entry, ...entries.value]
    return entry
  }

  /**
   * Écrit au journal un événement du ciel de départ, une fois qu'il a eu lieu (RPC log_sky_event).
   * @param {'cie-003'|'cie-004'} key - Sortie du choc de SN-001, première impulsion de LPT-001
   * @param {number} [durationS] - Durée de l'impulsion (LPT-001)
   */
  async function logSkyEvent(key, durationS) {
    const supabaseStore = useSupabaseStore()
    if (!supabaseStore.isConfigured()) return
    const { data, error } = await supabase.rpc('log_sky_event', { p_key: key, p_duration_s: durationS ?? null })
    if (error) {
      console.warn('[journal] log_sky_event:', error.message)
      return
    }
    if (data?.logged > 0 && loaded.value) await fetch()
  }

  return { entries, loaded, fetch, addManual, addLocal, logSkyEvent }
})
