import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import RentalPage from '@/pages/RentalPage.vue'
import CoursesPage from '@/pages/CoursesPage.vue'
import CheckinPage from '@/pages/CheckinPage.vue'
import RescuePage from '@/pages/RescuePage.vue'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', name: 'dashboard', component: DashboardPage },
      { path: 'rentals', name: 'rentals', component: RentalPage },
      { path: 'schedule', name: 'schedule', component: CoursesPage },
      { path: 'checkin', name: 'checkin', component: CheckinPage },
      { path: 'rescue', name: 'rescue', component: RescuePage },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
