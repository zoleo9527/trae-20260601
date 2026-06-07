import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userId: null,
    username: '',
    realName: '',
    role: '',
    token: ''
  }),
  getters: {
    isBooking: (state) => state.role === 'BOOKING',
    isFloor: (state) => state.role === 'FLOOR',
    isBar: (state) => state.role === 'BAR',
    isAdmin: (state) => state.role === 'ADMIN',
    roleName: (state) => {
      const map = {
        BOOKING: '预订员',
        FLOOR: '楼面经理',
        BAR: '吧台',
        ADMIN: '管理员'
      }
      return map[state.role] || state.role
    }
  },
  actions: {
    setUser(userInfo) {
      this.userId = userInfo.userId
      this.username = userInfo.username
      this.realName = userInfo.realName
      this.role = userInfo.role
      this.token = userInfo.token
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    clearUser() {
      this.userId = null
      this.username = ''
      this.realName = ''
      this.role = ''
      this.token = ''
      localStorage.removeItem('userInfo')
    },
    loadUser() {
      const saved = localStorage.getItem('userInfo')
      if (saved) {
        const userInfo = JSON.parse(saved)
        this.setUser(userInfo)
      }
    }
  }
})
