import { defineStore } from 'pinia'
import { login, getProfile } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
  }),
  getters: {
    isLogin: (state) => !!state.token,
    role: (state) => state.userInfo?.role || '',
    roleName: (state) => state.userInfo?.roleName || '',
    userName: (state) => state.userInfo?.name || '',
    canConfirm: (state) => state.userInfo?.role === 'ROLE_OPERATION_SUPERVISOR',
    canExport: (state) => ['ROLE_OPERATION_SUPERVISOR', 'ROLE_SUPERVISOR'].includes(state.userInfo?.role),
    isMerchandise: (state) => state.userInfo?.role === 'ROLE_MERCHANDISE_MANAGER',
  },
  actions: {
    async loginAction(form) {
      const res = await login(form)
      this.token = res.data.token
      this.userInfo = res.data.userInfo
      localStorage.setItem('token', this.token)
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
      return res
    },
    async restoreLogin() {
      if (this.token && !this.userInfo) {
        try {
          const res = await getProfile()
          this.userInfo = res.data
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
        } catch (e) {
          this.logout()
        }
      }
    },
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    },
  },
})
