import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '总览仪表盘' } },
      { path: 'appointments', name: 'Appointments', component: () => import('@/views/Appointments.vue'), meta: { title: '练车预约' } },
      { path: 'schedules', name: 'Schedules', component: () => import('@/views/Schedules.vue'), meta: { title: '教练排班' } },
      { path: 'exams', name: 'ExamFollowUps', component: () => import('@/views/ExamFollowUps.vue'), meta: { title: '考试跟进' } },
      { path: 'trace/:id', name: 'Trace', component: () => import('@/views/Trace.vue'), meta: { title: '流程追溯' } }
    ]
  }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
