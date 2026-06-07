import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/inspections',
    name: 'Inspections',
    component: () => import('@/views/inspections/ListView.vue')
  },
  {
    path: '/inspections/:id',
    name: 'InspectionDetail',
    component: () => import('@/views/inspections/DetailView.vue')
  },
  {
    path: '/repairs',
    name: 'Repairs',
    component: () => import('@/views/repairs/ListView.vue')
  },
  {
    path: '/repairs/:id',
    name: 'RepairDetail',
    component: () => import('@/views/repairs/DetailView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
