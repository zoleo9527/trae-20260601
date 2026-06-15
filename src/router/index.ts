import { createRouter, createWebHistory } from 'vue-router'
import type { Role } from '../types'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../pages/LoginPage.vue'),
  },
  {
    path: '/dispatch',
    name: 'dispatch',
    component: () => import('../pages/DispatchPage.vue'),
    meta: { roles: ['dispatcher'] },
  },
  {
    path: '/installer',
    name: 'installer',
    component: () => import('../pages/InstallerPage.vue'),
    meta: { roles: ['technician'] },
  },
  {
    path: '/service',
    name: 'service',
    component: () => import('../pages/ServicePage.vue'),
    meta: { roles: ['customer_service'] },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('../pages/HistoryPage.vue'),
    meta: { roles: ['dispatcher', 'technician', 'customer_service'] },
  },
  {
    path: '/order/:id',
    name: 'order-detail',
    component: () => import('../pages/OrderDetailPage.vue'),
    meta: { roles: ['dispatcher', 'technician', 'customer_service'] },
  },
  {
    path: '/',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    next()
    return
  }
  
  const storedUser = localStorage.getItem('currentUser')
  if (!storedUser) {
    next('/login')
    return
  }
  
  const user = JSON.parse(storedUser)
  const roles = to.meta.roles as Role[]
  
  if (roles && !roles.includes(user.role)) {
    next('/login')
    return
  }
  
  next()
})

export default router