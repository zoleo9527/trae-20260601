import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import LaborDemandList from '../views/LaborDemandList.vue'
import LaborDemandDetail from '../views/LaborDemandDetail.vue'
import CandidateList from '../views/CandidateList.vue'
import CandidateDetail from '../views/CandidateDetail.vue'
import MatchingList from '../views/MatchingList.vue'
import MatchingDetail from '../views/MatchingDetail.vue'
import ReturnRecordList from '../views/ReturnRecordList.vue'
import StatusHistoryList from '../views/StatusHistoryList.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/labor-demands',
    name: 'LaborDemandList',
    component: LaborDemandList,
    meta: { requiresAuth: true }
  },
  {
    path: '/labor-demands/:id',
    name: 'LaborDemandDetail',
    component: LaborDemandDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/candidates',
    name: 'CandidateList',
    component: CandidateList,
    meta: { requiresAuth: true }
  },
  {
    path: '/candidates/:id',
    name: 'CandidateDetail',
    component: CandidateDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/matchings',
    name: 'MatchingList',
    component: MatchingList,
    meta: { requiresAuth: true }
  },
  {
    path: '/matchings/:id',
    name: 'MatchingDetail',
    component: MatchingDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/return-records',
    name: 'ReturnRecordList',
    component: ReturnRecordList,
    meta: { requiresAuth: true }
  },
  {
    path: '/status-histories',
    name: 'StatusHistoryList',
    component: StatusHistoryList,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
