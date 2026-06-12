import { defineStore } from 'pinia'
import type { AcceptanceRecord, CreateAcceptancePayload, EngineerProcessPayload, DirectorProcessPayload, AcceptanceStatus } from '~/types'

export const useAcceptanceStore = defineStore('acceptance', {
  state: () => ({
    records: [] as AcceptanceRecord[],
    loading: false
  }),
  
  getters: {
    getRecordById: (state) => (id: string) => {
      return state.records.find(r => r.id === id)
    },
    
    getRecordsByStatus: (state) => (status: AcceptanceStatus) => {
      return state.records.filter(r => r.status === status)
    },
    
    getPendingForEngineer: (state) => {
      return state.records.filter(r => r.status === 'pending_engineer')
    },
    
    getPendingForDirector: (state) => {
      return state.records.filter(r => r.status === 'pending_director')
    },
    
    getMyRecords: (state) => (managerId: string) => {
      return state.records.filter(r => r.managerId === managerId)
    },
    
    getCompletedRecords: (state) => {
      return state.records.filter(r => r.status === 'completed')
    },
    
    getStatusText: () => (status: AcceptanceStatus) => {
      const map: Record<AcceptanceStatus, string> = {
        draft: '草稿',
        pending_engineer: '待物业验收',
        engineer_rejected: '物业验收退回',
        pending_director: '待费用起算确认',
        director_rejected: '主管审核退回',
        completed: '已完成'
      }
      return map[status]
    },
    
    getStatusColor: () => (status: AcceptanceStatus) => {
      const map: Record<AcceptanceStatus, string> = {
        draft: 'bg-gray-100 text-gray-600',
        pending_engineer: 'bg-yellow-100 text-yellow-700',
        engineer_rejected: 'bg-red-100 text-red-700',
        pending_director: 'bg-blue-100 text-blue-700',
        director_rejected: 'bg-orange-100 text-orange-700',
        completed: 'bg-green-100 text-green-700'
      }
      return map[status]
    }
  },
  
  actions: {
    async fetchRecords() {
      this.loading = true
      try {
        const data = await $fetch<AcceptanceRecord[]>('/api/acceptance')
        this.records = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      } finally {
        this.loading = false
      }
    },
    
    async createRecord(payload: CreateAcceptancePayload) {
      const record = await $fetch<AcceptanceRecord>('/api/acceptance', {
        method: 'POST',
        body: payload
      })
      this.records.unshift(record)
      return record
    },
    
    async submitRecord(recordId: string) {
      const record = await $fetch<AcceptanceRecord>(`/api/acceptance/${recordId}/submit`, {
        method: 'POST'
      })
      const idx = this.records.findIndex(r => r.id === recordId)
      if (idx !== -1) {
        this.records[idx] = record
      }
      return record
    },
    
    async processEngineer(payload: EngineerProcessPayload) {
      const record = await $fetch<AcceptanceRecord>(`/api/acceptance/${payload.recordId}/engineer`, {
        method: 'POST',
        body: payload
      })
      const idx = this.records.findIndex(r => r.id === payload.recordId)
      if (idx !== -1) {
        this.records[idx] = record
      }
      return record
    },
    
    async processDirector(payload: DirectorProcessPayload) {
      const record = await $fetch<AcceptanceRecord>(`/api/acceptance/${payload.recordId}/director`, {
        method: 'POST',
        body: payload
      })
      const idx = this.records.findIndex(r => r.id === payload.recordId)
      if (idx !== -1) {
        this.records[idx] = record
      }
      return record
    },
    
    async resubmitRecord(recordId: string) {
      const record = await $fetch<AcceptanceRecord>(`/api/acceptance/${recordId}/resubmit`, {
        method: 'POST'
      })
      const idx = this.records.findIndex(r => r.id === recordId)
      if (idx !== -1) {
        this.records[idx] = record
      }
      return record
    },
    
    async resetData() {
      await $fetch('/api/reset', { method: 'POST' })
      await this.fetchRecords()
    }
  }
})
