import { createRouter, createWebHistory } from 'vue-router'
import RoleEntry from '@/views/RoleEntry.vue'
import SalesDesk from '@/views/SalesDesk.vue'
import GrowerDesk from '@/views/GrowerDesk.vue'
import PackerDesk from '@/views/PackerDesk.vue'
import HistoryView from '@/views/HistoryView.vue'

const routes = [
  { path: '/', name: 'entry', component: RoleEntry },
  { path: '/sales', name: 'sales', component: SalesDesk },
  { path: '/grower', name: 'grower', component: GrowerDesk },
  { path: '/packer', name: 'packer', component: PackerDesk },
  { path: '/history', name: 'history', component: HistoryView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
