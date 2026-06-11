import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue')
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('@/pages/Documents.vue')
  },
  {
    path: '/sign-off',
    name: 'SignOff',
    component: () => import('@/pages/SignOff.vue')
  },
  {
    path: '/documents/:id',
    name: 'DocumentDetail',
    component: () => import('@/pages/DocumentDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
