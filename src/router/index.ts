import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/pages/DashboardPage.vue'),
  },
  {
    path: '/registrations',
    name: 'registrations',
    component: () => import('@/pages/RegistrationListPage.vue'),
  },
  {
    path: '/registrations/:id',
    name: 'registration-detail',
    component: () => import('@/pages/RegistrationDetailPage.vue'),
  },
  {
    path: '/seats',
    name: 'seats',
    component: () => import('@/pages/SeatMapPage.vue'),
  },
  {
    path: '/seats/allocations/:id',
    name: 'allocation-detail',
    component: () => import('@/pages/AllocationDetailPage.vue'),
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/pages/AdminPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
