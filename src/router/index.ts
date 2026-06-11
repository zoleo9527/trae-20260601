import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue'), meta: { title: '仪表盘' } },
      { path: 'requisitions', name: 'requisitions', component: () => import('@/views/RequisitionView.vue'), meta: { title: '领料管理' } },
      { path: 'requisitions/new', name: 'requisitions-new', component: () => import('@/views/RequisitionNewView.vue'), meta: { title: '新建领料单' } },
      { path: 'checkin', name: 'checkin', component: () => import('@/views/CheckInView.vue'), meta: { title: '现场打卡' } },
      { path: 'returns', name: 'returns', component: () => import('@/views/ReturnView.vue'), meta: { title: '补领与退回' } },
      { path: 'history', name: 'history', component: () => import('@/views/HistoryView.vue'), meta: { title: '历史记录' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  document.title = (to.meta.title ? `${to.meta.title} · ` : '') + '弱电施工·线缆管理系统'
})

export default router
