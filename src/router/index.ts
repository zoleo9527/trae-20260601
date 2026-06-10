import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    roles?: string[]
  }
}

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/pages/Dashboard.vue'),
      },
      {
        path: 'transfer',
        name: 'TransferList',
        component: () => import('@/pages/TransferList.vue'),
        meta: { roles: ['繁育员', '场长'] },
      },
      {
        path: 'transfer/new',
        name: 'TransferNew',
        component: () => import('@/pages/TransferNew.vue'),
        meta: { roles: ['繁育员'] },
      },
      {
        path: 'transfer/:id',
        name: 'TransferDetail',
        component: () => import('@/pages/TransferDetail.vue'),
        props: true,
      },
      {
        path: 'assessment',
        name: 'AssessmentList',
        component: () => import('@/pages/AssessmentList.vue'),
        meta: { roles: ['兽医', '场长'] },
      },
      {
        path: 'assessment/:id',
        name: 'AssessmentDetail',
        component: () => import('@/pages/AssessmentDetail.vue'),
        props: true,
      },
      {
        path: 'log',
        name: 'OperationLog',
        component: () => import('@/pages/OperationLog.vue'),
        meta: { roles: ['场长'] },
      },
      {
        path: 'forbidden',
        name: 'Forbidden',
        component: () => import('@/pages/Forbidden.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()

  if (!auth.isLoggedIn && to.path !== '/') {
    next('/')
    return
  }

  const requiredRoles = to.meta.roles
  if (requiredRoles && auth.role && !requiredRoles.includes(auth.role)) {
    next({ name: 'Forbidden' })
    return
  }

  next()
})

export default router
