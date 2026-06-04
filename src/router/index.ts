import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
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
        meta: { title: '首页概览' }
      },
      {
        path: 'medication',
        name: 'Medication',
        component: () => import('@/views/medication/List.vue'),
        meta: { title: '术后用药' }
      },
      {
        path: 'medication/:id',
        name: 'MedicationDetail',
        component: () => import('@/views/medication/Detail.vue'),
        meta: { title: '用药详情' }
      },
      {
        path: 'followup',
        name: 'Followup',
        component: () => import('@/views/followup/List.vue'),
        meta: { title: '复诊提醒' }
      },
      {
        path: 'followup/:id',
        name: 'FollowupDetail',
        component: () => import('@/views/followup/Detail.vue'),
        meta: { title: '复诊详情' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('user')
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
