import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import QcPage from '@/pages/QcPage.vue'
import ExceptionPage from '@/pages/ExceptionPage.vue'
import ShippingPage from '@/pages/ShippingPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/qc',
    name: 'qc',
    component: QcPage,
  },
  {
    path: '/exceptions',
    name: 'exceptions',
    component: ExceptionPage,
  },
  {
    path: '/shipping',
    name: 'shipping',
    component: ShippingPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
