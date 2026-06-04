import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/PlanList.vue')
  },
  {
    path: '/plans',
    name: 'PlanList',
    component: () => import('@/views/PlanList.vue')
  },
  {
    path: '/plans/:id',
    name: 'PlanDetail',
    component: () => import('@/views/PlanDetail.vue')
  },
  {
    path: '/plans/:id/evaluate',
    name: 'PlanEvaluate',
    component: () => import('@/views/PlanEvaluate.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
