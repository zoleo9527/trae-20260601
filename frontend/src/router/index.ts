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
    component: () => import('@/components/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue')
      },
      {
        path: 'tenants',
        name: 'TenantList',
        component: () => import('@/views/tenant/TenantList.vue')
      },
      {
        path: 'tenants/:id',
        name: 'TenantDetail',
        component: () => import('@/views/tenant/TenantDetail.vue')
      },
      {
        path: 'licenses',
        name: 'LicenseList',
        component: () => import('@/views/license/LicenseList.vue')
      },
      {
        path: 'licenses/:id',
        name: 'LicenseDetail',
        component: () => import('@/views/license/LicenseDetail.vue')
      },
      {
        path: 'activities',
        name: 'ActivityList',
        component: () => import('@/views/activity/ActivityList.vue')
      },
      {
        path: 'activities/:id',
        name: 'ActivityDetail',
        component: () => import('@/views/activity/ActivityDetail.vue')
      },
      {
        path: 'complaints',
        name: 'ComplaintList',
        component: () => import('@/views/complaint/ComplaintList.vue')
      },
      {
        path: 'complaints/:id',
        name: 'ComplaintDetail',
        component: () => import('@/views/complaint/ComplaintDetail.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth !== false && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && authStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router
