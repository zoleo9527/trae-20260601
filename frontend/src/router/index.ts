import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/service/pending'
  },
  {
    path: '/service/pending',
    name: 'PendingList',
    component: () => import('@/views/service/PendingList.vue'),
    meta: { title: '待处理工作台' }
  },
  {
    path: '/service/tenant-visit',
    name: 'TenantVisitList',
    component: () => import('@/views/service/TenantVisitList.vue'),
    meta: { title: '租户回访管理' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
