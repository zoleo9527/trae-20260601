import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import DispatcherDashboard from '../views/DispatcherDashboard.vue'
import TechnicianDashboard from '../views/TechnicianDashboard.vue'
import ServiceDashboard from '../views/ServiceDashboard.vue'
import OrderDetail from '../views/OrderDetail.vue'
import ResponsibilityReview from '../views/ResponsibilityReview.vue'

const routes = [
  { path: '/', name: 'Login', component: Login },
  { path: '/dispatcher', name: 'DispatcherDashboard', component: DispatcherDashboard },
  { path: '/technician', name: 'TechnicianDashboard', component: TechnicianDashboard },
  { path: '/service', name: 'ServiceDashboard', component: ServiceDashboard },
  { path: '/order/:id', name: 'OrderDetail', component: OrderDetail },
  { path: '/responsibility-review', name: 'ResponsibilityReview', component: ResponsibilityReview }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const user = localStorage.getItem('user')
  if (to.path !== '/' && !user) {
    next('/')
  } else {
    next()
  }
})

export default router