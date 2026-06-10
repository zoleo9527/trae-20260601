import { createRouter, createWebHistory } from 'vue-router'
import type { Role } from '@/types'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'role-select',
      component: () => import('@/views/RoleSelect.vue')
    },
    {
      path: '/feeder',
      name: 'feeder',
      component: () => import('@/views/feeder/FeederWorkbench.vue')
    },
    {
      path: '/sorter',
      name: 'sorter',
      component: () => import('@/views/sorter/SorterWorkbench.vue')
    },
    {
      path: '/manager',
      name: 'manager',
      component: () => import('@/views/manager/ManagerWorkbench.vue')
    },
    {
      path: '/manager/report/:id',
      name: 'report-detail',
      component: () => import('@/views/manager/ReportDetail.vue')
    },
    {
      path: '/manager/isolation/:id',
      name: 'isolation-form',
      component: () => import('@/views/manager/IsolationForm.vue')
    },
    {
      path: '/manager/isolation-review',
      name: 'isolation-review',
      component: () => import('@/views/manager/IsolationReview.vue')
    },
    {
      path: '/report/new',
      name: 'report-new',
      component: () => import('@/views/ReportForm.vue')
    },
    {
      path: '/report/history',
      name: 'report-history',
      component: () => import('@/views/ReportHistory.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const publicRoutes = ['role-select', 'report-new', 'report-history']
  const role = localStorage.getItem('current_role') as Role | null

  if (!role && to.name !== 'role-select') {
    next({ name: 'role-select' })
    return
  }

  if (to.name === 'feeder' && role !== 'feeder') {
    next({ name: 'role-select' })
    return
  }

  if (to.name === 'sorter' && role !== 'sorter') {
    next({ name: 'role-select' })
    return
  }

  if (to.name?.toString().startsWith('manager') && role !== 'manager') {
    next({ name: 'role-select' })
    return
  }

  next()
})

export default router
