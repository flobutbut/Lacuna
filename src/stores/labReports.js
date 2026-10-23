/**
 * Store LabReports — rapports d'analyse persistés
 * Branché sur table lab_reports quand Supabase configuré
 */
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useSupabaseStore } from '@/stores/supabase'

function rowToReport(row) {
  return {
    id: row.id,
    instrumentId: row.instrument_id,
    instrument: row.instrument,
    fiability: row.fiability,
    date: row.date ?? '',
    duration: row.duration ?? '2h',
    durationSec: row.duration_sec ?? 72,
    anomalous: row.anomalous ?? false,
    deviations: row.deviations ?? null,
    results: row.results ?? '',
  }
}

function reportToRow(report, observationId) {
  return {
    observation_id: observationId,
    instrument_id: report.instrumentId,
    instrument: report.instrument,
    fiability: report.fiability,
    date: report.date ?? null,
    duration: report.duration ?? null,
    duration_sec: report.durationSec ?? null,
    anomalous: report.anomalous ?? false,
    deviations: report.deviations ?? null,
    results: report.results ?? null,
  }
}

import { defineStore } from 'pinia'

export const useLabReportsStore = defineStore('labReports', () => {
    const cache = ref({})

    async function fetchForObservations(observationIds) {
      const supabaseStore = useSupabaseStore()
      if (!supabaseStore.isConfigured()) return cache.value
      const ids = observationIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id))
      if (ids.length === 0) return cache.value
      const { data, error } = await supabase
        .from('lab_reports')
        .select('*')
        .in('observation_id', ids)
        .order('created_at', { ascending: true })
      if (error) {
        console.warn('[labReports] Erreur fetch:', error.message)
        return cache.value
      }
      const byObs = {}
      for (const row of data ?? []) {
        const oid = row.observation_id
        if (!byObs[oid]) byObs[oid] = []
        byObs[oid].push(rowToReport(row))
      }
      cache.value = { ...cache.value, ...byObs }
      return cache.value
    }

    async function addReport(observationId, report) {
      const supabaseStore = useSupabaseStore()
      if (!supabaseStore.isConfigured() || !/^[0-9a-f-]{36}$/i.test(observationId)) {
        // Hors ligne : gardé en mémoire, pour que la Carte voie aussi les doutes à lever
        cache.value = { ...cache.value, [observationId]: [...(cache.value[observationId] || []), { ...report }] }
        return null
      }
      const row = reportToRow(report, observationId)
      const { data, error } = await supabase
        .from('lab_reports')
        .insert(row)
        .select('id, instrument_id, instrument, fiability, date, duration, duration_sec, anomalous, deviations, results')
        .single()
      if (error) {
        console.warn('[labReports] Erreur insert:', error.message)
        return null
      }
      const r = rowToReport(data)
      if (!cache.value[observationId]) cache.value[observationId] = []
      cache.value[observationId] = [...(cache.value[observationId] || []), r]
      cache.value = { ...cache.value }
      return r
    }

    function getReportsForObs(observationId) {
      return cache.value[observationId] ?? []
    }

    function setReportsForObs(observationId, reports) {
      cache.value = { ...cache.value, [observationId]: reports }
    }

    function clearForObs(observationId) {
      const next = { ...cache.value }
      delete next[observationId]
      cache.value = next
    }

    return {
      cache,
      fetchForObservations,
      addReport,
      getReportsForObs,
      setReportsForObs,
      clearForObs,
    }
  })
