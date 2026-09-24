import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import AuthPage from '../pages/AuthPage.vue'
import TodayPage from '../pages/TodayPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/today' },
    { path: '/login', component: AuthPage, props: { mode: 'login' }, meta: { guestOnly: true } },
    {
      path: '/register',
      component: AuthPage,
      props: { mode: 'register' },
      meta: { guestOnly: true },
    },
    { path: '/today', component: TodayPage, meta: { requiresAuth: true, shell: true } },
    {
      path: '/statistics',
      component: () => import('../pages/StatisticsPage.vue'),
      meta: { requiresAuth: true, shell: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuth()
  await auth.initialize()
  if (to.meta.requiresAuth && !auth.user.value)
    return { path: '/login', query: { next: to.fullPath } }
  if (to.meta.guestOnly && auth.user.value) return '/today'
})
