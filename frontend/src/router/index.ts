import { createRouter, createWebHistory } from 'vue-router'
import ComplaintList from '@/pages/ComplaintList.vue'
import ComplaintDetail from '@/pages/ComplaintDetail.vue'
import BrandFeedbackList from '@/pages/BrandFeedbackList.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'ComplaintList',
      component: ComplaintList
    },
    {
      path: '/complaint/:id',
      name: 'ComplaintDetail',
      component: ComplaintDetail,
      props: true
    },
    {
      path: '/brand-feedback',
      name: 'BrandFeedbackList',
      component: BrandFeedbackList
    }
  ]
})

export default router
