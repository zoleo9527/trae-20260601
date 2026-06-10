import { createRouter, createWebHashHistory } from 'vue-router'
import TodoList from '../views/TodoList.vue'
import ComplaintList from '../views/ComplaintList.vue'
import ComplaintDetail from '../views/ComplaintDetail.vue'
import ComplaintRegister from '../views/ComplaintRegister.vue'

const routes = [
  { path: '/', name: 'Todo', component: TodoList, meta: { title: '我的待办' } },
  { path: '/complaints', name: 'ComplaintList', component: ComplaintList, meta: { title: '投诉列表' } },
  { path: '/complaint/:id', name: 'ComplaintDetail', component: ComplaintDetail, meta: { title: '投诉详情' } },
  { path: '/register', name: 'ComplaintRegister', component: ComplaintRegister, meta: { title: '投诉登记' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
