import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '工作台' }
  },
  {
    path: '/outbound/pending',
    name: 'OutboundPending',
    component: () => import('@/views/outbound/PendingList.vue'),
    meta: { title: '出库验机 - 待处理' }
  },
  {
    path: '/outbound/completed',
    name: 'OutboundCompleted',
    component: () => import('@/views/outbound/CompletedList.vue'),
    meta: { title: '出库验机 - 已完成' }
  },
  {
    path: '/outbound/inspect/:id',
    name: 'OutboundInspect',
    component: () => import('@/views/outbound/InspectForm.vue'),
    meta: { title: '出库验机 - 验机详情' }
  },
  {
    path: '/return/pending',
    name: 'ReturnPending',
    component: () => import('@/views/return/PendingList.vue'),
    meta: { title: '归还复核 - 待处理' }
  },
  {
    path: '/return/completed',
    name: 'ReturnCompleted',
    component: () => import('@/views/return/CompletedList.vue'),
    meta: { title: '归还复核 - 已完成' }
  },
  {
    path: '/return/review/:id',
    name: 'ReturnReview',
    component: () => import('@/views/return/ReviewForm.vue'),
    meta: { title: '归还复核 - 复核详情' }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/History.vue'),
    meta: { title: '历史记录' }
  },
  {
    path: '/history/detail/:id',
    name: 'HistoryDetail',
    component: () => import('@/views/HistoryDetail.vue'),
    meta: { title: '历史详情' }
  },
  {
    path: '/batch',
    name: 'Batch',
    component: () => import('@/views/BatchAction.vue'),
    meta: { title: '批量处理' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
