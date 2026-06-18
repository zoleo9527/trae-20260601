import { reactive, computed } from 'vue'
import type { User, VisitRecord, Issue, FlowRecord } from '@/types'
import * as api from '@/api'

interface State {
  currentUser: User | null
  isLoggedIn: boolean
  visitRecords: VisitRecord[]
  issues: Issue[]
  flowRecords: FlowRecord[]
  loading: boolean
  error: string | null
}

const state = reactive<State>({
  currentUser: null,
  isLoggedIn: false,
  visitRecords: [],
  issues: [],
  flowRecords: [],
  loading: false,
  error: null
})

export function useStore() {
  const blockedVisits = computed(() => 
    state.visitRecords.filter(v => v.status === 'blocked')
  )
  
  const overdueVisits = computed(() => 
    state.visitRecords.filter(v => v.status === 'overdue')
  )
  
  const pendingIssues = computed(() => 
    state.issues.filter(i => i.status === 'pending')
  )
  
  const escalatedIssues = computed(() => 
    state.issues.filter(i => i.status === 'escalated')
  )

  async function login(username: string, password: string) {
    state.loading = true
    state.error = null
    try {
      const user = await api.login(username, password)
      state.currentUser = user
      state.isLoggedIn = true
      await loadData()
    } catch (err) {
      state.error = err instanceof Error ? err.message : '登录失败'
    } finally {
      state.loading = false
    }
  }

  function logout() {
    state.currentUser = null
    state.isLoggedIn = false
    state.visitRecords = []
    state.issues = []
    state.flowRecords = []
  }

  async function switchUser(userId: string) {
    state.loading = true
    try {
      const user = await api.getUserById(userId)
      if (user) {
        state.currentUser = user
        await loadData()
      }
    } catch (err) {
      state.error = err instanceof Error ? err.message : '切换失败'
    } finally {
      state.loading = false
    }
  }

  async function loadData() {
    state.loading = true
    try {
      const [visits, issues] = await Promise.all([
        api.getVisitRecords(),
        api.getIssues()
      ])
      state.visitRecords = visits
      state.issues = issues
    } catch (err) {
      state.error = err instanceof Error ? err.message : '加载失败'
    } finally {
      state.loading = false
    }
  }

  async function loadFlowRecords(type: 'visit' | 'issue', id: string) {
    try {
      const flows = await api.getFlowRecords(type, id)
      return flows
    } catch (err) {
      state.error = err instanceof Error ? err.message : '获取流转记录失败'
      return []
    }
  }

  async function createVisitRecord(data: {
    keyPersonId: string
    socialWorkerId: string
    socialWorkerName: string
    scheduledDate: string
    notes?: string
  }) {
    state.loading = true
    try {
      const newRecord = await api.createVisitRecord(data)
      state.visitRecords.push(newRecord)
      return newRecord
    } catch (err) {
      state.error = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      state.loading = false
    }
  }

  async function updateVisitRecord(id: string, data: Partial<VisitRecord>) {
    state.loading = true
    try {
      const updated = await api.updateVisitRecord(id, {
        ...data,
        operatorId: state.currentUser?.id,
        operatorName: state.currentUser?.name,
        operatorRole: state.currentUser?.role
      })
      if (updated) {
        const index = state.visitRecords.findIndex(v => v.id === id)
        if (index !== -1) {
          state.visitRecords[index] = updated
        }
      }
    } catch (err) {
      state.error = err instanceof Error ? err.message : '更新失败'
    } finally {
      state.loading = false
    }
  }

  async function createIssue(data: {
    visitId: string
    reporterId: string
    reporterName: string
    title: string
    description: string
    category: string
  }) {
    state.loading = true
    try {
      const newIssue = await api.createIssue(data)
      state.issues.push(newIssue)
      return newIssue
    } catch (err) {
      state.error = err instanceof Error ? err.message : '创建失败'
      throw err
    } finally {
      state.loading = false
    }
  }

  async function updateIssue(id: string, data: Partial<Issue>) {
    state.loading = true
    try {
      const updated = await api.updateIssue(id, {
        ...data,
        operatorId: state.currentUser?.id,
        operatorName: state.currentUser?.name,
        operatorRole: state.currentUser?.role
      })
      if (updated) {
        const index = state.issues.findIndex(i => i.id === id)
        if (index !== -1) {
          state.issues[index] = updated
        }
      }
    } catch (err) {
      state.error = err instanceof Error ? err.message : '更新失败'
    } finally {
      state.loading = false
    }
  }

  function clearError() {
    state.error = null
  }

  return {
    state,
    blockedVisits,
    overdueVisits,
    pendingIssues,
    escalatedIssues,
    login,
    logout,
    switchUser,
    loadData,
    loadFlowRecords,
    createVisitRecord,
    updateVisitRecord,
    createIssue,
    updateIssue,
    clearError
  }
}