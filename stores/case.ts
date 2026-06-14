import { defineStore } from 'pinia'
import type { CaseReport, MaterialList, OperationLog } from '~/types'

interface CaseState {
  cases: CaseReport[]
  currentCase: CaseReport | null
  materials: MaterialList[]
  logs: OperationLog[]
  loading: boolean
  error: string | null
}

export const useCaseStore = defineStore('case', {
  state: (): CaseState => ({
    cases: [],
    currentCase: null,
    materials: [],
    logs: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchCases(params?: Record<string, string>) {
      this.loading = true
      this.error = null
      try {
        const query = new URLSearchParams(params || {}).toString()
        const response = await $fetch(`/api/cases${query ? '?' + query : ''}`)
        this.cases = response.cases
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async fetchCase(id: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch(`/api/cases/${id}`)
        this.currentCase = response.case
        this.materials = response.case.materials || []
        this.logs = response.case.logs || []
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async createCase(data: any) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch('/api/cases', {
          method: 'POST',
          body: data
        })
        this.cases.unshift(response.case)
        return response.case
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async submitCase(id: string, operatorId: string, operatorRole: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch(`/api/cases/${id}/submit`, {
          method: 'POST',
          body: { operatorId, operatorRole }
        })
        this.currentCase = response.case
        this.updateCaseInList(response.case)
        return response.case
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async rejectCase(id: string, operatorId: string, reason: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch(`/api/cases/${id}/reject`, {
          method: 'POST',
          body: { operatorId, reason }
        })
        this.currentCase = response.case
        this.updateCaseInList(response.case)
        return response.case
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async reviewFailCase(id: string, operatorId: string, reason: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch(`/api/cases/${id}/review-fail`, {
          method: 'POST',
          body: { operatorId, reason }
        })
        this.currentCase = response.case
        this.updateCaseInList(response.case)
        return response.case
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async completeCase(id: string, operatorId: string, operatorRole?: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch(`/api/cases/${id}/complete`, {
          method: 'POST',
          body: { operatorId, operatorRole }
        })
        this.currentCase = response.case
        this.updateCaseInList(response.case)
        return response.case
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async createMaterial(data: any) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch('/api/materials', {
          method: 'POST',
          body: data
        })
        this.materials.push(response.material)
        return response.material
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async uploadMaterial(id: string, attachmentUrl: string, operatorId: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch(`/api/materials/${id}/upload`, {
          method: 'POST',
          body: { attachmentUrl, operatorId }
        })
        this.updateMaterialInList(response.material)
        return response.material
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async verifyMaterial(id: string, operatorId: string, status: 'confirmed' | 'rejected', remark?: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch(`/api/materials/${id}/verify`, {
          method: 'POST',
          body: { operatorId, status, remark }
        })
        this.updateMaterialInList(response.material)
        return response.material
      } catch (error: any) {
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async fetchLogs(caseId: string) {
      try {
        const response = await $fetch(`/api/logs/${caseId}`)
        this.logs = response.logs
      } catch (error: any) {
        this.error = error.message
        throw error
      }
    },
    
    updateCaseInList(updatedCase: CaseReport) {
      const index = this.cases.findIndex(c => c.id === updatedCase.id)
      if (index !== -1) {
        this.cases[index] = updatedCase
      }
    },
    
    updateMaterialInList(updatedMaterial: MaterialList) {
      const index = this.materials.findIndex(m => m.id === updatedMaterial.id)
      if (index !== -1) {
        this.materials[index] = updatedMaterial
      }
    }
  }
})
