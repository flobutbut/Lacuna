/**
 * Store Signaux — signaux captés par le récepteur (panel gauche Observatoire)
 * Durée de vie en temps joueur (ms). Persistance possible via localStorage.
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const LIFETIME_MS = 2 * 60 * 60 * 1000 // 2h temps joueur par défaut

function createSignal(payload) {
  const id = `sig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const createdAt = Date.now()
  const receivedAt = payload.receivedAt ?? `2341-${new Date().toISOString().slice(5, 10)}`
  return {
    id,
    frequency: payload.frequency ?? '1420 MHz',
    azimuth: payload.azimuth ?? 0,
    elevation: payload.elevation ?? 0,
    distanceEst: payload.distanceEst ?? null,
    receivedAt,
    durationSec: payload.durationSec ?? 72,
    polarization: payload.polarization ?? 'circulaire',
    structure: payload.structure ?? 'non uniforme',
    createdAt,
    lifetimeMs: payload.lifetimeMs ?? LIFETIME_MS,
  }
}

export const useSignauxStore = defineStore('signaux', () => {
  const list = ref([
    createSignal({ frequency: '1420 MHz', azimuth: 217, elevation: 12, distanceEst: '~340 al', receivedAt: '2341-04-12', durationSec: 72, polarization: 'circulaire', structure: 'non uniforme' }),
    createSignal({ frequency: '408 MHz', azimuth: 89, elevation: -5, distanceEst: null, receivedAt: '2341-04-11', durationSec: 120, polarization: 'linéaire', structure: 'pulsé' }),
  ])

  const listWithRemaining = computed(() => {
    const now = Date.now()
    return list.value.map((s) => {
      const elapsed = now - s.createdAt
      const remaining = Math.max(0, s.lifetimeMs - elapsed)
      const pct = s.lifetimeMs > 0 ? (remaining / s.lifetimeMs) * 100 : 0
      return { ...s, remainingMs: remaining, lifetimePct: pct }
    })
  })

  function addSignal(payload) {
    const signal = createSignal(payload)
    list.value.push(signal)
    return signal.id
  }

  function removeSignal(id) {
    list.value = list.value.filter((s) => s.id !== id)
  }

  function removeExpired() {
    const now = Date.now()
    list.value = list.value.filter((s) => now - s.createdAt < s.lifetimeMs)
  }

  return {
    list,
    listWithRemaining,
    addSignal,
    removeSignal,
    removeExpired,
  }
})
