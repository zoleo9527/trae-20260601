import { create } from 'zustand'
import type {
  Role, RoleInfo, DashboardData, AbsenceViolationRecord, ScorePublishRecord,
  CandidateDetail, ExportTask, AuditLog, Room, Subject, Candidate, StageProgress,
  RegistrationInfo, RoomArrangementInfo, InvigilatorInfo, AVStatus
} from '../../shared/types'

interface AppState {
  role: Role | null
  roleInfo: RoleInfo | null
  dashboard: DashboardData | null
  avRecords: (AbsenceViolationRecord & { candidateName?: string; ticketNo?: string; roomName?: string; subjectName?: string })[]
  spRecords: (ScorePublishRecord & { subjectName?: string })[]
  queryResults: CandidateDetail[]
  exportTasks: ExportTask[]
  auditLogs: AuditLog[]
  rooms: Room[]
  subjects: Subject[]
  candidates: Candidate[]
  stageProgress: StageProgress[]
  registration: RegistrationInfo | null
  roomArrangement: RoomArrangementInfo | null
  invigilatorAssignment: InvigilatorInfo | null
  loading: boolean
  error: string | null

  setRole: (role: Role) => Promise<void>
  clearError: () => void
  fetchDashboard: () => Promise<void>
  completeStage: (stage: string) => Promise<void>

  fetchAVRecords: (filters?: Record<string, string>) => Promise<void>
  fetchAVDetail: (id: string) => Promise<{ record: AbsenceViolationRecord; auditLogs: AuditLog[] } | null>
  submitAVRecord: (data: Record<string, any>) => Promise<void>
  reviewAVRecord: (id: string, data: Record<string, any>) => Promise<void>

  fetchSPRecords: (filters?: Record<string, string>) => Promise<void>
  initiateSP: (data: Record<string, any>) => Promise<void>
  approveSP: (id: string, data: Record<string, any>) => Promise<void>
  rejectSP: (id: string, data: Record<string, any>) => Promise<void>
  confirmSP: (id: string, data: Record<string, any>) => Promise<void>
  fetchSPReview: (id: string) => Promise<AuditLog[]>
  fetchSPFlow: (id: string) => Promise<any>

  fetchQuery: (filters: Record<string, string>) => Promise<void>
  fetchExportTasks: () => Promise<void>
  createExportTask: (data: Record<string, any>) => Promise<void>
  fetchAuditLogs: (filters?: Record<string, string>) => Promise<void>
  fetchRooms: () => Promise<void>
  fetchSubjects: () => Promise<void>
  fetchCandidates: () => Promise<void>
  resetData: () => Promise<void>
}

const api = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败，请检查网络或服务是否正常' }))
    throw new Error(err.error || '请求失败')
  }
  return res.json()
}

export const useAppStore = create<AppState>((set, get) => ({
  role: null,
  roleInfo: null,
  dashboard: null,
  avRecords: [],
  spRecords: [],
  queryResults: [],
  exportTasks: [],
  auditLogs: [],
  rooms: [],
  subjects: [],
  candidates: [],
  stageProgress: [],
  registration: null,
  roomArrangement: null,
  invigilatorAssignment: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  setRole: async (role: Role) => {
    try {
      const info = await api('/api/role', { method: 'POST', body: JSON.stringify({ role }) })
      set({ role, roleInfo: info, error: null })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchDashboard: async () => {
    set({ loading: true })
    try {
      const data = await api('/api/dashboard')
      set({
        dashboard: data,
        stageProgress: data.stageProgress || [],
        registration: data.registration || null,
        roomArrangement: data.roomArrangement || null,
        invigilatorAssignment: data.invigilatorAssignment || null,
        loading: false,
        error: null,
      })
    } catch (e: any) {
      set({ loading: false, error: e.message })
    }
  },

  completeStage: async (stage: string) => {
    try {
      const role = get().role
      const roleInfo = get().roleInfo
      await api(`/api/dashboard/stages/${stage}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ operatorRole: role, operatorName: roleInfo?.name }),
      })
      await get().fetchDashboard()
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  fetchAVRecords: async (filters?: Record<string, string>) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams(filters || {}).toString()
      const data = await api(`/api/absence-violation${params ? '?' + params : ''}`)
      set({ avRecords: data.list || [], loading: false, error: null })
    } catch (e: any) {
      set({ loading: false, error: e.message })
    }
  },

  fetchAVDetail: async (id: string) => {
    try {
      const data = await api(`/api/absence-violation/${id}`)
      set({ error: null })
      return data
    } catch (e: any) {
      set({ error: e.message })
      return null
    }
  },

  submitAVRecord: async (data) => {
    const role = get().role
    const roleInfo = get().roleInfo
    try {
      await api('/api/absence-violation', {
        method: 'POST',
        body: JSON.stringify({ ...data, operatorRole: role, operatorName: roleInfo?.name }),
      })
      set({ error: null })
      await get().fetchAVRecords()
      await get().fetchDashboard()
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  reviewAVRecord: async (id, data) => {
    const role = get().role
    const roleInfo = get().roleInfo
    try {
      await api(`/api/absence-violation/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, operatorRole: role, operatorName: roleInfo?.name }),
      })
      set({ error: null })
      await get().fetchAVRecords()
      await get().fetchDashboard()
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  fetchSPRecords: async (filters?: Record<string, string>) => {
    set({ loading: true })
    try {
      const params = new URLSearchParams(filters || {}).toString()
      const data = await api(`/api/score-publish${params ? '?' + params : ''}`)
      set({ spRecords: data.list || [], loading: false, error: null })
    } catch (e: any) {
      set({ loading: false, error: e.message })
    }
  },

  initiateSP: async (data) => {
    const role = get().role
    const roleInfo = get().roleInfo
    try {
      await api('/api/score-publish', {
        method: 'POST',
        body: JSON.stringify({ ...data, operatorRole: role, operatorName: roleInfo?.name }),
      })
      set({ error: null })
      await get().fetchSPRecords()
      await get().fetchDashboard()
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  approveSP: async (id, data) => {
    const role = get().role
    const roleInfo = get().roleInfo
    try {
      await api(`/api/score-publish/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, operatorRole: role, operatorName: roleInfo?.name }),
      })
      set({ error: null })
      await get().fetchSPRecords()
      await get().fetchDashboard()
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  rejectSP: async (id, data) => {
    const role = get().role
    const roleInfo = get().roleInfo
    try {
      await api(`/api/score-publish/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, operatorRole: role, operatorName: roleInfo?.name }),
      })
      set({ error: null })
      await get().fetchSPRecords()
      await get().fetchDashboard()
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  confirmSP: async (id, data) => {
    const role = get().role
    const roleInfo = get().roleInfo
    try {
      await api(`/api/score-publish/${id}/confirm`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, operatorRole: role, operatorName: roleInfo?.name }),
      })
      set({ error: null })
      await get().fetchSPRecords()
      await get().fetchDashboard()
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  fetchSPReview: async (id) => {
    try {
      const data = await api(`/api/score-publish/${id}/review`)
      set({ error: null })
      return data.auditLogs || []
    } catch (e: any) {
      set({ error: e.message })
      return []
    }
  },

  fetchSPFlow: async (id) => {
    try {
      const data = await api(`/api/score-publish/${id}/flow`)
      set({ error: null })
      return data
    } catch (e: any) {
      set({ error: e.message })
      return null
    }
  },

  fetchQuery: async (filters) => {
    set({ loading: true })
    try {
      const role = get().role
      const params = new URLSearchParams({ ...filters, operatorRole: role || '' }).toString()
      const data = await api(`/api/query?${params}`)
      set({ queryResults: data.list || [], loading: false, error: null })
    } catch (e: any) {
      set({ loading: false, error: e.message })
    }
  },

  fetchExportTasks: async () => {
    try {
      const data = await api('/api/export')
      set({ exportTasks: data.list || [], error: null })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  createExportTask: async (data) => {
    const role = get().role
    const roleInfo = get().roleInfo
    try {
      await api('/api/export', {
        method: 'POST',
        body: JSON.stringify({ ...data, operatorRole: role, operatorName: roleInfo?.name }),
      })
      set({ error: null })
      await get().fetchExportTasks()
    } catch (e: any) {
      set({ error: e.message })
      throw e
    }
  },

  fetchAuditLogs: async (filters?: Record<string, string>) => {
    try {
      const params = new URLSearchParams(filters || {}).toString()
      const data = await api(`/api/audit-logs${params ? '?' + params : ''}`)
      set({ auditLogs: data.list || [], error: null })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchRooms: async () => {
    try {
      const data = await api('/api/query?keyword=')
      const roomsMap = new Map<string, Room>()
      const subjectsMap = new Map<string, Subject>()
      const cands: Candidate[] = []
      data.list.forEach((item: any) => {
        if (item.room) roomsMap.set(item.room.id, item.room)
        if (item.subject) subjectsMap.set(item.subject.id, item.subject)
        if (item.candidate) cands.push(item.candidate)
      })
      set({
        rooms: Array.from(roomsMap.values()),
        subjects: Array.from(subjectsMap.values()),
        candidates: cands,
        error: null,
      })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  fetchSubjects: async () => {
    await get().fetchRooms()
  },

  fetchCandidates: async () => {
    await get().fetchRooms()
  },

  resetData: async () => {
    try {
      await api('/api/reset', { method: 'POST' })
      set({ error: null })
      await get().fetchDashboard()
    } catch (e: any) {
      set({ error: e.message })
    }
  },
}))
