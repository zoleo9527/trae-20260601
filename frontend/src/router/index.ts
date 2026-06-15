import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dispatch'
  },
  {
    path: '/dispatch',
    name: 'Dispatch',
    component: () => import('@/views/dispatch/Index.vue'),
    meta: { requiresAuth: true, role: 'DISPATCHER' }
  },
  {
    path: '/dispatch/orders',
    name: 'DispatchOrders',
    component: () => import('@/views/dispatch/Orders.vue'),
    meta: { requiresAuth: true, role: 'DISPATCHER' }
  },
  {
    path: '/dispatch/alerts',
    name: 'DispatchAlerts',
    component: () => import('@/views/dispatch/Alerts.vue'),
    meta: { requiresAuth: true, role: 'DISPATCHER' }
  },
  {
    path: '/installer',
    name: 'Installer',
    component: () => import('@/views/installer/Index.vue'),
    meta: { requiresAuth: true, role: 'INSTALLER' }
  },
  {
    path: '/installer/tasks',
    name: 'InstallerTasks',
    component: () => import('@/views/installer/Tasks.vue'),
    meta: { requiresAuth: true, role: 'INSTALLER' }
  },
  {
    path: '/installer/task/:id',
    name: 'InstallerTaskDetail',
    component: () => import('@/views/installer/TaskDetail.vue'),
    meta: { requiresAuth: true, role: 'INSTALLER' }
  },
  {
    path: '/installer/rework/:id',
    name: 'InstallerRework',
    component: () => import('@/views/installer/Rework.vue'),
    meta: { requiresAuth: true, role: 'INSTALLER' }
  },
  {
    path: '/service',
    name: 'Service',
    component: () => import('@/views/service/Index.vue'),
    meta: { requiresAuth: true, role: 'SERVICE' }
  },
  {
    path: '/service/rework',
    name: 'ServiceRework',
    component: () => import('@/views/service/Rework.vue'),
    meta: { requiresAuth: true, role: 'SERVICE' }
  },
  {
    path: '/service/liability',
    name: 'ServiceLiability',
    component: () => import('@/views/service/Liability.vue'),
    meta: { requiresAuth: true, role: 'SERVICE' }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/views/history/Index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/history/order/:id',
    name: 'HistoryOrderDetail',
    component: () => import('@/views/history/OrderDetail.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.meta.role && userStore.user?.role !== to.meta.role) {
    next('/')
  } else {
    next()
  }
})

export default router