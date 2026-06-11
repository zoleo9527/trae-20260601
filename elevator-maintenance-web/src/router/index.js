import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { USER_ROLE } from '@/utils/constants'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/plans',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'plans',
        name: 'PlanList',
        component: () => import('@/views/PlanList.vue'),
        meta: { title: '维保计划', icon: 'Document' }
      },
      {
        path: 'plans/:id',
        name: 'PlanDetail',
        component: () => import('@/views/PlanDetail.vue'),
        meta: { title: '维保计划详情', icon: 'Document', hidden: true }
      },
      {
        path: 'checkins',
        name: 'CheckInList',
        component: () => import('@/views/CheckInList.vue'),
        meta: { title: '签到记录', icon: 'Calendar' }
      },
      {
        path: 'checkins/:id',
        name: 'CheckInDetail',
        component: () => import('@/views/CheckInDetail.vue'),
        meta: { title: '签到详情', icon: 'Calendar', hidden: true }
      },
      {
        path: 'review',
        name: 'ReviewList',
        component: () => import('@/views/ReviewList.vue'),
        meta: {
          title: '批量审核',
          icon: 'Check',
          roles: [USER_ROLE.SUPERVISOR.value]
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/plans'
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
    if (!userStore.hasRole(to.meta.roles)) {
      next('/')
      return
    }
  }

  next()
})

export default router
