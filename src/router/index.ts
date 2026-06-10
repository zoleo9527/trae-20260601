import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'

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
      },
      {
        path: 'transfer/new',
        name: 'TransferNew',
        component: () => import('@/pages/TransferNew.vue'),
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
  } else {
    next()
  }
})

export default router
