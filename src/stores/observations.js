/**
 * Store Observations — file d'observations partagée entre Observatoire et Laboratoire
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

const OBS_STATES = { PENDING: 'En attente', RUNNING: 'Analyse en cours', DONE: 'Analysé' }
const NIVEAUX = { PASSIF: 'Passif', SYSTEME: 'Système', ORBITE: 'Orbite proche', CONTACT: 'Contact' }

export const useObservationsStore = defineStore('observations', () => {
  const list = ref([
    { id: '1', name: 'HD44594-b · Atmosphère', type: 'ATMOSPHERE', system: 'HD 44594', date: '2341-05-22', state: OBS_STATES.RUNNING, niveau: NIVEAUX.ORBITE, coords: '12.4, -3.1, 0.2', distance: '11,4 al' },
    { id: '2', name: 'Ross128 · Signal', type: 'SIGNAL', system: 'Ross 128', date: '2341-03-15', state: OBS_STATES.DONE, niveau: NIVEAUX.PASSIF, coords: '11.0, 2.1, 0.5', distance: '10,9 al' },
    { id: '3', name: 'Proxima c · Corps planétaire', type: 'PLANETE', system: 'Proxima Centauri', date: '2341-01-08', state: OBS_STATES.PENDING, niveau: NIVEAUX.SYSTEME, coords: '4.2, -1.1, 0.0', distance: '4,2 al' },
  ])

  const OBS_STATES_VAL = { PENDING: 'En attente', RUNNING: 'Analyse en cours', DONE: 'Analysé' }

  function hasUnanalyzed() {
    return list.value.some(
      (o) => o.state === OBS_STATES_VAL.PENDING || o.state === OBS_STATES_VAL.RUNNING
    )
  }

  function addObservation(obs) {
    const id = String(Date.now())
    list.value.push({
      id,
      name: obs.name,
      type: obs.type,
      system: obs.system,
      date: obs.date ?? '2341-' + new Date().toISOString().slice(5, 10),
      state: OBS_STATES.PENDING,
      niveau: obs.niveau ?? NIVEAUX.PASSIF,
      coords: obs.coords ?? '—',
      distance: obs.distance ?? '—',
      ...obs,
    })
    return id
  }

  function removeObservation(id) {
    list.value = list.value.filter((o) => o.id !== id)
  }

  return { list, addObservation, removeObservation, hasUnanalyzed, OBS_STATES, NIVEAUX }
})
