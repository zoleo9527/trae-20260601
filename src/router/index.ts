import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import MainLayout from '@/layouts/MainLayout.vue'
import LoginPage from '@/pages/LoginPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import ReconciliationListPage from '@/pages/ReconciliationListPage.vue'
import ReconciliationDetailPage from '@/pages/ReconciliationDetailPage.vue'
import FeedbackListPage from '@/pages/FeedbackListPage.vue'
import FeedbackDetailPage from '@/pages/FeedbackDetailPage.vue'
import HandoverPage from '@/pages/HandoverPage.vue'

import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardPage,
      },
      {
        path: 'reconciliations',
        name: 'reconciliations',
        component: ReconciliationListPage,
      },
      {
        path: 'reconciliations/:id',
        name: 'reconciliation-detail',
        component: ReconciliationDetailPage,
      },
      {
        path: 'feedbacks',
        name: 'feedbacks',
        component: FeedbackListPage,
      },
      {
        path: 'feedbacks/:id',
        name: 'feedback-detail',
        component: FeedbackDetailPage,
      },
      {
        path: 'handover',
        name: 'handover',
        component: HandoverPage,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  userStore.restoreFromStorage()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
