import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/operation',
    name: 'OperationLayout',
    component: () => import('../views/layout/OperationLayout.vue'),
    meta: { role: 'operation' },
    children: [
      { path: '', redirect: '/operation/repairs' },
      { path: 'repairs', name: 'OpRepairList', component: () => import('../views/operation/RepairList.vue') },
      { path: 'repairs/create', name: 'OpRepairCreate', component: () => import('../views/operation/RepairCreate.vue') },
      { path: 'repairs/:id', name: 'OpRepairDetail', component: () => import('../views/operation/RepairDetail.vue') },
      { path: 'timeout', name: 'OpTimeoutWarning', component: () => import('../views/operation/TimeoutWarning.vue') },
    ]
  },
  {
    path: '/service',
    name: 'ServiceLayout',
    component: () => import('../views/layout/ServiceLayout.vue'),
    meta: { role: 'service_desk' },
    children: [
      { path: '', redirect: '/service/pending' },
      { path: 'pending', name: 'SvcPendingList', component: () => import('../views/service/PendingList.vue') },
      { path: 'repairs/:id', name: 'SvcRepairDetail', component: () => import('../views/service/RepairDetail.vue') },
      { path: 'complaint-link', name: 'SvcComplaintLink', component: () => import('../views/service/ComplaintLink.vue') },
    ]
  },
  {
    path: '/engineering',
    name: 'EngineeringLayout',
    component: () => import('../views/layout/EngineeringLayout.vue'),
    meta: { role: 'engineering' },
    children: [
      { path: '', redirect: '/engineering/pending' },
      { path: 'pending', name: 'EngPendingList', component: () => import('../views/engineering/PendingList.vue') },
      { path: 'dispatches/:id', name: 'EngDispatchDetail', component: () => import('../views/engineering/DispatchDetail.vue') },
      { path: 'history', name: 'EngHistory', component: () => import('../views/engineering/DispatchHistory.vue') },
    ]
  },
  { path: '/', redirect: '/login' },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem('user')
  if (to.path === '/login') {
    next()
    return
  }
  if (!userStr) {
    next('/login')
    return
  }
  const user = JSON.parse(userStr)
  const requiredRole = to.matched.find(r => r.meta.role)?.meta.role
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    next('/login')
    return
  }
  next()
})

export default router
