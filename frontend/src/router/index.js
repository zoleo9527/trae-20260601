import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台 - 扯皮预警总览', roles: ['consultant', 'operations', 'finance'] }
      },
      {
        path: 'properties',
        name: 'Properties',
        component: () => import('@/views/Properties.vue'),
        meta: { title: '房源台账', roles: ['consultant', 'operations', 'finance'] }
      },
      {
        path: 'viewings',
        name: 'Viewings',
        component: () => import('@/views/Viewings.vue'),
        meta: { title: '看房记录与反馈', roles: ['consultant', 'operations', 'finance'] }
      },
      {
        path: 'borrow',
        name: 'Borrow',
        component: () => import('@/views/Borrow.vue'),
        meta: { title: '交房验收流程', roles: ['consultant', 'operations', 'finance'] }
      },
      {
        path: 'key-transfers',
        name: 'KeyTransfers',
        component: () => import('@/views/KeyTransfers.vue'),
        meta: { title: '钥匙移交与回看', roles: ['consultant', 'operations', 'finance'] }
      },
      {
        path: 'deposits',
        name: 'Deposits',
        component: () => import('@/views/Deposits.vue'),
        meta: { title: '押金结算', roles: ['consultant', 'operations', 'finance'] }
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/views/AuditLog.vue'),
        meta: { title: '审计日志', roles: ['operations', 'finance'] }
      },
      {
        path: 'integration-map',
        name: 'IntegrationMap',
        component: () => import('@/views/IntegrationMap.vue'),
        meta: { title: '集成点与模拟数据', roles: ['consultant', 'operations', 'finance'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && !authStore.canAccess(to.meta.roles)) {
    next('/dashboard')
    return
  }

  if (to.path === '/login' && authStore.isLoggedIn) {
    next('/dashboard')
    return
  }

  document.title = to.meta?.title
    ? `${to.meta.title} | 写字楼租赁交付`
    : '写字楼租赁 - 交房验收与钥匙移交'

  next()
})

export default router
