import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSupabaseStore } from '@/stores/supabase'
import { resolveAuthRedirect } from '@/router/authGuard'

/** Pages d'authentification : sans compte, sans header ni barre d'instruments */
const AUTH_META = { public: true, guestOnly: true, bareLayout: true }

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
      meta: { title: 'Vue 3D étoiles (conception)', bareLayout: true, requiresAdmin: true },
    },
    {
      path: '/connexion',
      name: 'connexion',
      component: () => import('@/views/auth/PageConnexion.vue'),
      meta: { title: 'Connexion', ...AUTH_META },
    },
    {
      path: '/inscription',
      name: 'inscription',
      component: () => import('@/views/auth/PageInscription.vue'),
      meta: { title: 'Créer un compte', ...AUTH_META },
    },
    {
      path: '/mot-de-passe-oublie',
      name: 'mot-de-passe-oublie',
      component: () => import('@/views/auth/PageMotDePasseOublie.vue'),
      meta: { title: 'Mot de passe oublié', ...AUTH_META },
    },
    {
      // Création de partie : pseudo et nom du vaisseau (joueur connecté sans vaisseau)
      path: '/bienvenue',
      name: 'bienvenue',
      component: () => import('@/views/auth/PageBienvenue.vue'),
      meta: { title: 'Bienvenue à bord', onboarding: true, bareLayout: true },
    },
    {
      // Ouverte depuis le lien de réinitialisation : la session temporaire est déjà active
      path: '/nouveau-mot-de-passe',
      name: 'nouveau-mot-de-passe',
      component: () => import('@/views/auth/PageNouveauMotDePasse.vue'),
      meta: { title: 'Nouveau mot de passe', public: true, bareLayout: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'observatoire' },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  if (auth.isAuthenticated) await auth.ensurePlayer()
  return resolveAuthRedirect(to, {
    configured: useSupabaseStore().isConfigured(),
    authenticated: auth.isAuthenticated,
    hasShip: auth.hasShip,
    isAdmin: auth.isAdmin,
  })
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} — LACUNA` : 'LACUNA'
})

export default router
