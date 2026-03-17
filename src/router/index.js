import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'observatoire',
      component: () => import('@/views/observatoire/PageObservatoire.vue'),
      meta: { title: 'Observatoire' },
    },
    {
      path: '/carte',
      name: 'carte',
      component: () => import('@/views/PageCarte.vue'),
      meta: { title: 'Carte' },
    },
    {
      path: '/artefacts',
      name: 'artefacts',
      component: () => import('@/views/PageArtefacts.vue'),
      meta: { title: 'Artefacts' },
    },
    {
      path: '/laboratoire',
      name: 'laboratoire',
      component: () => import('@/views/PageLaboratoire.vue'),
      meta: { title: 'Laboratoire' },
    },
    {
      path: '/journal',
      name: 'journal',
      component: () => import('@/views/PageJournal.vue'),
      meta: { title: 'Journal' },
    },
    {
      path: '/drake',
      name: 'drake',
      component: () => import('@/views/PageDrake.vue'),
      meta: { title: 'Drake' },
    },
    {
      path: '/population',
      name: 'population',
      component: () => import('@/views/PagePopulation.vue'),
      meta: { title: 'Population' },
    },
    {
      path: '/systemes',
      name: 'systemes',
      component: () => import('@/views/PageSystemes.vue'),
      meta: { title: 'Systèmes vaisseau' },
    },
    {
      path: '/conception-etoiles',
      name: 'conception-etoiles',
      component: () => import('@/views/PageConceptionEtoiles.vue'),
      meta: { title: 'Vue 3D étoiles (conception)', conceptionLayout: true },
    },
  ],
})

export default router
