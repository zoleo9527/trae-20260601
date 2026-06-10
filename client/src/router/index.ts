import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/Layout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '工作台', icon: 'dashboard' }
        },
        {
          path: 'receptions',
          name: 'Receptions',
          component: () => import('@/views/receptions/List.vue'),
          meta: { title: '团体接待', icon: 'group' }
        },
        {
          path: 'receptions/:id',
          name: 'ReceptionDetail',
          component: () => import('@/views/receptions/Detail.vue'),
          meta: { title: '接待详情', hidden: true }
        },
        {
          path: 'guide-tasks',
          name: 'GuideTasks',
          component: () => import('@/views/guideTasks/List.vue'),
          meta: { title: '向导任务', icon: 'guide' }
        },
        {
          path: 'guide-tasks/:id',
          name: 'GuideTaskDetail',
          component: () => import('@/views/guideTasks/Detail.vue'),
          meta: { title: '任务详情', hidden: true }
        },
        {
          path: 'warehouse',
          name: 'Warehouse',
          component: () => import('@/views/warehouse/List.vue'),
          meta: { title: '仓库交接', icon: 'warehouse' }
        },
        {
          path: 'warehouse/:id',
          name: 'WarehouseDetail',
          component: () => import('@/views/warehouse/Detail.vue'),
          meta: { title: '交接详情', hidden: true }
        },
        {
          path: 'audit-logs',
          name: 'AuditLogs',
          component: () => import('@/views/AuditLogs.vue'),
          meta: { title: '操作日志', icon: 'log' }
        }
      ]
    }
  ]
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '观光果园'} - 观光果园管理系统`
  next()
})

export default router
