import { create } from 'zustand'
import type { RoleType, AppointmentRecord, ActionLog } from '@/types'

interface AppState {
  currentRole: RoleType | null
  setCurrentRole: (role: RoleType) => void
  clearRole: () => void
  records: AppointmentRecord[]
  setRecords: (records: AppointmentRecord[]) => void
  selectedRecord: AppointmentRecord | null
  setSelectedRecord: (record: AppointmentRecord | null) => void
  logs: ActionLog[]
  setLogs: (logs: ActionLog[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  currentRole: null,
  setCurrentRole: (role) => set({ currentRole: role }),
  clearRole: () => set({ currentRole: null, records: [], selectedRecord: null }),
  records: [],
  setRecords: (records) => set({ records }),
  selectedRecord: null,
  setSelectedRecord: (record) => set({ selectedRecord: record }),
  logs: [],
  setLogs: (logs) => set({ logs }),
  loading: false,
  setLoading: (loading) => set({ loading }),
}))
