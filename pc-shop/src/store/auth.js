import { defineStore } from 'pinia'

const USERS = [
  {
    id: 1,
    username: 'manager',
    password: '123456',
    name: '张店长',
    role: 'manager',
    roleName: '店长',
    avatar: 'M'
  },
  {
    id: 2,
    username: 'sales',
    password: '123456',
    name: '小李',
    role: 'sales',
    roleName: '销售',
    avatar: '销'
  },
  {
    id: 3,
    username: 'warehouse',
    password: '123456',
    name: '王仓管',
    role: 'warehouse',
    roleName: '仓管',
    avatar: '仓'
  },
  {
    id: 4,
    username: 'tech',
    password: '123456',
    name: '陈工',
    role: 'tech',
    roleName: '装机师',
    avatar: '技'
  },
  {
    id: 5,
    username: 'service',
    password: '123456',
    name: '客服小周',
    role: 'service',
    roleName: '售后客服',
    avatar: '客'
  }
]

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('pcshop_user') || 'null'),
    users: USERS
  }),
  getters: {
    isLoggedIn: (state) => !!state.user,
    userRole: (state) => state.user?.role,
    userName: (state) => state.user?.name,
    canViewArrivals: (state) => !state.user || ['manager', 'warehouse'].includes(state.user.role),
    canViewSchedules: (state) => !state.user || ['manager', 'sales', 'tech'].includes(state.user.role),
    canHandleAnomalies: (state) => !state.user || ['manager', 'service'].includes(state.user.role)
  },
  actions: {
    login(username, password) {
      const user = this.users.find(u => u.username === username && u.password === password)
      if (user) {
        const { password: _, ...safeUser } = user
        this.user = safeUser
        localStorage.setItem('pcshop_user', JSON.stringify(safeUser))
        return true
      }
      return false
    },
    logout() {
      this.user = null
      localStorage.removeItem('pcshop_user')
    }
  }
})
