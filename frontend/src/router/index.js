import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true, title: '登录' },
  },
  {
    path: '/',
    component: () => import('@/layout/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '工作台 - 主管进度视图', icon: 'DataBoard' },
      },
      {
        path: 'pending',
        name: 'PendingList',
        component: () => import('@/views/PendingList.vue'),
        meta: { title: '待办列表', icon: 'List' },
      },
      {
        path: 'leases',
        name: 'LeaseList',
        component: () => import('@/views/leases/List.vue'),
        meta: { title: '品牌租约', icon: 'Document' },
      },
      {
        path: 'leases/create',
        name: 'LeaseCreate',
        component: () => import('@/views/leases/Edit.vue'),
        meta: { title: '新建租约', icon: 'DocumentAdd', hidden: true },
      },
      {
        path: 'leases/:id',
        name: 'LeaseDetail',
        component: () => import('@/views/leases/Detail.vue'),
        meta: { title: '租约详情', icon: 'View', hidden: true },
      },
      {
        path: 'leases/:id/edit',
        name: 'LeaseEdit',
        component: () => import('@/views/leases/Edit.vue'),
        meta: { title: '编辑租约', icon: 'Edit', hidden: true },
      },
      {
        path: 'deduction',
        name: 'Deduction',
        component: () => import('@/views/deduction/List.vue'),
        meta: { title: '扣点规则管理', icon: 'Money' },
      },
      {
        path: 'liability',
        name: 'Liability',
        component: () => import('@/views/liability/List.vue'),
        meta: { title: '责任不清台账', icon: 'Warning', badge: 'liability' },
      },
      {
        path: 'export',
        name: 'Export',
        component: () => import('@/views/Export.vue'),
        meta: { title: '导出中心', icon: 'Download' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (!to.meta.public && !userStore.isLogin) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && userStore.isLogin) {
    return '/'
  }
})

export default router
