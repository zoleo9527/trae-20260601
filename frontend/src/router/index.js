import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/properties',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'properties',
        name: 'Properties',
        component: () => import('@/views/PropertyList.vue'),
        meta: { title: '房源管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'viewings',
        name: 'Viewings',
        component: () => import('@/views/ViewingList.vue'),
        meta: { title: '带看安排', icon: 'Calendar' }
      },
      {
        path: 'exceptions',
        name: 'Exceptions',
        component: () => import('@/views/ExceptionList.vue'),
        meta: { title: '异常处理', icon: 'Warning' }
      },
      {
        path: 'handover',
        name: 'Handover',
        component: () => import('@/views/HandoverSummary.vue'),
        meta: { title: '交班摘要', icon: 'Notebook' }
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
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
