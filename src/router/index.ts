import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Assignments from '@/views/Assignments.vue'
import AssignmentDetail from '@/views/AssignmentDetail.vue'
import Terminology from '@/views/Terminology.vue'
import TerminologyDetail from '@/views/TerminologyDetail.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
    },
    {
      path: '/assignments',
      name: 'Assignments',
      component: Assignments,
    },
    {
      path: '/assignments/:id',
      name: 'AssignmentDetail',
      component: AssignmentDetail,
    },
    {
      path: '/terminology',
      name: 'Terminology',
      component: Terminology,
    },
    {
      path: '/terminology/:id',
      name: 'TerminologyDetail',
      component: TerminologyDetail,
    },
  ],
})

export default router