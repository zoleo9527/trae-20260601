import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue')
  },
  {
    path: '/reports',
    name: 'ReportList',
    component: () => import('@/views/ReportList.vue')
  },
  {
    path: '/reports/:id',
    name: 'ReportDetail',
    component: () => import('@/views/ReportDetail.vue')
  },
  {
    path: '/reports/create',
    name: 'ReportCreate',
    component: () => import('@/views/ReportCreate.vue')
  },
  {
    path: '/followups',
    name: 'FollowUpList',
    component: () => import('@/views/FollowUpList.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
