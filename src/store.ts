import { create } from 'zustand'
import type { ActivityApplication, VenueApproval, Tenant, Complaint, ApplicationStatus, ApprovalStatus } from '@/types'

interface MallStore {
  applications: ActivityApplication[]
  approvals: VenueApproval[]
  tenants: Tenant[]
  complaints: Complaint[]
  currentApplication: ActivityApplication | null
  currentApproval: VenueApproval | null
  loading: boolean

  fetchApplications: (status?: ApplicationStatus, tenant?: string) => Promise<void>
  fetchApplicationDetail: (id: number) => Promise<void>
  createApplication: (data: {
    tenantId: number
    activityName: string
    activityDate: string
    venueName: string
    description: string
    operator: string
  }) => Promise<void>
  processApplication: (id: number, operator: string, remark: string, handover?: string) => Promise<void>
  returnApplication: (id: number, operator: string, remark: string, handover?: string) => Promise<void>
  supplementApplication: (id: number, operator: string, remark: string, description: string, handover?: string) => Promise<void>
  closeApplication: (id: number, operator: string, remark: string, handover?: string) => Promise<void>
  resetApplications: () => Promise<void>

  fetchApprovals: (status?: ApprovalStatus) => Promise<void>
  fetchApprovalDetail: (id: number) => Promise<void>
  approveVenue: (id: number, operator: string, remark: string, handover?: string) => Promise<void>
  rejectVenue: (id: number, operator: string, remark: string, handover?: string) => Promise<void>
  supplementApproval: (id: number, operator: string, remark: string, handover?: string) => Promise<void>

  fetchTenants: () => Promise<void>
  fetchComplaints: (tenantId?: number) => Promise<void>
}

export const useMallStore = create<MallStore>((set, get) => ({
  applications: [],
  approvals: [],
  tenants: [],
  complaints: [],
  currentApplication: null,
  currentApproval: null,
  loading: false,

  fetchApplications: async (status?, tenant?) => {
    set({ loading: true })
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (tenant) params.set('tenant', tenant)
    const res = await fetch(`/api/applications?${params}`)
    const json = await res.json()
    if (json.success) set({ applications: json.data, loading: false })
  },

  fetchApplicationDetail: async (id) => {
    set({ loading: true })
    const res = await fetch(`/api/applications/${id}`)
    const json = await res.json()
    if (json.success) set({ currentApplication: json.data, loading: false })
  },

  createApplication: async (data) => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (json.success) {
      await get().fetchApplications()
    }
  },

  processApplication: async (id, operator, remark, handover) => {
    const res = await fetch(`/api/applications/${id}/process`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, remark, handover }),
    })
    const json = await res.json()
    if (json.success) {
      await get().fetchApplicationDetail(id)
      await get().fetchApplications()
    }
  },

  returnApplication: async (id, operator, remark, handover) => {
    const res = await fetch(`/api/applications/${id}/return`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, remark, handover }),
    })
    const json = await res.json()
    if (json.success) {
      await get().fetchApplicationDetail(id)
      await get().fetchApplications()
    }
  },

  supplementApplication: async (id, operator, remark, description, handover) => {
    const res = await fetch(`/api/applications/${id}/supplement`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, remark, description, handover }),
    })
    const json = await res.json()
    if (json.success) {
      await get().fetchApplicationDetail(id)
      await get().fetchApplications()
    }
  },

  closeApplication: async (id, operator, remark, handover) => {
    const res = await fetch(`/api/applications/${id}/close`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, remark, handover }),
    })
    const json = await res.json()
    if (json.success) {
      await get().fetchApplicationDetail(id)
      await get().fetchApplications()
    }
  },

  resetApplications: async () => {
    await fetch('/api/applications', { method: 'DELETE' })
    await fetch('/api/approvals', { method: 'DELETE' })
    set({ currentApplication: null, currentApproval: null })
    await get().fetchApplications()
    await get().fetchApprovals()
    await get().fetchComplaints()
  },

  fetchApprovals: async (status?) => {
    set({ loading: true })
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    const res = await fetch(`/api/approvals?${params}`)
    const json = await res.json()
    if (json.success) set({ approvals: json.data, loading: false })
  },

  fetchApprovalDetail: async (id) => {
    set({ loading: true })
    const res = await fetch(`/api/approvals/${id}`)
    const json = await res.json()
    if (json.success) set({ currentApproval: json.data, loading: false })
  },

  approveVenue: async (id, operator, remark, handover) => {
    const res = await fetch(`/api/approvals/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, remark, handover }),
    })
    const json = await res.json()
    if (json.success) {
      await get().fetchApprovalDetail(id)
      await get().fetchApprovals()
    }
  },

  rejectVenue: async (id, operator, remark, handover) => {
    const res = await fetch(`/api/approvals/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, remark, handover }),
    })
    const json = await res.json()
    if (json.success) {
      await get().fetchApprovalDetail(id)
      await get().fetchApprovals()
    }
  },

  supplementApproval: async (id, operator, remark, handover) => {
    const res = await fetch(`/api/approvals/${id}/supplement`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator, remark, handover }),
    })
    const json = await res.json()
    if (json.success) {
      await get().fetchApprovalDetail(id)
      await get().fetchApprovals()
    }
  },

  fetchTenants: async () => {
    const res = await fetch('/api/tenants')
    const json = await res.json()
    if (json.success) set({ tenants: json.data })
  },

  fetchComplaints: async (tenantId?) => {
    const url = tenantId ? `/api/complaints/tenant/${tenantId}` : '/api/complaints'
    const res = await fetch(url)
    const json = await res.json()
    if (json.success) set({ complaints: json.data })
  },
}))
