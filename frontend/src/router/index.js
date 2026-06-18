import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import ActivityList from '../views/ActivityList.vue'
import ActivityDetail from '../views/ActivityDetail.vue'
import ApplicationList from '../views/ApplicationList.vue'
import PostAllocation from '../views/PostAllocation.vue'
import ExceptionList from '../views/ExceptionList.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/activities',
    name: 'ActivityList',
    component: ActivityList,
    meta: { requiresAuth: true }
  },
  {
    path: '/activities/:id',
    name: 'ActivityDetail',
    component: ActivityDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/applications',
    name: 'ApplicationList',
    component: ApplicationList,
    meta: { requiresAuth: true }
  },
  {
    path: '/posts',
    name: 'PostAllocation',
    component: PostAllocation,
    meta: { requiresAuth: true }
  },
  {
    path: '/exceptions',
    name: 'ExceptionList',
    component: ExceptionList,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router