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
        meta: { title: '工作台' }
      },
      {
        path: 'outbound',
        name: 'Outbound',
        component: () => import('@/views/OutboundList.vue'),
        meta: { title: '酒水出库' }
      },
      {
        path: 'outbound/create',
        name: 'OutboundCreate',
        component: () => import('@/views/OutboundCreate.vue'),
        meta: { title: '创建出库单' }
      },
      {
        path: 'outbound/:id',
        name: 'OutboundDetail',
        component: () => import('@/views/OutboundDetail.vue'),
        meta: { title: '出库详情' }
      },
      {
        path: 'verification',
        name: 'Verification',
        component: () => import('@/views/VerificationList.vue'),
        meta: { title: '赠品核销' }
      },
      {
        path: 'verification/create',
        name: 'VerificationCreate',
        component: () => import('@/views/VerificationCreate.vue'),
        meta: { title: '创建核销单' }
      },
      {
        path: 'verification/:id',
        name: 'VerificationDetail',
        component: () => import('@/views/VerificationDetail.vue'),
        meta: { title: '核销详情' }
      },
      {
        path: 'booking',
        name: 'Booking',
        component: () => import('@/views/BookingList.vue'),
        meta: { title: '包厢预订' }
      },
      {
        path: 'drink',
        name: 'Drink',
        component: () => import('@/views/DrinkList.vue'),
        meta: { title: '酒水管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  userStore.loadUser()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router
