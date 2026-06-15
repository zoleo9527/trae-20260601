import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import RepairOrders from '../views/RepairOrders.vue'
import SpareParts from '../views/SpareParts.vue'
import OrderDetail from '../views/OrderDetail.vue'
import Records from '../views/Records.vue'
import ShiftReport from '../views/ShiftReport.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/repair-orders',
    name: 'RepairOrders',
    component: RepairOrders
  },
  {
    path: '/spare-parts',
    name: 'SpareParts',
    component: SpareParts
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: OrderDetail
  },
  {
    path: '/records',
    name: 'Records',
    component: Records
  },
  {
    path: '/shift-report',
    name: 'ShiftReport',
    component: ShiftReport
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/' && !token) {
    next('/')
  } else {
    next()
  }
})

export default router
