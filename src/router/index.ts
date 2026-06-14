import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import VehicleDetailPage from '@/pages/vehicle/VehicleDetailPage.vue'
import PricingPage from '@/pages/vehicle/PricingPage.vue'
import FollowupPage from '@/pages/followup/FollowupPage.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/vehicle/:id',
    name: 'vehicle-detail',
    component: VehicleDetailPage
  },
  {
    path: '/vehicle/:id/pricing',
    name: 'vehicle-pricing',
    component: PricingPage
  },
  {
    path: '/followup/:id',
    name: 'followup',
    component: FollowupPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
