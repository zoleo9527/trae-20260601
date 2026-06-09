import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import AfterSalesView from '@/views/AfterSalesView.vue'
import FeeAdjustmentView from '@/views/FeeAdjustmentView.vue'

const routes = [
  { path: '/', name: 'dashboard', component: DashboardView },
  { path: '/aftersales', name: 'aftersales', component: AfterSalesView },
  { path: '/fee-adjustment', name: 'fee-adjustment', component: FeeAdjustmentView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
