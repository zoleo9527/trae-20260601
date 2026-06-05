import { create } from 'zustand'
import type {
  RescueIncident,
  IncidentNote,
  TimelineItem,
  InsuranceMaterial,
  InsuranceMaterialWithNotes,
  OperationLog,
  IncidentFilters,
  IncidentStatus,
  NoteCategory,
  MaterialStatus,
} from '@/shared/types'

interface IncidentState {
  incidents: RescueIncident[]
  currentIncident: RescueIncident | null
  timeline: TimelineItem[]
  notes: IncidentNote[]
  insuranceMaterials: InsuranceMaterialWithNotes[]
  rescueMedicalNotes: IncidentNote[]
  operationLogs: OperationLog[]
  loading: boolean
  filters: IncidentFilters
}

interface IncidentActions {
  fetchIncidents: () => Promise<void>
  fetchIncidentDetail: (id: string) => Promise<void>
  fetchTimeline: (id: string) => Promise<void>
  fetchNotes: (id: string) => Promise<void>
  fetchRescueMedicalNotes: (id: string) => Promise<void>
  addNote: (incidentId: string, data: { author: string; category: NoteCategory; content: string; referenced_note_id?: string }) => Promise<void>
  transitionStatus: (incidentId: string, toStatus: IncidentStatus, operator: string, remark: string) => Promise<void>
  fetchInsuranceMaterials: (incidentId: string) => Promise<void>
  addInsuranceMaterial: (incidentId: string, data: { material_type: string; notes?: string; reviewer?: string; referenced_note_ids?: string[] }) => Promise<void>
  updateInsuranceMaterial: (materialId: string, incidentId: string, data: { status?: MaterialStatus; reviewer?: string; notes?: string; anomaly_explanation?: string; referenced_note_ids?: string[] }) => Promise<void>
  addAnomalyExplanation: (materialId: string, incidentId: string, anomaly_explanation: string, operator: string) => Promise<void>
  setFilters: (filters: Partial<IncidentFilters>) => void
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  const result = await res.json() as ApiResponse<T>
  if (!result.success) throw new Error(result.error || 'API Error')
  return result.data
}

export const useIncidentStore = create<IncidentState & IncidentActions>((set, get) => ({
  incidents: [],
  currentIncident: null,
  timeline: [],
  notes: [],
  insuranceMaterials: [],
  rescueMedicalNotes: [],
  operationLogs: [],
  loading: false,
  filters: { status: '', responsible_person: '', search: '' },

  fetchIncidents: async () => {
    set({ loading: true })
    try {
      const { filters } = get()
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.responsible_person) params.set('responsible_person', filters.responsible_person)
      if (filters.search) params.set('search', filters.search)
      const data = await api<RescueIncident[]>(`/api/incidents?${params.toString()}`)
      set({ incidents: data })
    } catch (e) {
      console.error('fetchIncidents error:', e)
      set({ incidents: [] })
    } finally {
      set({ loading: false })
    }
  },

  fetchIncidentDetail: async (id) => {
    set({ loading: true })
    try {
      const data = await api<RescueIncident & { notes: IncidentNote[]; operation_logs: OperationLog[]; insurance_materials: InsuranceMaterialWithNotes[] }>(`/api/incidents/${id}`)
      set({
        currentIncident: data,
        notes: data.notes || [],
        operationLogs: data.operation_logs || [],
        insuranceMaterials: data.insurance_materials || [],
      })
    } catch (e) {
      console.error('fetchIncidentDetail error:', e)
      set({ currentIncident: null, notes: [], operationLogs: [], insuranceMaterials: [] })
    } finally {
      set({ loading: false })
    }
  },

  fetchTimeline: async (id) => {
    try {
      const data = await api<TimelineItem[]>(`/api/incidents/${id}/timeline`)
      set({ timeline: data })
    } catch (e) {
      console.error('fetchTimeline error:', e)
      set({ timeline: [] })
    }
  },

  fetchNotes: async (id) => {
    try {
      const data = await api<IncidentNote[]>(`/api/incidents/${id}/notes`)
      set({ notes: data })
    } catch (e) {
      console.error('fetchNotes error:', e)
      set({ notes: [] })
    }
  },

  fetchRescueMedicalNotes: async (id) => {
    try {
      const data = await api<IncidentNote[]>(`/api/incidents/${id}/notes/rescue-medical`)
      set({ rescueMedicalNotes: data })
    } catch (e) {
      console.error('fetchRescueMedicalNotes error:', e)
      set({ rescueMedicalNotes: [] })
    }
  },

  addNote: async (incidentId, noteData) => {
    try {
      await api(`/api/incidents/${incidentId}/notes`, {
        method: 'POST',
        body: JSON.stringify(noteData),
      })
      await Promise.all([
        get().fetchTimeline(incidentId),
        get().fetchNotes(incidentId),
        get().fetchIncidentDetail(incidentId),
      ])
    } catch (e) {
      console.error('addNote error:', e)
    }
  },

  transitionStatus: async (incidentId, toStatus, operator, remark) => {
    try {
      await api(`/api/incidents/${incidentId}/status`, {
        method: 'POST',
        body: JSON.stringify({ to_status: toStatus, operator, remark }),
      })
      await Promise.all([
        get().fetchIncidentDetail(incidentId),
        get().fetchTimeline(incidentId),
      ])
    } catch (e) {
      console.error('transitionStatus error:', e)
    }
  },

  fetchInsuranceMaterials: async (incidentId) => {
    try {
      const data = await api<InsuranceMaterialWithNotes[]>(`/api/incidents/${incidentId}/insurance-materials`)
      set({ insuranceMaterials: data })
    } catch (e) {
      console.error('fetchInsuranceMaterials error:', e)
      set({ insuranceMaterials: [] })
    }
  },

  addInsuranceMaterial: async (incidentId, materialData) => {
    try {
      await api(`/api/incidents/${incidentId}/insurance-materials`, {
        method: 'POST',
        body: JSON.stringify(materialData),
      })
      await get().fetchInsuranceMaterials(incidentId)
    } catch (e) {
      console.error('addInsuranceMaterial error:', e)
    }
  },

  updateInsuranceMaterial: async (materialId, incidentId, data) => {
    try {
      await api(`/api/incidents/${incidentId}/insurance-materials/${materialId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      await get().fetchInsuranceMaterials(incidentId)
    } catch (e) {
      console.error('updateInsuranceMaterial error:', e)
    }
  },

  addAnomalyExplanation: async (materialId, incidentId, anomaly_explanation, operator) => {
    try {
      await api(`/api/incidents/${incidentId}/insurance-materials/${materialId}/anomaly`, {
        method: 'POST',
        body: JSON.stringify({ anomaly_explanation, operator }),
      })
      await Promise.all([
        get().fetchInsuranceMaterials(incidentId),
        get().fetchTimeline(incidentId),
      ])
    } catch (e) {
      console.error('addAnomalyExplanation error:', e)
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }))
  },
}))
