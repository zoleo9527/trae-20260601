import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '工作台' }
  },
  {
    path: '/inbound',
    name: 'InboundList',
    component: () => import('@/views/InboundList.vue'),
    meta: { title: '进厂登记' }
  },
  {
    path: '/inbound/new',
    name: 'InboundNew',
    component: () => import('@/views/InboundForm.vue'),
    meta: { title: '新建进厂登记' }
  },
  {
    path: '/inbound/:id',
    name: 'InboundDetail',
    component: () => import('@/views/InboundForm.vue'),
    meta: { title: '进厂登记详情' }
  },
  {
    path: '/review',
    name: 'ReviewList',
    component: () => import('@/views/ReviewList.vue'),
    meta: { title: '过磅复核' }
  },
  {
    path: '/review/:id',
    name: 'ReviewDetail',
    component: () => import('@/views/ReviewDetail.vue'),
    meta: { title: '过磅复核详情' }
  },
  {
    path: '/recent',
    name: 'Recent',
    component: () => import('@/views/Recent.vue'),
    meta: { title: '最近打开' }
  },
  {
    path: '/logs',
    name: 'OperationLogs',
    component: () => import('@/views/OperationLogs.vue'),
    meta: { title: '操作日志' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { title: '设置' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || ''} - 再生资源分拣中心`
  next()
})

export default router
