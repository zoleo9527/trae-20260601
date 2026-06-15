import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
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
        meta: { title: '今日待办' }
      },
      {
        path: 'arrivals',
        name: 'Arrivals',
        component: () => import('@/views/Arrivals.vue'),
        meta: { title: '配件到货', roles: ['warehouse', 'manager'] }
      },
      {
        path: 'arrivals/:id',
        name: 'ArrivalDetail',
        component: () => import('@/views/ArrivalDetail.vue'),
        meta: { title: '到货详情' }
      },
      {
        path: 'schedules',
        name: 'Schedules',
        component: () => import('@/views/Schedules.vue'),
        meta: { title: '装机排程', roles: ['sales', 'tech', 'manager'] }
      },
      {
        path: 'schedules/:id',
        name: 'ScheduleDetail',
        component: () => import('@/views/ScheduleDetail.vue'),
        meta: { title: '装机单详情' }
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('@/views/History.vue'),
        meta: { title: '历史记录' }
      },
      {
        path: 'anomalies',
        name: 'Anomalies',
        component: () => import('@/views/Anomalies.vue'),
        meta: { title: '异常提醒' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && auth.isLoggedIn) {
    next('/dashboard')
  } else if (to.meta.roles && auth.user && !to.meta.roles.includes(auth.user.role)) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
