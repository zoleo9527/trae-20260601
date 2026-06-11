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
        path: 'discount',
        name: 'DiscountList',
        component: () => import('@/views/discount/List.vue'),
        meta: { title: '折扣活动' }
      },
      {
        path: 'discount/create',
        name: 'DiscountCreate',
        component: () => import('@/views/discount/Form.vue'),
        meta: { title: '创建活动', roles: ['store_manager'] }
      },
      {
        path: 'discount/:id',
        name: 'DiscountDetail',
        component: () => import('@/views/discount/Detail.vue'),
        meta: { title: '活动详情' }
      },
      {
        path: 'price-report',
        name: 'PriceReportList',
        component: () => import('@/views/price-report/List.vue'),
        meta: { title: '价格报备' }
      },
      {
        path: 'price-report/create',
        name: 'PriceReportCreate',
        component: () => import('@/views/price-report/Form.vue'),
        meta: { title: '新增报备', roles: ['store_manager'] }
      },
      {
        path: 'price-report/:id',
        name: 'PriceReportDetail',
        component: () => import('@/views/price-report/Detail.vue'),
        meta: { title: '报备详情' }
      },
      {
        path: 'logs',
        name: 'OperationLogs',
        component: () => import('@/views/OperationLogs.vue'),
        meta: { title: '操作日志', roles: ['operation_supervisor', 'investment_manager'] }
      },
      {
        path: 'exception',
        name: 'ExceptionList',
        component: () => import('@/views/ExceptionList.vue'),
        meta: { title: '异常处理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth !== false && !userStore.isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
    return
  }

  if (to.meta.roles && to.meta.roles.length > 0) {
    if (!to.meta.roles.includes(userStore.userRole)) {
      next('/')
      return
    }
  }

  next()
})

export default router
