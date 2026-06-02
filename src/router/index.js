import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/stalls',
    name: 'Stalls',
    component: () => import('../views/StallManage.vue')
  },
  {
    path: '/tenants',
    name: 'Tenants',
    component: () => import('../views/TenantManage.vue')
  },
  {
    path: '/rent',
    name: 'Rent',
    component: () => import('../views/RentBill.vue')
  },
  {
    path: '/utilities',
    name: 'Utilities',
    component: () => import('../views/UtilityRecord.vue')
  },
  {
    path: '/hygiene',
    name: 'Hygiene',
    component: () => import('../views/HygieneCheck.vue')
  },
  {
    path: '/deductions',
    name: 'Deductions',
    component: () => import('../views/DeductionRecord.vue')
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/ReportCenter.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
