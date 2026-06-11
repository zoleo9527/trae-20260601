import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/history' },
  { path: '/history', name: 'History', component: () => import('@/views/HistoryView.vue'), meta: { title: '历史回看·调拨复核时间线' } },
  { path: '/allocations', name: 'Allocations', component: () => import('@/views/AllocationListView.vue'), meta: { title: '商品调拨单' } },
  { path: '/allocations/:id', name: 'AllocationDetail', component: () => import('@/views/AllocationDetailView.vue'), meta: { title: '调拨单详情' } },
  { path: '/pending-review', name: 'PendingReview', component: () => import('@/views/PendingReviewView.vue'), meta: { title: '待到柜复核' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.afterEach((to) => {
  document.title = (to.meta.title as string) || '百货专柜调拨复核系统'
})

export default router
