import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import DashboardView from '@/views/DashboardView.vue'
import ReplacementsView from '@/views/ReplacementsView.vue'
import CostReviewView from '@/views/CostReviewView.vue'
import HistoryView from '@/views/HistoryView.vue'
import BackgroundView from '@/views/BackgroundView.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardView,
      },
      {
        path: 'replacements',
        name: 'replacements',
        component: ReplacementsView,
      },
      {
        path: 'cost-review',
        name: 'cost-review',
        component: CostReviewView,
      },
      {
        path: 'history',
        name: 'history',
        component: HistoryView,
      },
      {
        path: 'background',
        name: 'background',
        component: BackgroundView,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
