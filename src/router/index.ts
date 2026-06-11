import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import InspectionList from '@/pages/InspectionList.vue';
import InspectionDetail from '@/pages/InspectionDetail.vue';
import DispatchList from '@/pages/DispatchList.vue';
import RectificationStatus from '@/pages/RectificationStatus.vue';
import ReviewList from '@/pages/ReviewList.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/inspections'
  },
  {
    path: '/inspections',
    name: 'inspections',
    component: InspectionList
  },
  {
    path: '/inspections/:id',
    name: 'inspection-detail',
    component: InspectionDetail
  },
  {
    path: '/dispatches',
    name: 'dispatches',
    component: DispatchList
  },
  {
    path: '/rectification',
    name: 'rectification',
    component: RectificationStatus
  },
  {
    path: '/review',
    name: 'review',
    component: ReviewList
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
