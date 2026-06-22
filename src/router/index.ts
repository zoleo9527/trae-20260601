import MainLayout from '@/layouts/MainLayout.vue'
import Dashboard from '@/pages/Dashboard.vue'
import IssueDetail from '@/pages/IssueDetail.vue'
import IssueList from '@/pages/IssueList.vue'
import IssueNew from '@/pages/IssueNew.vue'
import RoleSelect from '@/pages/RoleSelect.vue'
import TestDetail from '@/pages/TestDetail.vue'
import TestList from '@/pages/TestList.vue'
import TestNew from '@/pages/TestNew.vue'
import { createRouter, createWebHistory } from 'vue-router'
import GasHome from '@/pages/GasHome.vue'
import ApplicationList from '@/pages/ApplicationList.vue'
import ApplicationDetail from '@/pages/ApplicationDetail.vue'
import ApplicationNew from '@/pages/ApplicationNew.vue'
import VisitList from '@/pages/VisitList.vue'
import VisitDetail from '@/pages/VisitDetail.vue'
import VisitNew from '@/pages/VisitNew.vue'
import SafetyCheckList from '@/pages/SafetyCheckList.vue'
import SafetyCheckDetail from '@/pages/SafetyCheckDetail.vue'
import SafetyCheckNew from '@/pages/SafetyCheckNew.vue'
import HiddenDangerList from '@/pages/HiddenDangerList.vue'
import HiddenDangerDetail from '@/pages/HiddenDangerDetail.vue'
import MeterChangeList from '@/pages/MeterChangeList.vue'
import MeterChangeDetail from '@/pages/MeterChangeDetail.vue'
import MeterChangeNew from '@/pages/MeterChangeNew.vue'

const routes = [
  {
    path: '/',
    name: 'role-select',
    component: RoleSelect,
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'tests',
        name: 'tests',
        component: TestList,
      },
      {
        path: 'tests/new',
        name: 'test-new',
        component: TestNew,
      },
      {
        path: 'tests/:id',
        name: 'test-detail',
        component: TestDetail,
      },
      {
        path: 'issues',
        name: 'issues',
        component: IssueList,
      },
      {
        path: 'issues/new',
        name: 'issue-new',
        component: IssueNew,
      },
      {
        path: 'issues/:id',
        name: 'issue-detail',
        component: IssueDetail,
      },
      {
        path: 'gas',
        name: 'gas-home',
        component: GasHome,
      },
      {
        path: 'gas/applications',
        name: 'gas-applications',
        component: ApplicationList,
      },
      {
        path: 'gas/applications/:id',
        name: 'gas-application-detail',
        component: ApplicationDetail,
      },
      {
        path: 'gas/applications/new',
        name: 'gas-application-new',
        component: ApplicationNew,
      },
      {
        path: 'gas/visits',
        name: 'gas-visits',
        component: VisitList,
      },
      {
        path: 'gas/visits/:id',
        name: 'gas-visit-detail',
        component: VisitDetail,
      },
      {
        path: 'gas/visits/new',
        name: 'gas-visit-new',
        component: VisitNew,
      },
      {
        path: 'gas/safety-checks',
        name: 'gas-safety-checks',
        component: SafetyCheckList,
      },
      {
        path: 'gas/safety-checks/:id',
        name: 'gas-safety-check-detail',
        component: SafetyCheckDetail,
      },
      {
        path: 'gas/safety-checks/new',
        name: 'gas-safety-check-new',
        component: SafetyCheckNew,
      },
      {
        path: 'gas/hidden-dangers',
        name: 'gas-hidden-dangers',
        component: HiddenDangerList,
      },
      {
        path: 'gas/hidden-dangers/:id',
        name: 'gas-hidden-danger-detail',
        component: HiddenDangerDetail,
      },
      {
        path: 'gas/meter-changes',
        name: 'gas-meter-changes',
        component: MeterChangeList,
      },
      {
        path: 'gas/meter-changes/:id',
        name: 'gas-meter-change-detail',
        component: MeterChangeDetail,
      },
      {
        path: 'gas/meter-changes/new',
        name: 'gas-meter-change-new',
        component: MeterChangeNew,
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router