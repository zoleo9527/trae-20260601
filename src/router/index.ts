import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Residents from '@/views/Residents.vue'
import Houses from '@/views/Houses.vue'
import AccessCards from '@/views/AccessCards.vue'
import PermissionGroups from '@/views/PermissionGroups.vue'
import Applications from '@/views/Applications.vue'
import OperationLogs from '@/views/OperationLogs.vue'
import AccessEvents from '@/views/AccessEvents.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard, meta: { title: '仪表盘' } },
  { path: '/residents', name: 'Residents', component: Residents, meta: { title: '住户管理' } },
  { path: '/houses', name: 'Houses', component: Houses, meta: { title: '房屋管理' } },
  { path: '/cards', name: 'AccessCards', component: AccessCards, meta: { title: '门禁卡管理' } },
  { path: '/permissions', name: 'PermissionGroups', component: PermissionGroups, meta: { title: '权限组管理' } },
  { path: '/applications', name: 'Applications', component: Applications, meta: { title: '申请审核' } },
  { path: '/logs', name: 'OperationLogs', component: OperationLogs, meta: { title: '操作记录' } },
  { path: '/events', name: 'AccessEvents', component: AccessEvents, meta: { title: '门禁事件' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '门禁卡管理系统'} - 门禁卡管理系统`
})

export default router
