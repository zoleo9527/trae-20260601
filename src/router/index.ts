import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/grading',
      name: 'grading',
      component: () => import('../views/GradingListView.vue'),
      meta: { requiresAuth: true, roles: ['warehouse'] },
    },
    {
      path: '/grading/:id',
      name: 'grading-detail',
      component: () => import('../views/GradingDetailView.vue'),
      meta: { requiresAuth: true, roles: ['warehouse'] },
    },
    {
      path: '/grading/new/:batchId',
      name: 'grading-new',
      component: () => import('../views/GradingDetailView.vue'),
      meta: { requiresAuth: true, roles: ['warehouse'] },
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
      meta: { requiresAuth: true, roles: ['warehouse'] },
    },
    {
      path: '/inventory/changelog',
      name: 'inventory-changelog',
      component: () => import('../views/InventoryChangelogView.vue'),
      meta: { requiresAuth: true, roles: ['warehouse'] },
    },
    {
      path: '/reservations',
      name: 'reservations',
      component: () => import('../views/ReservationListView.vue'),
      meta: { requiresAuth: true, roles: ['customer_service'] },
    },
    {
      path: '/reservations/:id',
      name: 'reservation-detail',
      component: () => import('../views/ReservationDetailView.vue'),
      meta: { requiresAuth: true, roles: ['customer_service'] },
    },
    {
      path: '/complaints',
      name: 'complaints',
      component: () => import('../views/ComplaintListView.vue'),
      meta: { requiresAuth: true, roles: ['customer_service'] },
    },
    {
      path: '/complaints/:id',
      name: 'complaint-detail',
      component: () => import('../views/ComplaintDetailView.vue'),
      meta: { requiresAuth: true, roles: ['customer_service'] },
    },
    {
      path: '/picking',
      name: 'picking',
      component: () => import('../views/PickingView.vue'),
      meta: { requiresAuth: true, roles: ['picking_guide'] },
    },
    {
      path: '/batches/:id',
      name: 'batch-detail',
      component: () => import('../views/BatchDetailView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.currentUser) {
    next({ name: 'login' })
  } else if (to.meta.roles && auth.currentUser && !(to.meta.roles as string[]).includes(auth.currentUser.role)) {
    next({ name: 'dashboard' })
  } else if (to.name === 'login' && auth.currentUser) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
