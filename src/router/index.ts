import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/sow-archive',
    name: 'SowArchive',
    component: () => import('@/views/SowArchive.vue')
  },
  {
    path: '/boar-archive',
    name: 'BoarArchive',
    component: () => import('@/views/BoarArchive.vue')
  },
  {
    path: '/breeding-plan',
    name: 'BreedingPlan',
    component: () => import('@/views/BreedingPlan.vue')
  },
  {
    path: '/breeding-record',
    name: 'BreedingRecord',
    component: () => import('@/views/BreedingRecord.vue')
  },
  {
    path: '/farrowing',
    name: 'Farrowing',
    component: () => import('@/views/Farrowing.vue')
  },
  {
    path: '/vaccine',
    name: 'Vaccine',
    component: () => import('@/views/Vaccine.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router