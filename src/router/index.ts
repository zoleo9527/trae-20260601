import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layout/MainLayout.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/Dashboard.vue'),
      },
      {
        path: 'orders',
        name: 'orderList',
        component: () => import('@/pages/OrderList.vue'),
      },
      {
        path: 'orders/new',
        name: 'orderNew',
        component: () => import('@/pages/OrderForm.vue'),
      },
      {
        path: 'orders/:id',
        name: 'orderDetail',
        component: () => import('@/pages/OrderDetail.vue'),
      },
      {
        path: 'arrivals',
        name: 'arrivalList',
        component: () => import('@/pages/ArrivalList.vue'),
      },
      {
        path: 'arrivals/new',
        name: 'arrivalNew',
        component: () => import('@/pages/ArrivalForm.vue'),
      },
      {
        path: 'arrivals/:id',
        name: 'arrivalDetail',
        component: () => import('@/pages/ArrivalDetail.vue'),
      },
      {
        path: 'logs',
        name: 'logList',
        component: () => import('@/pages/LogList.vue'),
      },
      {
        path: 'notifications',
        name: 'notificationList',
        component: () => import('@/pages/NotificationList.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
