import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    children: [
      { path: '', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
      { path: 'contracts', name: 'Contracts', component: () => import('../views/Contracts.vue'), meta: { roles: ['全科医生', '公共卫生专员'] } },
      { path: 'followups', name: 'Followups', component: () => import('../views/Followups.vue'), meta: { roles: ['全科医生', '公共卫生专员'] } },
      { path: 'appointments', name: 'Appointments', component: () => import('../views/Appointments.vue') },
      { path: 'observations', name: 'Observations', component: () => import('../views/Observations.vue'), meta: { roles: ['护士', '公共卫生专员'] } },
      { path: 'export', name: 'Export', component: () => import('../views/Export.vue'), meta: { roles: ['公共卫生专员'] } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = JSON.parse(localStorage.getItem('auth') || 'null')
  if (to.meta.public) return next()
  if (!auth) return next('/login')
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return next('/')
  next()
})

export default router
