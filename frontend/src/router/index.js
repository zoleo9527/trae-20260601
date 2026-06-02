import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'packages',
        name: 'Packages',
        component: () => import('../views/Packages.vue')
      },
      {
        path: 'packages/:packageNo',
        name: 'PackageDetail',
        component: () => import('../views/PackageDetail.vue')
      },
      {
        path: 'batches',
        name: 'Batches',
        component: () => import('../views/Batches.vue')
      },
      {
        path: 'batches/:batchNo',
        name: 'BatchDetail',
        component: () => import('../views/BatchDetail.vue')
      },
      {
        path: 'workflow/recycle',
        name: 'Recycle',
        component: () => import('../views/workflow/Recycle.vue')
      },
      {
        path: 'workflow/cleaning',
        name: 'Cleaning',
        component: () => import('../views/workflow/Cleaning.vue')
      },
      {
        path: 'workflow/sterilization',
        name: 'Sterilization',
        component: () => import('../views/workflow/Sterilization.vue')
      },
      {
        path: 'workflow/delivery',
        name: 'Delivery',
        component: () => import('../views/workflow/Delivery.vue')
      },
      {
        path: 'workflow/feedback',
        name: 'Feedback',
        component: () => import('../views/workflow/Feedback.vue')
      },
      {
        path: 'exceptions',
        name: 'Exceptions',
        component: () => import('../views/Exceptions.vue')
      },
      {
        path: 'recalls',
        name: 'Recalls',
        component: () => import('../views/Recalls.vue')
      },
      {
        path: 'recalls/:recallNo',
        name: 'RecallDetail',
        component: () => import('../views/RecallDetail.vue')
      }
    ]
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
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
