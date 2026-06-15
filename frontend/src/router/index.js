import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import RepairRecords from '@/views/RepairRecords.vue'
import WarrantyTracking from '@/views/WarrantyTracking.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/repair-records',
    name: 'RepairRecords',
    component: RepairRecords,
    meta: { requiresAuth: true }
  },
  {
    path: '/warranty-tracking',
    name: 'WarrantyTracking',
    component: WarrantyTracking,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('user')
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router